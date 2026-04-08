import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../services/admin-data.service';
import { Disaster } from '../models/admin.models';

@Component({
  selector: 'app-disasters',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './disasters.html',
  styleUrls: ['./disasters.css']
})
export class DisastersComponent implements OnInit {
  private adminService = inject(AdminDataService);

  disasters: Disaster[] = [];
  filteredDisasters: Disaster[] = [];
  loading = true;

  // Filters
  selectedType: string = 'all';
  selectedSeverity: string = 'all';
  selectedStatus: string = 'all';

  ngOnInit() {
    this.loadDisasters();
  }

  private loadDisasters() {
    this.adminService.getDisasters().subscribe(disasters => {
      this.disasters = disasters;
      this.applyFilters();
      this.loading = false;
    });
  }

  applyFilters() {
    this.filteredDisasters = this.disasters.filter(disaster => {
      const typeMatch = this.selectedType === 'all' || disaster.type === this.selectedType;
      const severityMatch = this.selectedSeverity === 'all' || disaster.severity === this.selectedSeverity;
      const statusMatch = this.selectedStatus === 'all' || disaster.status === this.selectedStatus;
      return typeMatch && severityMatch && statusMatch;
    });
  }

  getDisasterIcon(type: string): string {
    const icons: Record<string, string> = {
      flood: 'water',
      fire: 'local_fire_department',
      earthquake: 'landscape',
      landslide: 'terrain',
      cyclone: 'cyclone',
      accident: 'car_crash'
    };
    return icons[type] || 'warning';
  }

  getDisasterColor(type: string): string {
    const colors: Record<string, string> = {
      flood: '#3b82f6',
      fire: '#ef4444',
      earthquake: '#f97316',
      landslide: '#92400e',
      cyclone: '#a855f7',
      accident: '#eab308'
    };
    return colors[type] || '#64748b';
  }

  getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
      low: 'primary',
      medium: 'warn',
      high: 'warn',
      critical: 'accent'
    };
    return colors[severity] || '';
  }

  getStatusColor(status: string): string {
    return status === 'active' ? 'warn' : '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
