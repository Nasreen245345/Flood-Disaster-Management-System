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
    validUntil?: Date;
    createdAt: Date;
    requiredAmount?: number;
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
        // Need token in headers? AuthService usually handles interceptor, but if not:
        const token = localStorage.getItem('dms_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.get<any>(`${this.apiUrl}/my-requests`, { headers }).subscribe({
            next: (res) => {
                if (res.success) {
                    const mappedRequests: VictimRequest[] = res.data.map((r: any) => ({
                        id: r._id,
                        type: this.capitalize(r.category),
                        urgency: this.capitalize(r.urgency),
                        note: r.description,
                        status: this.capitalize(r.status),
                        createdAt: new Date(r.createdAt),
                        requiredAmount: r.requiredAmount
                    }));
                    this._requests.next(mappedRequests);
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

        console.log('Form Data Received:', formData);
        console.log('Items array:', formData.items);
        console.log('First item:', formData.items[0]);

        // The form has an array of items. We create one request per item.
        const requests = formData.items.map((item: any, index: number) => {
            console.log(`Item ${index}:`, item);
            console.log(`Item ${index} quantity:`, item.quantity);
            const payload = {
                title: `Request for ${item.category || 'aid'}`,
                description: formData.notes || '',
                category: item.category ? item.category.toLowerCase() : 'other',
                urgency: formData.urgency ? formData.urgency.toLowerCase() : 'medium',
                location: formData.location,
                requiredAmount: item.quantity || 'Not specified',
                peopleCount: formData.peopleCount || 1
            };
            console.log('Payload to send:', payload);
            return payload;
        });

        const observables = requests.map((req: any) =>
            this.http.post<any>(this.apiUrl, req, { headers })
        );

        return forkJoin(observables).pipe(
            tap(() => {
                // Refresh list
                this.loadMyRequests();
            })
        );
    }
}
