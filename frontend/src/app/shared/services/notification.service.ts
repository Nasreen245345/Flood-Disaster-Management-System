import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: Date;
    read: boolean;
    type: 'info' | 'warning' | 'error' | 'success';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private _notifications = new BehaviorSubject<Notification[]>([
        {
            id: '1',
            title: 'New Disaster Reported',
            message: 'Flood reported in Swat Valley. 300+ Affected.',
            time: new Date(),
            read: false,
            type: 'error'
        },
        {
            id: '2',
            title: 'Resource Request',
            message: 'Edhi Foundation requested 500 Food Packs.',
            time: new Date(Date.now() - 3600000), // 1 hour ago
            read: false,
            type: 'warning'
        },
        {
            id: '3',
            title: 'System Update',
            message: 'Dashboard maintenance scheduled for 2 AM.',
            time: new Date(Date.now() - 86400000), // 1 day ago
            read: true,
            type: 'info'
        }
    ]);

    readonly notifications$ = this._notifications.asObservable();

    get unreadCount() {
        return this._notifications.value.filter(n => !n.read).length;
    }

    markAsRead(id: string) {
        const current = this._notifications.value;
        const index = current.findIndex(n => n.id === id);
        if (index !== -1) {
            current[index] = { ...current[index], read: true }; // New object reference
            this._notifications.next([...current]); // New array reference
        }
    }

    markAllAsRead() {
        const current = this._notifications.value.map(n => ({ ...n, read: true }));
        this._notifications.next(current);
    }

    clearAll() {
        this._notifications.next([]);
    }
}
