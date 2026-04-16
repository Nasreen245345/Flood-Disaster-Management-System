import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, interval } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    icon: string;
    priority: string;
    isRead: boolean;
    link?: string;
    createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api/notifications';

    private _notifications = new BehaviorSubject<Notification[]>([]);
    private _unreadCount = new BehaviorSubject<number>(0);

    readonly notifications$ = this._notifications.asObservable();
    readonly unreadCount$ = this._unreadCount.asObservable();

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('dms_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    load() {
        if (!localStorage.getItem('dms_token')) return;
        this.http.get<any>(this.apiUrl, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) {
                    this._notifications.next(res.data);
                    this._unreadCount.next(res.unreadCount);
                }
            },
            error: () => {}
        });
    }

    // Poll every 30 seconds for new notifications
    startPolling() {
        this.load();
        interval(30000).subscribe(() => this.load());
    }

    markAsRead(id: string) {
        this.http.put<any>(`${this.apiUrl}/${id}/read`, {}, { headers: this.getHeaders() }).subscribe({
            next: () => {
                const updated = this._notifications.value.map(n =>
                    n._id === id ? { ...n, isRead: true } : n
                );
                this._notifications.next(updated);
                this._unreadCount.next(updated.filter(n => !n.isRead).length);
            }
        });
    }

    markAllAsRead() {
        this.http.put<any>(`${this.apiUrl}/read-all`, {}, { headers: this.getHeaders() }).subscribe({
            next: () => {
                const updated = this._notifications.value.map(n => ({ ...n, isRead: true }));
                this._notifications.next(updated);
                this._unreadCount.next(0);
            }
        });
    }

    get unreadCount(): number {
        return this._unreadCount.value;
    }
}
