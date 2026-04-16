import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../services/admin-data.service';
import { User } from '../models/admin.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    FormsModule
  ],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class UsersComponent implements OnInit {
  private adminService = inject(AdminDataService);

  users: User[] = [];
  filteredUsers: User[] = [];
  loading = true;

  // Filters
  selectedRole: string = 'all';
  selectedStatus: string = 'all';

  // Table columns
  displayedColumns: string[] = ['name', 'email', 'role', 'status', 'joinedDate', 'lastActive', 'actions'];

  ngOnInit() {
    this.loadUsers();
  }

  private loadUsers() {
    this.adminService.getUsers().subscribe(users => {
      this.users = users;
      this.applyFilters();
      this.loading = false;
    });
  }

  applyFilters() {
    this.filteredUsers = this.users.filter(user => {
      const roleMatch = this.selectedRole === 'all' || user.role === this.selectedRole;
      const statusMatch = this.selectedStatus === 'all' || user.status === this.selectedStatus;
      return roleMatch && statusMatch;
    });
  }

  getRoleColor(role: string): string {
    const colors: Record<string, string> = {
      admin: 'accent',
      ngo: 'primary',
      volunteer: 'warn',
      victim: ''
    };
    return colors[role] || '';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      active: 'primary',
      inactive: 'warn',
      blocked: 'accent'
    };
    return colors[status] || '';
  }

  updateUserStatus(user: User, newStatus: 'active' | 'inactive' | 'blocked') {
    this.adminService.updateUserStatus(user.id, newStatus).subscribe(updatedUser => {
      const index = this.users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        this.users[index] = updatedUser;
        this.applyFilters();
      }
    });
  }

  activateUser(user: User) {
    this.updateUserStatus(user, 'active');
  }

  deactivateUser(user: User) {
    this.updateUserStatus(user, 'inactive');
  }

  blockUser(user: User) {
    if (confirm(`Are you sure you want to block ${user.name}? This will prevent them from accessing the system.`)) {
      this.updateUserStatus(user, 'blocked');
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return this.formatDate(date);
  }
}
