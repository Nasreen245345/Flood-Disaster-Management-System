import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { AdminDataService } from '../services/admin-data.service';
import { ActivityLog } from '../models/admin.models';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatChipsModule],
  templateUrl: './activity-log.html',
  styleUrls: ['./activity-log.css']
})
export class ActivityLogComponent implements OnInit {
  private adminService = inject(AdminDataService);

  logs: ActivityLog[] = [];
  loading = true;
  displayedColumns: string[] = ['timestamp', 'action', 'performedBy', 'details'];

  ngOnInit() {
    this.adminService.getActivityLogs().subscribe(logs => {
      this.logs = logs;
      this.loading = false;
    });
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      ngo_approval: 'check_circle',
      ngo_rejection: 'cancel',
      region_assignment: 'assignment',
      user_status_change: 'person',
      organization_status_change: 'business'
    };
    return icons[action] || 'info';
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      ngo_approval: 'primary',
      region_assignment: 'primary',
      ngo_rejection: 'warn',
      user_status_change: 'warn',
      organization_status_change: 'warn'
    };
    return colors[action] || '';
  }

  formatTimestamp(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
