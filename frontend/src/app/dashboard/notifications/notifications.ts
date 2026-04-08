import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { NotificationService, Notification } from '../../shared/services/notification.service';

@Component({
    selector: 'app-notifications',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
    templateUrl: './notifications.html',
    styleUrls: ['./notifications.css']
})
export class NotificationsComponent {
    notificationService = inject(NotificationService);
    notifications$ = this.notificationService.notifications$;

    markAsRead(id: string) {
        this.notificationService.markAsRead(id);
    }

    markAllAsRead() {
        this.notificationService.markAllAsRead();
    }

    clearAll() {
        this.notificationService.clearAll();
    }
}
