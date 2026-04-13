import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoService } from '../services/ngo.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddVolunteerDialogComponent } from './add-volunteer-dialog';
import { AssignRegionDialogComponent } from './assign-region-dialog';

@Component({
    selector: 'app-volunteers',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatMenuModule, MatChipsModule, MatDividerModule, MatDialogModule, MatSnackBarModule],
    templateUrl: './volunteers.html',
    styleUrls: ['./volunteers.css']
})
export class VolunteersComponent implements OnInit {
    ngoService = inject(NgoService);
    dialog = inject(MatDialog);
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);
    private apiUrl = 'http://localhost:5000/api';

    volunteers: any[] = [];
    loading = true;
    ngoId: string = '';

    ngOnInit() {
        this.loadVolunteers();
    }

    private loadVolunteers() {
        this.loading = true;
        
        // First get NGO organization to get the ID
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                if (response.success && response.data._id) {
                    this.ngoId = response.data._id;
                    
                    // Now fetch volunteers for this NGO
                    this.ngoService.getVolunteers(this.ngoId).subscribe({
                        next: (volResponse) => {
                            if (volResponse.success) {
                                this.volunteers = volResponse.data;
                                console.log('Volunteers loaded:', this.volunteers);
                            }
                            this.loading = false;
                        },
                        error: (err) => {
                            console.error('Error loading volunteers:', err);
                            this.snackBar.open('Failed to load volunteers', 'Close', { duration: 3000 });
                            this.loading = false;
                        }
                    });
                } else {
                    this.loading = false;
                    this.snackBar.open('NGO organization not found', 'Close', { duration: 3000 });
                }
            },
            error: (err) => {
                console.error('Error loading organization:', err);
                this.snackBar.open('Failed to load organization', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    openAddVolunteer() {
        const dialogRef = this.dialog.open(AddVolunteerDialogComponent, {
            width: '600px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.ngoService.addVolunteer(result);
            }
        });
    }
    
    displayedColumns = ['name', 'category', 'skillLevel', 'contact', 'status', 'verification', 'actions'];

    verifyVolunteer(volunteer: any) {
        if (!volunteer._id) return;
        
        this.ngoService.verifyVolunteer(volunteer._id).subscribe({
            next: (response) => {
                if (response.success) {
                    this.snackBar.open('Volunteer verified successfully!', 'Close', { duration: 3000 });
                    // Reload volunteers
                    this.loadVolunteers();
                }
            },
            error: (err) => {
                console.error('Error verifying volunteer:', err);
                this.snackBar.open('Failed to verify volunteer', 'Close', { duration: 3000 });
            }
        });
    }

    openAssignRegion(volunteer: any) {
        this.dialog.open(AssignRegionDialogComponent, {
            data: { volunteerId: volunteer._id, volunteerName: volunteer.fullName }
        }).afterClosed().subscribe(result => {
            if (result) this.loadVolunteers();
        });
    }

    getStatusColor(status: string): string {
        const colors: Record<string, string> = {
            'active': 'primary',
            'on_call': 'accent',
            'inactive': 'warn'
        };
        return colors[status] || 'primary';
    }

    getVerificationColor(status: string): string {
        const colors: Record<string, string> = {
            'verified': 'primary',
            'pending': 'accent',
            'rejected': 'warn'
        };
        return colors[status] || 'accent';
    }
}
