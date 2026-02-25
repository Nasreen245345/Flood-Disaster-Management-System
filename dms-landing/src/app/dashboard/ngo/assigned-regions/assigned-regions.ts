import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgoService } from '../services/ngo.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { RegionDetailsDialogComponent } from './region-details-dialog';

interface Assignment {
    id: string;
    disasterName: string;
    region: string;
    disaster: any;
    resourceRequirements: {
        food: number;
        medical: number;
        shelter: number;
    };
    resourceCoverage: number;
    affectedPopulation: number;
    status: string;
    createdAt: Date;
}

@Component({
    selector: 'app-assigned-regions',
    standalone: true,
    imports: [
        CommonModule, 
        MatCardModule, 
        MatIconModule, 
        MatButtonModule, 
        MatChipsModule, 
        MatDialogModule, 
        MatDividerModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './assigned-regions.html',
    styleUrls: ['./assigned-regions.css']
})
export class AssignedRegionsComponent implements OnInit {
    ngoService = inject(NgoService);
    dialog = inject(MatDialog);
    
    assignments: Assignment[] = [];
    ngoId: string | null = null;
    isLoading = true;

    ngOnInit() {
        this.loadAssignedRegions();
    }

    loadAssignedRegions() {
        this.isLoading = true;
        
        // First get NGO organization to get the ID
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                this.ngoId = response.data._id;
                
                // Check if ngoId is valid before making the call
                if (!this.ngoId) {
                    console.error('❌ No NGO ID found');
                    this.isLoading = false;
                    return;
                }
                
                // Then get assigned regions
                this.ngoService.getAssignedRegions(this.ngoId).subscribe({
                    next: (assignmentResponse) => {
                        console.log('=== ASSIGNED REGIONS ===');
                        console.log('Response:', assignmentResponse);
                        
                        this.assignments = assignmentResponse.data.map((assignment: any) => ({
                            id: assignment._id,
                            disasterName: assignment.disasterName,
                            region: assignment.region,
                            disaster: assignment.disaster,
                            resourceRequirements: assignment.resourceRequirements,
                            resourceCoverage: assignment.resourceCoverage,
                            affectedPopulation: assignment.affectedPopulation,
                            status: assignment.status,
                            createdAt: new Date(assignment.createdAt)
                        }));
                        
                        console.log('Processed assignments:', this.assignments);
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Error loading assigned regions:', err);
                        this.isLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error loading organization:', err);
                this.isLoading = false;
            }
        });
    }

    openDetails(assignment: Assignment) {
        this.dialog.open(RegionDetailsDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            data: assignment
        });
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'assigned': '#3b82f6',
            'in-progress': '#f59e0b',
            'completed': '#10b981',
            'cancelled': '#ef4444'
        };
        return colors[status] || '#6b7280';
    }

    getStatusIcon(status: string): string {
        const icons: Record<string, string> = {
            'assigned': 'assignment',
            'in-progress': 'pending',
            'completed': 'check_circle',
            'cancelled': 'cancel'
        };
        return icons[status] || 'help';
    }

    updateStatus(assignment: Assignment, newStatus: string) {
        if (confirm(`Update status to ${newStatus}?`)) {
            this.ngoService.updateAssignmentStatus(assignment.id, newStatus).subscribe({
                next: () => {
                    assignment.status = newStatus;
                    console.log('✅ Status updated');
                },
                error: (err) => {
                    console.error('❌ Error updating status:', err);
                    alert('Failed to update status');
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

    getDisasterType(disaster: any): string {
        if (!disaster || !disaster.disasterType) return 'Unknown';
        return disaster.disasterType.charAt(0).toUpperCase() + disaster.disasterType.slice(1);
    }

    getDisasterSeverity(disaster: any): string {
        if (!disaster || !disaster.severity) return 'Unknown';
        return disaster.severity.toUpperCase();
    }
}
