<<<<<<< HEAD
import { Component, inject, OnInit, NgZone } from '@angular/core';
=======

import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
>>>>>>> nasreen_repo/main
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgoService } from '../services/ngo.service';
import { CreateShiftDialogComponent } from './create-shift-dialog';
import { AssignVolunteerShiftDialogComponent } from './assign-volunteer-shift-dialog';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';

interface DistributionShift {
    _id: string;
    location: string;
    shiftStart: Date;
    shiftEnd: Date;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    assignedVolunteer?: {
        _id: string;
        fullName: string;
        phone: string;
    };
    totalDistributions: number;
    notes?: string;
    createdAt: Date;
}

@Component({
    selector: 'app-distribution-shifts',
    standalone: true,
    imports: [
        
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatChipsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        LocationNamePipe
    ],
    templateUrl: './distribution-shifts.html',
    styleUrls: ['./distribution-shifts.css']
})
export class DistributionShiftsComponent implements OnInit {
    private ngoService = inject(NgoService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private ngZone = inject(NgZone);

    shifts: DistributionShift[] = [];
    loading = false;
    organizationId: string = '';

    ngOnInit() {
        this.loadOrganization();
    }

    loadOrganization() {
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                if (response.success) {
                    this.organizationId = response.data._id;
                    this.loadShifts();
                }
            },
            error: (error) => {
                console.error('Error loading organization:', error);
                this.snackBar.open('Error loading organization', 'Close', { duration: 3000 });
            }
        });
    }

    loadShifts() {
        if (!this.organizationId) return;

        this.loading = true;
        
        this.ngoService.getDistributionShifts(this.organizationId).subscribe({
            next: (response: any) => {
                this.ngZone.run(() => {
                    console.log('Shifts loaded:', response);
                    if (response.success) {
                        this.shifts = response.data;
                    }
                    this.loading = false;
                });
            },
            error: (error: any) => {
                this.ngZone.run(() => {
                    console.error('Error loading shifts:', error);
                    this.snackBar.open('Error loading shifts', 'Close', { duration: 3000 });
                    this.loading = false;
                });
            }
        });
    }

    get scheduledShifts() {
        return this.shifts.filter(s => s.status === 'scheduled');
    }

    get activeShifts() {
        return this.shifts.filter(s => s.status === 'active');
    }

    get completedShifts() {
        return this.shifts.filter(s => s.status === 'completed');
    }

    openCreateShiftDialog() {
        const dialogRef = this.dialog.open(CreateShiftDialogComponent, {
            width: '600px',
            data: { organizationId: this.organizationId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadShifts();
            }
        });
    }

    openAssignVolunteerDialog(shift: DistributionShift) {
        const dialogRef = this.dialog.open(AssignVolunteerShiftDialogComponent, {
            width: '500px',
            data: { shift, organizationId: this.organizationId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadShifts();
            }
        });
    }

    updateShiftStatus(shiftId: string, status: string) {
        this.ngoService.updateShiftStatus(shiftId, status).subscribe({
            next: () => {
                this.snackBar.open(`Shift ${status}`, 'Close', { duration: 2000 });
                this.loadShifts();
            },
            error: (error: any) => {
                console.error('Error updating shift:', error);
                this.snackBar.open('Error updating shift', 'Close', { duration: 3000 });
            }
        });
    }

    deleteShift(shiftId: string) {
        if (!confirm('Are you sure you want to delete this shift?')) return;

        this.ngoService.deleteShift(shiftId).subscribe({
            next: () => {
                this.snackBar.open('Shift deleted', 'Close', { duration: 2000 });
                this.loadShifts();
            },
            error: (error: any) => {
                console.error('Error deleting shift:', error);
                this.snackBar.open('Error deleting shift', 'Close', { duration: 3000 });
            }
        });
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'scheduled': return 'primary';
            case 'active': return 'accent';
            case 'completed': return 'primary';
            case 'cancelled': return 'warn';
            default: return 'primary';
        }
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getShiftDuration(start: Date, end: Date): string {
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        return `${hours} hours`;
    }
}

