import { Injectable, inject, effect } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { AuthService } from '../../../auth/services/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface AidHistory {
    id: string;
    type: string;
    date: Date;
    ngoName: string;
    pointName: string;
    quantity: string;
}

export interface DistributionPoint {
    id: string;
    name: string;
    location: string;
    activeNGOs: string[];
    hours: string;
    status: 'Active' | 'Closed';
}

export interface VictimRequest {
    id: string;
    type: string;
    urgency: string;
    note?: string;
    status: string;
    allocatedNGO?: string;
    allocatedPoint?: string;
    ngoContact?: string;
    ngoId?: string;
    nearestShift?: any;
    location?: string;
    validUntil?: Date;
    createdAt: Date;
    requiredAmount?: number;
    fulfilledDate?: Date;
    packagesNeeded?: any[];
}

export interface VictimProfile {
    id?: string;
    name: string;
    familySize?: number;
    specialNeeds?: string[];
    contact?: string;
    qrCodeData?: string;
    location?: string;
    phone?: string;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class VictimService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);
    private apiUrl = 'http://localhost:5000/api/aid-requests';

    // State
    private _history = new BehaviorSubject<AidHistory[]>([]);
    private _points = new BehaviorSubject<DistributionPoint[]>([]);
    private _profile = new BehaviorSubject<VictimProfile>({
        name: 'Guest',
        familySize: 1,
        specialNeeds: [],
        contact: '',
        qrCodeData: '',
        location: '',
        phone: '',
        email: ''
    });
    private _requests = new BehaviorSubject<VictimRequest[]>([]);

    // Observables
    history$ = this._history.asObservable();
    points$ = this._points.asObservable();
    requests$ = this._requests.asObservable();
    profile$ = this._profile.asObservable();

    constructor() {
        // Reactively update profile when user changes
        effect(() => {
            const user = this.authService.getCurrentUser();
            if (user) {
                this._profile.next({
                    id: user.id,
                    name: user.name,
                    familySize: 1,
                    contact: user.phone || 'Not provided',
                    qrCodeData: user.id || 'SECURE-TOKEN',
                    location: user.region || 'Unknown',
                    phone: user.phone || 'Not provided',
                    email: user.email || 'Not provided'
                });

                // Fetch requests when user is logged in
                this.loadMyRequests();
            }
        });
    }

    loadMyRequests() {
        const token = localStorage.getItem('dms_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.get<any>(`${this.apiUrl}/my-requests`, { headers }).subscribe({
            next: (res) => {
                if (res.success) {
                    const allRequests = res.data.map((r: any) => ({
                        id: r._id,
                        type: r.packagesNeeded?.map((p: any) => p.packageName).join(', ') || 'Aid',
                        urgency: this.capitalize(r.urgency),
                        note: r.additionalNotes,
                        status: r.status, // keep raw status for filtering
                        createdAt: new Date(r.createdAt),
                        requiredAmount: r.peopleCount,
                        allocatedNGO: r.assignedNGO?.name,
                        allocatedPoint: r.distributionPoint || null,
                        ngoContact: r.assignedNGO?.contact?.phone,
                        ngoId: r.assignedNGO?._id,
                        nearestShift: r.nearestShift || null,
                        location: r.location,
                        fulfilledDate: r.fulfilledDate || null,
                        packagesNeeded: r.packagesNeeded || []
                    }));

                    // Active requests: not fulfilled/rejected
                    const active = allRequests.filter((r: any) =>
                        !['fulfilled', 'rejected'].includes(r.status)
                    );
                    this._requests.next(active);

                    // History: fulfilled requests
                    const history: AidHistory[] = allRequests
                        .filter((r: any) => r.status === 'fulfilled')
                        .map((r: any) => ({
                            id: r.id,
                            type: r.type,
                            date: r.fulfilledDate ? new Date(r.fulfilledDate) : r.createdAt,
                            ngoName: r.allocatedNGO || 'Unknown NGO',
                            pointName: r.nearestShift?.location || r.allocatedPoint || 'Distribution Center',
                            quantity: `${r.requiredAmount || 1} person(s)`
                        }));
                    this._history.next(history);
                }
            },
            error: (err) => console.error('Error loading requests', err)
        });
    }

    private capitalize(s: string): string {
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    submitRequest(formData: any): Observable<any> {
        const token = localStorage.getItem('dms_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        // Map packages - form has {category} but backend needs {category, packageName, quantity}
        const packageLabels: Record<string, string> = {
            food: 'Food Package',
            medical: 'Medical Kit',
            shelter: 'Shelter Kit',
            clothing: 'Clothing Package'
        };

        const packagesNeeded = (formData.packagesNeeded || []).map((p: any) => ({
            category: p.category,
            packageName: packageLabels[p.category] || p.category,
            quantity: formData.peopleCount || 1
        }));

        const payload = {
            victimName: formData.victimName,
            victimCNIC: formData.victimCNIC,
            victimPhone: formData.victimPhone,
            location: formData.location,
            packagesNeeded,
            urgency: formData.urgency?.toLowerCase() || 'medium',
            peopleCount: formData.peopleCount || 1,
            additionalNotes: formData.additionalNotes || ''
        };

        console.log('Submitting aid request:', payload);

        return this.http.post<any>(this.apiUrl, payload, { headers }).pipe(
            tap(() => this.loadMyRequests())
        );
    }
}
