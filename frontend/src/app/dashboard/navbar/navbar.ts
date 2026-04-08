import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router'; // Added RouterLink
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../auth/services/auth.service';
import { NotificationService, Notification } from '../../shared/services/notification.service';

@Component({
  selector: 'app-dashboard-navbar',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    RouterLink
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  router = inject(Router);

  userName: string = '';
  userEmail: string = '';
  notifications$ = this.notificationService.notifications$;
  unreadCount = 0;

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName = user.name || 'User';
      this.userEmail = user.email;
    }

    this.notifications$.subscribe((notes: Notification[]) => {
      this.unreadCount = notes.filter(n => !n.read).length;
    });
  }

  markAsRead(id: string) {
    this.notificationService.markAsRead(id);
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
