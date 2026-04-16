import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { VolunteerService } from '../services/volunteer.service';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';

interface ActiveShift {
    _id: string;
    location: string;
    shiftStart: Date;
    shiftEnd: Date;
    totalDistributions: number;
    organization: {
        name: string;
        contact: any;
    };
}

interface VictimDetails {
    aidRequest: {
        _id: string;
        victimName: string;
        victimCNIC: string;
        victimPhone: string;
        location: string;
        packagesNeeded: Array<{
            category: string;
            packageName: string;
            quantity: number;
        }>;
        urgency: string;
        peopleCount: number;
        status: string;
    };
    shift: {
        _id: string;
        location: string;
        shiftEnd: Date;
    };
}

@Component({
    selector: 'app-volunteer-distribution',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatDividerModule,
        LocationNamePipe
    ],
    templateUrl: './distribution.html',
    styleUrls: ['./distribution.css']
})
export class VolunteerDistributionComponent implements OnInit {
    private volunteerService = inject(VolunteerService);
    private snackBar = inject(MatSnackBar);
    private ngZone = inject(NgZone);

    activeShift: ActiveShift | null = null;
    hasActiveShift = false;
    loadingShift = true;
    
    cnicInput = '';
    verifying = false;
    victimDetails: VictimDetails | null = null;
    
    distributing = false;
    shiftTimeRemaining = '';

    ngOnInit() {
        this.checkActiveShift();
        this.startShiftTimer();
    }

    checkActiveShift() {
        this.loadingShift = true;
        
        this.volunteerService.getMyActiveShift().subscribe({
            next: (response) => {
                this.ngZone.run(() => {
                    console.log('Active shift response:', response);
                    if (response.success && response.data) {
                        this.activeShift = response.data;
                        this.hasActiveShift = response.hasActiveShift || false;
                        console.log('Active shift found:', this.activeShift);
                        console.log('Has active shift:', this.hasActiveShift);
                    } else {
                        this.hasActiveShift = false;
                        this.activeShift = null;
                        console.log('No active shift found');
                    }
                    this.loadingShift = false;
                });
            },
            error: (error) => {
                this.ngZone.run(() => {
                    console.error('Error checking active shift:', error);
                    this.hasActiveShift = false;
                    this.loadingShift = false;
                    this.snackBar.open('Error checking shift status', 'Close', { duration: 3000 });
                });
            }
        });
    }

    startShiftTimer() {
        setInterval(() => {
            if (this.activeShift) {
                this.updateTimeRemaining();
            }
        }, 60000); // Update every minute
        
        if (this.activeShift) {
            this.updateTimeRemaining();
        }
    }

    updateTimeRemaining() {
        if (!this.activeShift) return;
        
        const now = new Date().getTime();
        const end = new Date(this.activeShift.shiftEnd).getTime();
        const diff = end - now;
        
        if (diff <= 0) {
            this.shiftTimeRemaining = 'Shift ended';
            this.hasActiveShift = false;
            return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        this.shiftTimeRemaining = `${hours}h ${minutes}m remaining`;
    }

    verifyVictim() {
        if (!this.cnicInput.trim()) {
            this.snackBar.open('Please enter CNIC', 'Close', { duration: 2000 });
            return;
        }

        if (!this.hasActiveShift) {
            this.snackBar.open('You do not have an active shift', 'Close', { duration: 3000 });
            return;
        }

        this.verifying = true;
        this.victimDetails = null;

        this.volunteerService.verifyVictim(this.cnicInput.trim()).subscribe({
            next: (response) => {
                this.ngZone.run(() => {
                    if (response.success && response.data) {
                        this.victimDetails = response.data;
                        this.snackBar.open('Victim verified successfully', 'Close', { duration: 2000 });
                    }
                    this.verifying = false;
                });
            },
            error: (error) => {
                this.ngZone.run(() => {
                    console.error('Verification error:', error);
                    const message = error.error?.message || 'Victim not found or not eligible';
                    this.snackBar.open(message, 'Close', { duration: 4000 });
                    this.verifying = false;
                    this.victimDetails = null;
                });
            }
        });
    }

    markAsDistributed() {
        if (!this.victimDetails) return;

        if (confirm(`Confirm distribution to ${this.victimDetails.aidRequest.victimName}?`)) {
            this.distributing = true;

            this.volunteerService.markDistributed(
                this.victimDetails.aidRequest._id,
                this.victimDetails.aidRequest.victimCNIC
            ).subscribe({
                next: (response) => {
                    this.ngZone.run(() => {
                        if (response.success) {
                            this.snackBar.open('Aid marked as distributed successfully!', 'Close', { duration: 3000 });
                            
                            // Update shift statistics
                            if (this.activeShift) {
                                this.activeShift.totalDistributions += 1;
                            }
                            
                            // Reset form
                            this.cnicInput = '';
                            this.victimDetails = null;
                        }
                        this.distributing = false;
                    });
                },
                error: (error) => {
                    this.ngZone.run(() => {
                        console.error('Distribution error:', error);
                        this.snackBar.open('Error marking as distributed', 'Close', { duration: 3000 });
                        this.distributing = false;
                    });
                }
            });
        }
    }

    clearForm() {
        this.cnicInput = '';
        this.victimDetails = null;
    }

    getUrgencyColor(urgency: string): string {
        switch (urgency?.toLowerCase()) {
            case 'critical': return 'warn';
            case 'high': return 'warn';
            case 'medium': return 'accent';
            default: return 'primary';
        }
    }

    formatCNIC(cnic: string): string {
        // Format CNIC as XXXXX-XXXXXXX-X
        if (cnic && cnic.length === 13) {
            return `${cnic.substring(0, 5)}-${cnic.substring(5, 12)}-${cnic.substring(12)}`;
        }
        return cnic;
    }
}
