import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../services/admin-data.service';
import { Organization } from '../models/admin.models';

@Component({
  selector: 'app-organizations',
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
    MatCardModule,
    FormsModule
  ],
  templateUrl: './organizations.html',
  styleUrls: ['./organizations.css']
})
export class OrganizationsComponent implements OnInit {
  private adminService = inject(AdminDataService);

  organizations: Organization[] = [];
  filteredOrganizations: Organization[] = [];
  loading = true;

  // Filters
  selectedType: string = 'all';
  selectedStatus: string = 'all';

  // Table columns
  displayedColumns: string[] = ['name', 'type', 'contact', 'capacity', 'workload', 'status', 'registeredDate', 'actions'];

  ngOnInit() {
    this.loadOrganizations();
  }

  private loadOrganizations() {
    this.adminService.getOrganizations().subscribe(orgs => {
      this.organizations = orgs;
      this.applyFilters();
      this.loading = false;
    });
  }

  applyFilters() {
    this.filteredOrganizations = this.organizations.filter(org => {
      const typeMatch = this.selectedType === 'all' || org.type === this.selectedType;
      const statusMatch = this.selectedStatus === 'all' || org.status === this.selectedStatus;
      return typeMatch && statusMatch;
    });
  }

  getTypeColor(type: string): string {
    return type === 'ngo' ? 'primary' : 'accent';
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      approved: 'primary',
      pending: 'warn',
      disabled: 'accent'
    };
    return colors[status] || '';
  }

  getWorkloadColor(workload: number): string {
    if (workload >= 80) return '#ef4444'; // red
    if (workload >= 60) return '#f59e0b'; // amber
    if (workload >= 40) return '#eab308'; // yellow
    return '#10b981'; // green
  }

  approveOrganization(org: Organization) {
    if (confirm(`Approve ${org.name}? This will grant them access to the system.`)) {
      this.adminService.updateOrganizationStatus(org.id, 'approved').subscribe(updated => {
        const index = this.organizations.findIndex(o => o.id === org.id);
        if (index !== -1) {
          this.organizations[index] = updated;
          this.applyFilters();
        }
      });
    }
  }

  rejectOrganization(org: Organization) {
    if (confirm(`Reject ${org.name}? This will prevent them from accessing the system.`)) {
      this.adminService.updateOrganizationStatus(org.id, 'disabled').subscribe(updated => {
        const index = this.organizations.findIndex(o => o.id === org.id);
        if (index !== -1) {
          this.organizations[index] = updated;
          this.applyFilters();
        }
      });
    }
  }

  enableOrganization(org: Organization) {
    this.adminService.updateOrganizationStatus(org.id, 'approved').subscribe(updated => {
      const index = this.organizations.findIndex(o => o.id === org.id);
      if (index !== -1) {
        this.organizations[index] = updated;
        this.applyFilters();
      }
    });
  }

  disableOrganization(org: Organization) {
    if (confirm(`Disable ${org.name}? This will suspend their access to the system.`)) {
      this.adminService.updateOrganizationStatus(org.id, 'disabled').subscribe(updated => {
        const index = this.organizations.findIndex(o => o.id === org.id);
        if (index !== -1) {
          this.organizations[index] = updated;
          this.applyFilters();
        }
      });
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
