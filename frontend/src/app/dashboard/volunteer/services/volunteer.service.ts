import { environment } from '../../../../environments/environment';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface VolunteerTask {
    _id: string;
    taskType: 'delivery' | 'warehouse' | 'field_work' | 'other';
    title: string;
    description: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    dueDate?: Date;
    completedAt?: Date;
    completionNotes?: string;
    organization?: any;
    relatedAidRequest?: any;
    createdAt: Date;
    updatedAt: Date;
}

export interface VolunteerStats {
    hoursServed: number;
    tasksCompleted: number;
    distributionsAssisted: number;
    currentStreak: number;
}

@Injectable({
    providedIn: 'root'
})
export class VolunteerService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('dms_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    private _tasks = new BehaviorSubject<VolunteerTask[]>([]);
    tasks$ = this._tasks.asObservable();

    // Mock Stats
    private _stats = new BehaviorSubject<VolunteerStats>({
        hoursServed: 42,
        tasksCompleted: 15,
        distributionsAssisted: 8,
        currentStreak: 4
    });

    stats$ = this._stats.asObservable();

    // Mock Check-in State
    private _isCheckedIn = new BehaviorSubject<boolean>(false);
    isCheckedIn$ = this._isCheckedIn.asObservable();

    constructor() { }

    // ========== API METHODS ==========

    // Get volunteer's tasks
    getMyTasks(volunteerId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/tasks/volunteer/${volunteerId}`, {
            headers: this.getHeaders()
        }).pipe(
            map(response => {
                if (response.success) {
                    this._tasks.next(response.data);
                    return response.data;
                }
                return [];
            })
        );
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

    // Get single task details
    getTask(taskId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/tasks/${taskId}`, {
            headers: this.getHeaders()
        });
    }

    // Actions (for backward compatibility)
    startTask(taskId: string) {
        return this.updateTaskStatus(taskId, 'in_progress');
    }

    completeTask(taskId: string, notes?: string) {
        return this.updateTaskStatus(taskId, 'completed', notes);
    }

    // ========== DISTRIBUTION SHIFT METHODS ==========

    // Get volunteer's active shift
    getMyActiveShift(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/distribution/my-active-shift`, {
            headers: this.getHeaders()
        });
    }

    // Verify victim by CNIC
    verifyVictim(cnic: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/distribution/verify-victim`, 
            { cnic }, 
            { headers: this.getHeaders() }
        );
    }

    // Mark aid as distributed
    markDistributed(aidRequestId: string, cnic: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/distribution/mark-distributed`,
            { aidRequestId, cnic },
            { headers: this.getHeaders() }
        );
    }

    // Get volunteer's shifts
    getMyShifts(volunteerId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/distribution/shifts/volunteer/${volunteerId}`, {
            headers: this.getHeaders()
        });
    }

    toggleCheckIn() {
        this._isCheckedIn.next(!this._isCheckedIn.value);
    }

    getAssignedRegion() {
        return {
            name: 'Sector F-10',
            city: 'Islamabad',
            supervisor: 'Ahmed Khan',
            contact: '+92 300 9876543',
            reportingPoint: 'F-10 Markaz Park',
            coordinates: { lat: 33.69, lng: 73.04 }
        };
    }
}


