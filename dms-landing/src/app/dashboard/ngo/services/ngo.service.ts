import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';

// --- Interfaces ---
export interface Region {
    id: string;
    name: string;
    disasterType: string;
    population: number;
    requiredResources: string;
    status: 'Active' | 'Completed';
    location: string;
    lastUpdate: Date;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: 'Food' | 'Medical' | 'Shelter' | 'Clothing';
    quantity: number;
    unit: string;
    lastUpdated: Date;
}

export interface AidRequest {
    id: string;
    victimId: string;
    victimName: string;
    region: string;
    items: string[];
    priority: 'High' | 'Medium' | 'Low';
    status: 'Approved' | 'Ready for Distribution' | 'Delivered';
    requestDate: Date;
}

export interface Volunteer {
    id: string;
    name: string;
    expertise: string;
    availability: 'Available' | 'Assigned' | 'Offline';
    assignedTask?: string;
    contact: string;
}

export interface DistributionLog {
    id: string;
    victimId: string;
    victimName?: string;
    region: string;
    items: string[];
    distributedBy: string; // Volunteer Name or NGO Staff
    timestamp: Date;
}

@Injectable({
    providedIn: 'root'
})
export class NgoService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api';

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('dms_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }
    // --- Mock Data ---
    private _regions = new BehaviorSubject<Region[]>([
        { id: '1', name: 'Nowshera Block B', disasterType: 'Flood', population: 2500, requiredResources: 'Boats, Food, Medicine', status: 'Active', location: 'Nowshera, KPK', lastUpdate: new Date() },
        { id: '2', name: 'Dadu Sector 5', disasterType: 'Flood', population: 1200, requiredResources: 'Tents, Mosquito Nets', status: 'Active', location: 'Dadu, Sindh', lastUpdate: new Date(Date.now() - 86400000) },
        { id: '3', name: 'Quetta Zone 1', disasterType: 'Earthquake', population: 5000, requiredResources: 'Shelter, Blankets', status: 'Active', location: 'Quetta, Balochistan', lastUpdate: new Date() }
    ]);

    private _inventory = new BehaviorSubject<InventoryItem[]>([
        { id: '1', name: 'Wheat Flour (10kg)', category: 'Food', quantity: 200, unit: 'Bags', lastUpdated: new Date() },
        { id: '2', name: 'Mineral Water (1.5L)', category: 'Food', quantity: 5000, unit: 'Bottles', lastUpdated: new Date() },
        { id: '3', name: 'Panadol & First Aid', category: 'Medical', quantity: 150, unit: 'Kits', lastUpdated: new Date() },
        { id: '4', name: 'Canvas Tents', category: 'Shelter', quantity: 50, unit: 'Units', lastUpdated: new Date() }
    ]);

    private _aidRequests = new BehaviorSubject<AidRequest[]>([
        { id: 'R101', victimId: 'V502', victimName: 'Muhammad Ali', region: 'Nowshera Block B', items: ['Wheat Flour', 'Tent'], priority: 'High', status: 'Approved', requestDate: new Date() },
        { id: 'R102', victimId: 'V509', victimName: 'Fatima Batool', region: 'Dadu Sector 5', items: ['Medical Kit', 'Mosquito Net'], priority: 'Medium', status: 'Approved', requestDate: new Date() },
        { id: 'R103', victimId: 'V601', victimName: 'Zainab Bibi', region: 'Quetta Zone 1', items: ['Blankets', 'Water'], priority: 'High', status: 'Ready for Distribution', requestDate: new Date() }
    ]);

    private _volunteers = new BehaviorSubject<Volunteer[]>([
        { id: 'V1', name: 'Usman Ghani', expertise: 'Logistics', availability: 'Available', contact: '0300-1234567' },
        { id: 'V2', name: 'Ayesha Khan', expertise: 'Medical', availability: 'Assigned', assignedTask: 'Medical Camp in Dadu', contact: '0301-7654321' },
        { id: 'V3', name: 'Hamza Malik', expertise: 'Rescue', availability: 'Available', contact: '0333-5555555' }
    ]);

    private _distributionLogs = new BehaviorSubject<DistributionLog[]>([
        { id: 'D001', victimId: 'V400', victimName: 'Rashid Minhas', region: 'Nowshera Block B', items: ['Food Pack'], distributedBy: 'Usman Ghani', timestamp: new Date(Date.now() - 10000000) }
    ]);

    // --- Observables ---
    regions$ = this._regions.asObservable();
    inventory$ = this._inventory.asObservable();
    aidRequests$ = this._aidRequests.asObservable();
    volunteers$ = this._volunteers.asObservable();
    logs$ = this._distributionLogs.asObservable();

    // --- Methods ---

    // Inventory
    addInventoryItem(item: Omit<InventoryItem, 'id' | 'lastUpdated'>) {
        const newItem: InventoryItem = {
            ...item,
            id: Math.random().toString(36).substring(7),
            lastUpdated: new Date()
        };
        this._inventory.next([...this._inventory.value, newItem]);
    }

    updateInventoryQuantity(id: string, delta: number) {
        const items = this._inventory.value;
        const item = items.find(i => i.id === id);
        if (item) {
            item.quantity = Math.max(0, item.quantity + delta);
            item.lastUpdated = new Date();
            this._inventory.next([...items]);
        }
    }

    // Aid Requests
    moveToReady(id: string) {
        const requests = this._aidRequests.value;
        const req = requests.find(r => r.id === id);
        if (req) {
            req.status = 'Ready for Distribution';
            this._aidRequests.next([...requests]);
        }
    }

    // Distribution
    distributeAid(victimId: string, regionId: string, items: { name: string, quantity: number, isManual: boolean }[], volunteerName: string) {
        // 1. Log Distribution
        const itemStrings = items.map(i => `${i.quantity}x ${i.name} ${i.isManual ? '(Manual)' : ''}`);

        const newLog: DistributionLog = {
            id: Math.random().toString(36).substring(7),
            victimId,
            region: this._regions.value.find(r => r.id === regionId)?.name || 'Unknown',
            items: itemStrings,
            distributedBy: volunteerName,
            timestamp: new Date()
        };
        this._distributionLogs.next([newLog, ...this._distributionLogs.value]);

        // 2. Update Request Status (if linked to a request)
        const requests = this._aidRequests.value;
        const req = requests.find(r => r.victimId === victimId && r.status !== 'Delivered');
        if (req) {
            req.status = 'Delivered';
            this._aidRequests.next([...requests]);
        }

        // 3. Deduct Inventory
        const inv = this._inventory.value;
        items.forEach(distItem => {
            if (!distItem.isManual) {
                // Find inventory item matching the name
                const match = inv.find(i => i.name === distItem.name);
                if (match) {
                    match.quantity = Math.max(0, match.quantity - distItem.quantity);
                }
            }
        });
        this._inventory.next([...inv]);

        return of(true).pipe(delay(800)); // Simulate API call
    }

    // Volunteers
    assignVolunteer(id: string, task: string) {
        const vols = this._volunteers.value;
        const v = vols.find(vol => vol.id === id);
        if (v) {
            v.availability = 'Assigned';
            v.assignedTask = task;
            this._volunteers.next([...vols]);
        }
    }

    addVolunteer(volunteerData: any) {
        const newVol: Volunteer = {
            id: Math.random().toString(36).substring(7),
            name: volunteerData.name,
            expertise: volunteerData.expertise,
            availability: 'Available',
            contact: volunteerData.contact
        };
        this._volunteers.next([newVol, ...this._volunteers.value]);
    }

    unassignVolunteer(id: string) {
        const vols = this._volunteers.value;
        const v = vols.find(vol => vol.id === id);
        if (v) {
            v.availability = 'Available';
            v.assignedTask = undefined;
            this._volunteers.next([...vols]);
        }
    }

    // ========== NEW API INTEGRATION METHODS ==========

    // Get NGO organization
    getMyOrganization(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/organizations/me`, { 
            headers: this.getHeaders() 
        });
    }

    // Get volunteers for NGO
    getVolunteers(ngoId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/volunteers/ngo/${ngoId}`, { 
            headers: this.getHeaders() 
        });
    }

    // Get capacity calculation
    getCapacity(ngoId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/volunteers/capacity/${ngoId}`, { 
            headers: this.getHeaders() 
        });
    }

    // Verify volunteer
    verifyVolunteer(volunteerId: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/volunteers/${volunteerId}/verify`, {
            verifiedByNGO: true,
            verificationStatus: 'verified'
        }, { headers: this.getHeaders() });
    }

    // Update inventory
    updateInventory(ngoId: string, inventory: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/organizations/${ngoId}/inventory`, 
            inventory, 
            { headers: this.getHeaders() }
        );
    }

    // Update active distributions
    updateActiveDistributions(ngoId: string, count: number): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/organizations/${ngoId}/distributions`, {
            activeDistributions: count
        }, { headers: this.getHeaders() });
    }

    // Get all organizations (for admin)
    getAllOrganizations(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/organizations`, { 
            headers: this.getHeaders() 
        });
    }

    // Get assigned regions for NGO
    getAssignedRegions(ngoId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/region-assignments/ngo/${ngoId}`, {
            headers: this.getHeaders()
        });
    }

    // Update assignment status
    updateAssignmentStatus(assignmentId: string, status: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/region-assignments/${assignmentId}/status`, {
            status
        }, { headers: this.getHeaders() });
    }

    // Get aid requests for NGO
    getAidRequests(ngoId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/aid-requests/ngo/${ngoId}`, {
            headers: this.getHeaders()
        });
    }

    // Update aid request status
    updateAidRequestStatus(requestId: string, status: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/aid-requests/${requestId}/status`, {
            status
        }, { headers: this.getHeaders() });
    }

    // Create distribution task from aid request
    createDistributionTask(requestId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/aid-requests/${requestId}/create-task`, {}, {
            headers: this.getHeaders()
        });
    }

    // ========== TASK MANAGEMENT METHODS ==========

    // Get tasks for NGO
    getTasks(organizationId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/tasks/organization/${organizationId}`, {
            headers: this.getHeaders()
        });
    }

    // Create task
    createTask(taskData: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/tasks`, taskData, {
            headers: this.getHeaders()
        });
    }

    // Assign task to volunteer
    assignTask(taskId: string, volunteerId: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/tasks/${taskId}/assign`, {
            volunteerId
        }, { headers: this.getHeaders() });
    }

    // Get available volunteers for task
    getAvailableVolunteers(taskId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/tasks/${taskId}/available-volunteers`, {
            headers: this.getHeaders()
        });
    }

    // Update task status
    updateTaskStatus(taskId: string, status: string, completionNotes?: string): Observable<any> {
        const body: any = { status };
        if (completionNotes) {
            body.completionNotes = completionNotes;
        }
        return this.http.put<any>(`${this.apiUrl}/tasks/${taskId}/status`, body, {
            headers: this.getHeaders()
        });
    }

    // Delete task
    deleteTask(taskId: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/tasks/${taskId}`, {
            headers: this.getHeaders()
        });
    }

    // ========== DISTRIBUTION SHIFT METHODS ==========

    // Get distribution shifts for NGO
    getDistributionShifts(organizationId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/distribution/shifts/organization/${organizationId}`, {
            headers: this.getHeaders()
        });
    }

    // Create distribution shift
    createShift(shiftData: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/distribution/shifts`, shiftData, {
            headers: this.getHeaders()
        });
    }

    // Assign volunteer to shift
    assignVolunteerToShift(shiftId: string, volunteerId: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/distribution/shifts/${shiftId}/assign`, {
            volunteerId
        }, { headers: this.getHeaders() });
    }

    // Update shift status
    updateShiftStatus(shiftId: string, status: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/distribution/shifts/${shiftId}/status`, {
            status
        }, { headers: this.getHeaders() });
    }

    // Delete shift
    deleteShift(shiftId: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/distribution/shifts/${shiftId}`, {
            headers: this.getHeaders()
        });
    }
}
