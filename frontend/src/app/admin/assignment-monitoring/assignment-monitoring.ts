import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../services/admin-data.service';
import { RegionAssignment, Organization } from '../models/admin.models';

@Component({
  selector: 'app-assignment-monitoring',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    FormsModule
  ],
  templateUrl: './assignment-monitoring.html',
  styleUrls: ['./assignment-monitoring.css']
})
export class AssignmentMonitoringComponent implements OnInit {
  adminService = inject(AdminDataService);

  assignments: RegionAssignment[] = [];
  filteredAssignments: RegionAssignment[] = [];
  organizations: Organization[] = [];
  loading = true;

  // Filters
  selectedStatus: string = 'all';

  // Table columns
  displayedColumns: string[] = ['disaster', 'region', 'ngos', 'coverage', 'population', 'status', 'assignedDate'];

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    // Load both assignments and organizations
    this.adminService.getOrganizations().subscribe(orgs => {
      console.log('=== LOADED ORGANIZATIONS ===');
      console.log('Organizations:', orgs);
      this.organizations = orgs;
      this.loadAssignments();
    });
  }

  private loadAssignments() {
    this.adminService.getAssignments().subscribe(assignments => {
      console.log('=== LOADED ASSIGNMENTS ===');
      console.log('Assignments:', assignments);
      this.assignments = assignments;
      this.applyFilters();
      this.loading = false;
    });
  }

  applyFilters() {
    this.filteredAssignments = this.assignments.filter(assignment => {
      const statusMatch = this.selectedStatus === 'all' || assignment.status === this.selectedStatus;
      return statusMatch;
    });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      assigned: 'primary',
      'in-progress': 'warn',
      completed: ''
    };
    return colors[status] || '';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      assigned: 'assignment',
      'in-progress': 'pending',
      completed: 'check_circle'
    };
    return icons[status] || 'help';
  }

  getCoverageColor(coverage: number): string {
    if (coverage >= 80) return '#10b981'; // green
    if (coverage >= 60) return '#eab308'; // yellow
    if (coverage >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  getNGONames(assignment: RegionAssignment): string {
    console.log('=== GET NGO NAMES ===');
    console.log('Assignment:', assignment);
    
    // First try to use the ngoNames array if available
    if (assignment.ngoNames && assignment.ngoNames.length > 0) {
      const result = assignment.ngoNames.join(', ');
      console.log('Using ngoNames array:', result);
      return result;
    }
    
    // Fallback to looking up by ID
    const ngoIds = assignment.assignedNGOs;
    console.log('NGO IDs:', ngoIds);
    console.log('Available Organizations:', this.organizations.map(o => ({ id: o.id, name: o.name })));
    
    if (!ngoIds || ngoIds.length === 0) {
      return 'No NGOs assigned';
    }
    
    const ngoNames: string[] = [];
    ngoIds.forEach(id => {
      const ngo = this.organizations.find(org => org.id === id);
      console.log(`Looking for NGO with ID ${id}:`, ngo);
      if (ngo) {
        ngoNames.push(ngo.name);
      }
    });
    
    const result = ngoNames.length > 0 ? ngoNames.join(', ') : 'Unknown';
    console.log('Result:', result);
    return result;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
