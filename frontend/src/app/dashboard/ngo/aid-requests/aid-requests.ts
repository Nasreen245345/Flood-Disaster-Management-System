import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgoService } from '../services/ngo.service';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';
import { MapPreviewDialogComponent } from '../../../shared/components/map-preview-dialog/map-preview-dialog';


interface AidRequest {
    _id: string;
    victimName: string;
    victimCNIC: string;
    victimPhone: string;
    location: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    packagesNeeded: Array<{
        category: string;
        packageName: string;
        quantity: number;
    }>;
    urgency: string;
    peopleCount: number;
    status: string;
    createdAt: string;
}

@Component({
    selector: 'app-aid-requests',
    standalone: true,
    imports: [
        CommonModule, 
        MatCardModule, 
        MatTableModule, 
        MatButtonModule, 
        MatIconModule, 
        MatChipsModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
<<<<<<< HEAD
        MatDialogModule,
        LocationNamePipe
=======
        
>>>>>>> nasreen_repo/main
    ],
    templateUrl: './aid-requests.html',
    styleUrls: ['./aid-requests.css']
})
export class AidRequestsComponent implements OnInit {
    ngoService = inject(NgoService);
    snackBar = inject(MatSnackBar);
    dialog = inject(MatDialog);
    
    requests: AidRequest[] = [];
    loading = true;
    ngoId: string | null = null;
    
    displayedColumns = ['victim', 'location', 'packages', 'people', 'urgency', 'status', 'actions'];

    ngOnInit() {
        this.loadAidRequests();
    }

    loadAidRequests() {
        this.loading = true;
        
        // First get NGO organization to get the ID
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                if (response.success && response.data) {
                    this.ngoId = response.data._id;
                    
                    // Check if ngoId is not null before making the API call
                    if (!this.ngoId) {
                        console.error('NGO ID is null');
                        this.snackBar.open('Error: NGO ID not found', 'Close', { duration: 3000 });
                        this.loading = false;
                        return;
                    }
                    
                    // Now fetch aid requests for this NGO
                    this.ngoService.getAidRequests(this.ngoId).subscribe({
                        next: (requestsResponse) => {
                            if (requestsResponse.success) {
                                this.requests = requestsResponse.data;
                                console.log('Aid requests loaded:', this.requests);
                            }
                            this.loading = false;
                        },
                        error: (err) => {
                            console.error('Error loading aid requests:', err);
                            this.snackBar.open('Error loading aid requests', 'Close', { duration: 3000 });
                            this.loading = false;
                        }
                    });
                }
            },
            error: (err) => {
                console.error('Error loading organization:', err);
                this.snackBar.open('Error loading organization', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    getPackagesList(request: AidRequest): string {
        if (!request.packagesNeeded || request.packagesNeeded.length === 0) {
            return 'No packages specified';
        }
        return request.packagesNeeded
            .map(p => `${p.quantity}x ${p.packageName}`)
            .join(', ');
    }

    getUrgencyColor(urgency: string): string {
        switch (urgency?.toLowerCase()) {
            case 'critical': return 'critical';
            case 'high': return 'high';
            case 'medium': return 'medium';
            case 'low': return 'low';
            default: return 'medium';
        }
    }

    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'pending': return 'warn';
            case 'approved': return 'accent';
            case 'in_progress': return 'primary';
            case 'fulfilled': return 'primary';
            case 'rejected': return 'warn';
            default: return 'primary';
        }
    }

    markInProgress(request: AidRequest) {
        if (!request._id) return;
        
        this.ngoService.updateAidRequestStatus(request._id, 'in_progress').subscribe({
            next: (response) => {
                if (response.success) {
                    request.status = 'in_progress';
                    this.snackBar.open('Request marked as in progress', 'Close', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Error updating status:', err);
                this.snackBar.open('Error updating status', 'Close', { duration: 3000 });
            }
        });
    }

    createDistributionTask(request: AidRequest) {
        if (!request._id) return;
        
        if (confirm(`Create a distribution task for ${request.victimName}?\n\nThis will create a delivery task that can be assigned to a volunteer.`)) {
            this.ngoService.createDistributionTask(request._id).subscribe({
                next: (response) => {
                    if (response.success) {
                        request.status = 'in_progress';
                        this.snackBar.open('Distribution task created! You can now assign it to a volunteer.', 'Close', { duration: 4000 });
                    }
                },
                error: (err) => {
                    console.error('Error creating task:', err);
                    this.snackBar.open('Error creating distribution task', 'Close', { duration: 3000 });
                }
            });
        }
    }

    markFulfilled(request: AidRequest) {
        if (!request._id) return;
        
        this.ngoService.updateAidRequestStatus(request._id, 'fulfilled').subscribe({
            next: (response) => {
                if (response.success) {
                    request.status = 'fulfilled';
                    this.snackBar.open('Request marked as fulfilled', 'Close', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Error updating status:', err);
                this.snackBar.open('Error updating status', 'Close', { duration: 3000 });
            }
        });
    }

    viewOnMap(request: AidRequest) {
        if (request.coordinates) {
            this.dialog.open(MapPreviewDialogComponent, {
                width: '640px',
                maxWidth: '95vw',
                data: {
                    lat: request.coordinates.latitude,
                    lng: request.coordinates.longitude,
                    label: request.location,
                    title: `${request.victimName}'s Location`
                }
            });
        } else {
            this.snackBar.open('Location coordinates not available', 'Close', { duration: 3000 });
        }
    }
}
