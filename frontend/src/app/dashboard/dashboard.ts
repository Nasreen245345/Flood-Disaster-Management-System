import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);

  ngOnInit() {
    // Redirect to role-specific dashboard
    const user = this.auth.getCurrentUser();
    if (user) {
      const roleRoutes: Record<string, string> = {
        'admin': '/dashboard/admin/overview',
        'ngo': '/dashboard/ngo/overview',
        'volunteer': '/dashboard/volunteer/home',
        'victim': '/dashboard/victim/overview'
      };

      const targetRoute = roleRoutes[user.role];
      if (targetRoute) {
        this.router.navigate([targetRoute]);
      }
    }
  }

  logout() {
    this.auth.logout();
  }
}
