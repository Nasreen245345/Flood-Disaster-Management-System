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
    private apiUrl = 'http://localhost:5000/api';

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('dms_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    private _tasks = new BehaviorSubject<VolunteerTask[]>([]);
    tasks$ = this._tasks.asObservable();

    private _stats = new BehaviorSubject<VolunteerStats>({
        hoursServed: 0, tasksCompleted: 0, distributionsAssisted: 0, currentStreak: 0
    });
    stats$ = this._stats.asObservable();

    // Check-in state (kept for compatibility)
    private _isCheckedIn = new BehaviorSubject<boolean>(false);
    isCheckedIn$ = this._isCheckedIn.asObservable();
    private checkInTime: Date | null = null;

    constructor() { }

    // Load real stats from API
    loadStats(volunteerId: string) {
        // Tasks stats
        this.http.get<any>(`${this.apiUrl}/tasks/volunteer/${volunteerId}`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) {
                    const tasks = res.data;
                    const completed = tasks.filter((t: any) => t.status === 'completed').length;
                    this._tasks.next(tasks);
                    this._stats.next({
                        ...this._stats.value,
                        tasksCompleted: completed
                    });
                }
            }
        });

        // Distribution stats from volunteer profile
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) {
                    const v = res.data;
                    this._stats.next({
                        ...this._stats.value,
                        hoursServed: v.totalHoursServed || 0,
                        distributionsAssisted: v.totalVictimsServed || 0
                    });
                }
            }
        });

        // Distribution count from shifts
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success && res.data._id) {
                    this.http.get<any>(`${this.apiUrl}/distribution/shifts/volunteer/${res.data._id}`, { headers: this.getHeaders() }).subscribe({
                        next: (shiftRes) => {
                            if (shiftRes.success) {
                                const totalDist = shiftRes.data.reduce((sum: number, s: any) => sum + (s.totalDistributions || 0), 0);
                                this._stats.next({ ...this._stats.value, distributionsAssisted: totalDist });
                            }
                        }
                    });
                }
            }
        });
    }

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
        const current = this._isCheckedIn.value;
        if (!current) {
            this.checkInTime = new Date();
            this._isCheckedIn.next(true);
        } else {
            if (this.checkInTime) {
                const hoursWorked = (new Date().getTime() - this.checkInTime.getTime()) / 3600000;
                this.checkInTime = null;
                this._isCheckedIn.next(false);
                this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers: this.getHeaders() }).subscribe({
                    next: (res) => {
                        if (res.success) {
                            const currentHours = res.data.totalHoursServed || 0;
                            this.http.put<any>(
                                `${this.apiUrl}/volunteers/${res.data._id}`,
                                { totalHoursServed: Math.round((currentHours + hoursWorked) * 10) / 10 },
                                { headers: this.getHeaders() }
                            ).subscribe({
                                next: () => {
                                    this._stats.next({
                                        ...this._stats.value,
                                        hoursServed: Math.round((this._stats.value.hoursServed + hoursWorked) * 10) / 10
                                    });
                                }
                            });
                        }
                    }
                });
            } else {
                this._isCheckedIn.next(false);
            }
        }
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
