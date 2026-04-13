import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[]; // Which roles can see this menu item
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.css']
})
export class SidebarComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  userRole: string = '';
  userName: string = '';

  // All possible menu items
  private allMenuItems: MenuItem[] = [
    // Admin Menu Items
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/admin/overview', roles: ['admin'] },
    { label: 'Users', icon: 'people', route: '/dashboard/admin/users', roles: ['admin'] },
    { label: 'Organizations', icon: 'business', route: '/dashboard/admin/organizations', roles: ['admin'] },
    { label: 'Disasters', icon: 'warning', route: '/dashboard/admin/disasters', roles: ['admin'] },
    { label: 'Region Assignments', icon: 'assignment', route: '/dashboard/admin/region-assignments', roles: ['admin'] },
    { label: 'Assignment Monitoring', icon: 'track_changes', route: '/dashboard/admin/assignment-monitoring', roles: ['admin'] },
    { label: 'Reports', icon: 'analytics', route: '/dashboard/admin/reports', roles: ['admin'] },
    { label: 'Activity Log', icon: 'history', route: '/dashboard/admin/activity-log', roles: ['admin'] },

    // NGO Menu Items
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/ngo/overview', roles: ['ngo'] },
    { label: 'Assigned Regions', icon: 'map', route: '/dashboard/ngo/assigned-regions', roles: ['ngo'] },
    { label: 'Inventory Management', icon: 'inventory_2', route: '/dashboard/ngo/inventory', roles: ['ngo'] },
    { label: 'Aid Requests', icon: 'medical_services', route: '/dashboard/ngo/aid-requests', roles: ['ngo'] },
    { label: 'Task Management', icon: 'assignment', route: '/dashboard/ngo/tasks', roles: ['ngo'] },
    { label: 'Distribution Shifts', icon: 'schedule', route: '/dashboard/ngo/distribution-shifts', roles: ['ngo'] },
    { label: 'Volunteers', icon: 'groups', route: '/dashboard/ngo/volunteers', roles: ['ngo'] },
    { label: 'Distribution Logs', icon: 'history', route: '/dashboard/ngo/logs', roles: ['ngo'] },

    // Volunteer Menu Items
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/volunteer/home', roles: ['volunteer'] },
    { label: 'My Tasks', icon: 'assignment_turned_in', route: '/dashboard/volunteer/tasks', roles: ['volunteer'] },
    { label: 'Distribution Point', icon: 'store', route: '/dashboard/volunteer/distribution', roles: ['volunteer'] },
    { label: 'Assigned Region', icon: 'map', route: '/dashboard/volunteer/region', roles: ['volunteer'] },
    { label: 'Activity Log', icon: 'history', route: '/dashboard/volunteer/history', roles: ['volunteer'] },

    // Victim Menu Items
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard/victim/overview', roles: ['victim'] },
    { label: 'My Requests', icon: 'help', route: '/dashboard/victim/requests', roles: ['victim'] },
    { label: 'Aid History', icon: 'history', route: '/dashboard/victim/history', roles: ['victim'] },

    // Common Menu Items
    { label: 'Interactive Map', icon: 'map', route: '/dashboard/map', roles: ['admin', 'ngo', 'volunteer', 'victim'] },
    { label: 'Notifications', icon: 'notifications', route: '/dashboard/notifications', roles: ['admin', 'ngo', 'volunteer', 'victim'] },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile', roles: ['admin', 'ngo', 'volunteer', 'victim'] },
  ];

  menuItems: MenuItem[] = [];

  ngOnInit() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userRole = user.role;
      this.userName = user.name || user.email;
      this.filterMenuItems();
    }
  }

  private filterMenuItems() {
    this.menuItems = this.allMenuItems.filter(item =>
      item.roles.includes(this.userRole)
    );
  }

  getRoleBadgeColor(): string {
    const colors: Record<string, string> = {
      admin: 'bg-red-600',
      ngo: 'bg-cyan-600',
      volunteer: 'bg-yellow-600',
      victim: 'bg-orange-600'
    };
    return colors[this.userRole] || 'bg-gray-600';
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
