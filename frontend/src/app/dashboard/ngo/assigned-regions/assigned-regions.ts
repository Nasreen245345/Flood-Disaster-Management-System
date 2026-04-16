<<<<<<< HEAD
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
=======

import { Component, inject, OnInit } from '@angular/core';
>>>>>>> nasreen_repo/main
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgoService } from '../services/ngo.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RegionDetailsDialogComponent } from './region-details-dialog';

interface Assignment {
    id: string;
    disasterName: string;
    region: string;
    regionDisplay: string;
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
    http = inject(HttpClient);
    cdr = inject(ChangeDetectorRef);
    
    assignments: Assignment[] = [];
    ngoId: string | null = null;
    isLoading = true;

    ngOnInit() {
        this.loadAssignedRegions();
    }

    /** Extract lat/lng from region string, falling back to disasterName if needed */
    private parseCoordinates(region: string, disasterName?: string): { lat: number; lng: number } | null {
        // Try to get two coords from region first
        const twoCoordMatch = region?.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (twoCoordMatch) {
            const a = parseFloat(twoCoordMatch[1]);
            const b = parseFloat(twoCoordMatch[2]);
            if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
            if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return { lat: b, lng: a };
        }

        // Single coord in region — try disasterName for the second coord
        const singleCoord = region?.match(/^(-?\d+\.\d+)/);
        if (singleCoord && disasterName) {
            const allCoords = disasterName.match(/(-?\d+\.\d+)/g);
            if (allCoords && allCoords.length >= 2) {
                const nums = allCoords.map(parseFloat);
                // Find lat (<=90) and lng (<=180)
                const lat = nums.find(n => Math.abs(n) <= 90);
                const lng = nums.find(n => Math.abs(n) <= 180 && n !== lat);
                if (lat !== undefined && lng !== undefined) return { lat, lng };
            }
        }

        return null;
    }

    private isCoordinateString(region: string): boolean {
        // Starts with a decimal number (coordinate)
        return /^-?\d+\.\d+/.test(region?.trim() || '');
    }

    private reverseGeocode(lat: number, lng: number): Promise<string> {
        const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        return firstValueFrom(
            this.http.get<any>(`http://localhost:5000/api/map/reverse-geocode?lat=${lat}&lng=${lng}`)
        ).then(res => res?.placeName || fallback)
         .catch(() => fallback);
    }

    loadAssignedRegions() {
        this.isLoading = true;
        
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                this.ngoId = response.data._id;
                
                if (!this.ngoId) {
                    console.error('❌ No NGO ID found');
                    this.isLoading = false;
                    return;
                }
                
                this.ngoService.getAssignedRegions(this.ngoId).subscribe({
                    next: (assignmentResponse) => {
                        const raw = assignmentResponse.data;

                        // First pass: build assignments with raw region as display
                        this.assignments = raw.map((assignment: any) => ({
                            id: assignment._id,
                            disasterName: assignment.disasterName,
                            region: assignment.region || '',
                            regionDisplay: assignment.region || '',
                            disaster: assignment.disaster,
                            resourceRequirements: assignment.resourceRequirements,
                            resourceCoverage: assignment.resourceCoverage,
                            affectedPopulation: assignment.affectedPopulation,
                            status: assignment.status,
                            createdAt: new Date(assignment.createdAt)
                        }));
                        this.isLoading = false;
                        this.cdr.detectChanges();

                        // Second pass: geocode coordinate-based regions asynchronously
                        this.assignments.forEach((a, i) => {
                            if (this.isCoordinateString(a.region)) {
                                const coords = this.parseCoordinates(a.region, a.disasterName);
                                if (coords) {
                                    this.reverseGeocode(coords.lat, coords.lng).then(name => {
                                        this.assignments[i] = { ...this.assignments[i], regionDisplay: name };
                                        this.assignments = [...this.assignments];
                                        this.cdr.detectChanges();
                                    });
                                }
                            }
                        });
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

