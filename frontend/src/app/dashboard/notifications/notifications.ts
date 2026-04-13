import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService, Notification } from '../../shared/services/notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule, MatChipsModule, MatDividerModule],
    templateUrl: './notifications.html',
    styleUrls: ['./notifications.css']
})
export class NotificationsComponent implements OnInit {
    notificationService = inject(NotificationService);
    cdr = inject(ChangeDetectorRef);

    notifications: Notification[] = [];
    loading = true;

    ngOnInit() {
        this.notificationService.load();
        this.notificationService.notifications$.subscribe(n => {
            this.notifications = n;
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    markAsRead(id: string) {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead() {
        this.notificationService.markAllAsRead();
    }

    getPriorityColor(priority: string): string {
        return { critical: 'warn', high: 'warn', medium: 'accent', low: 'primary' }[priority] || 'primary';
    }

    getIconColor(type: string): string {
        const map: Record<string, string> = {
            disaster_reported: '#ef4444',
            aid_request_assigned: '#3b82f6',
            aid_request_fulfilled: '#10b981',
            task_assigned: '#8b5cf6',
            shift_assigned: '#f59e0b',
            volunteer_registered: '#06b6d4',
            general: '#6b7280'
        };
        return map[type] || '#6b7280';
    }

    timeAgo(date: Date): string {
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }
}
