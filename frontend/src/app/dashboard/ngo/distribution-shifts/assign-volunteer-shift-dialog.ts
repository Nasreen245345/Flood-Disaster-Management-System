import { Component, inject, Inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { NgoService } from '../services/ngo.service';

interface Volunteer {
    _id: string;
    fullName: string;
    phone: string;
    category: string;
    verificationStatus: string;
}

@Component({
    selector: 'app-assign-volunteer-shift-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatListModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatChipsModule
    ],
    template: `
        <h2 mat-dialog-title>Assign Volunteer to Shift</h2>
        <mat-dialog-content>
            <div class="shift-info">
                <h3>{{ data.shift.location }}</h3>
                <p>{{ formatDate(data.shift.shiftStart) }} - {{ formatDate(data.shift.shiftEnd) }}</p>
            </div>

            <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading volunteers...</p>
            </div>

            <mat-list *ngIf="!loading && volunteers.length > 0">
                <mat-list-item *ngFor="let volunteer of volunteers" 
                               class="volunteer-item"
                               [class.selected]="selectedVolunteer?._id === volunteer._id"
                               (click)="selectVolunteer(volunteer)">
                    <div matListItemIcon>
                        <mat-icon>person</mat-icon>
                    </div>
                    <div matListItemTitle>{{ volunteer.fullName }}</div>
                    <div matListItemLine>
                        <span class="volunteer-meta">
                            {{ volunteer.category }} | {{ volunteer.phone }}
                        </span>
                    </div>
                    <div matListItemMeta>
                        <mat-chip color="primary">
                            {{ volunteer.verificationStatus }}
                        </mat-chip>
                    </div>
                </mat-list-item>
            </mat-list>

            <div *ngIf="!loading && volunteers.length === 0" class="empty-state">
                <mat-icon>person_off</mat-icon>
                <p>No verified volunteers available</p>
                <p class="hint">Make sure volunteers are verified first</p>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button mat-raised-button color="primary" 
                    (click)="onAssign()" 
                    [disabled]="!selectedVolunteer || assigning">
                {{ assigning ? 'Assigning...' : 'Assign' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .shift-info {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .shift-info h3 {
            margin: 0 0 8px 0;
            color: #1e293b;
        }

        .shift-info p {
            margin: 0;
            color: #64748b;
            font-size: 0.9rem;
        }

        .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px;
            color: #64748b;
        }

        .volunteer-item {
            cursor: pointer;
            border-radius: 8px;
            margin-bottom: 8px;
            transition: background-color 0.2s;
        }

        .volunteer-item:hover {
            background-color: #f1f5f9;
        }

        .volunteer-item.selected {
            background-color: #dbeafe;
            border: 2px solid #3b82f6;
        }

        .volunteer-meta {
            color: #64748b;
            font-size: 0.85rem;
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }

        .empty-state mat-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
            margin-bottom: 16px;
            opacity: 0.3;
        }

        .empty-state .hint {
            font-size: 0.85rem;
            margin-top: 8px;
        }

        mat-dialog-content {
            min-width: 500px;
            max-height: 500px;
        }
    `]
})
export class AssignVolunteerShiftDialogComponent implements OnInit {
    private ngoService = inject(NgoService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<AssignVolunteerShiftDialogComponent>);
    private cdr = inject(ChangeDetectorRef);

    volunteers: Volunteer[] = [];
    selectedVolunteer: Volunteer | null = null;
    loading = false;
    assigning = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { shift: any, organizationId: string }) {}

    ngOnInit() {
        this.loadVolunteers();
    }

    loadVolunteers() {
        this.loading = true;
        this.cdr.detectChanges(); // Force UI update
        
        this.ngoService.getVolunteers(this.data.organizationId).subscribe({
            next: (response: any) => {
                console.log('Volunteers loaded:', response);
                if (response.success) {
                    // Filter only verified volunteers
                    this.volunteers = response.data.filter((v: Volunteer) => 
                        v.verificationStatus === 'verified'
                    );
                }
                this.loading = false;
                this.cdr.detectChanges(); // Force UI update after data loads
            },
            error: (error: any) => {
                console.error('Error loading volunteers:', error);
                this.snackBar.open('Error loading volunteers', 'Close', { duration: 3000 });
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    selectVolunteer(volunteer: Volunteer) {
        this.selectedVolunteer = volunteer;
        this.cdr.detectChanges(); // Force UI update on selection
    }

    onAssign() {
        if (!this.selectedVolunteer) return;

        this.assigning = true;
        this.cdr.detectChanges();
        
        this.ngoService.assignVolunteerToShift(this.data.shift._id, this.selectedVolunteer._id).subscribe({
            next: () => {
                this.snackBar.open(`Shift assigned to ${this.selectedVolunteer!.fullName}`, 'Close', { duration: 2000 });
                this.dialogRef.close(true);
            },
            error: (error: any) => {
                console.error('Error assigning volunteer:', error);
                this.snackBar.open('Error assigning volunteer', 'Close', { duration: 3000 });
                this.assigning = false;
                this.cdr.detectChanges();
            }
        });
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    onCancel() {
        this.dialogRef.close();
    }
}
