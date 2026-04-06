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
    activeTaskCount: number;
}

@Component({
    selector: 'app-assign-volunteer-dialog',
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
        <h2 mat-dialog-title>Assign Volunteer</h2>
        <mat-dialog-content>
            <div class="task-info">
                <h3>{{ data.task.title }}</h3>
                <p>{{ data.task.description }}</p>
            </div>

            <div *ngIf="loading" class="loading-container">
                <mat-spinner diameter="40"></mat-spinner>
                <p>Loading available volunteers...</p>
            </div>

            <mat-list *ngIf="!loading && volunteers.length > 0">
                <mat-list-item *ngFor="let volunteer of volunteers" 
                               class="volunteer-item"
                               [class.selected]="selectedVolunteer?._id === volunteer._id"
                               (click)="selectVolunteer(volunteer); $event.stopPropagation()">
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
                        <mat-chip [color]="volunteer.activeTaskCount === 0 ? 'primary' : 'accent'">
                            {{ volunteer.activeTaskCount }} active tasks
                        </mat-chip>
                    </div>
                </mat-list-item>
            </mat-list>

            <div *ngIf="!loading && volunteers.length === 0" class="empty-state">
                <mat-icon>person_off</mat-icon>
                <p>No available volunteers found</p>
                <p class="hint">Make sure volunteers are verified and active</p>
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
        .task-info {
            background: #f8fafc;
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .task-info h3 {
            margin: 0 0 8px 0;
            color: #1e293b;
        }

        .task-info p {
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
            position: relative;
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
export class AssignVolunteerDialogComponent implements OnInit {
    private ngoService = inject(NgoService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<AssignVolunteerDialogComponent>);
    private cdr = inject(ChangeDetectorRef);

    volunteers: Volunteer[] = [];
    selectedVolunteer: Volunteer | null = null;
    loading = false;
    assigning = false;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { task: any, organizationId: string }) {}

    ngOnInit() {
        this.loadAvailableVolunteers();
    }

    loadAvailableVolunteers() {
        this.loading = true;
        this.cdr.detectChanges(); // Force change detection
        
        this.ngoService.getAvailableVolunteers(this.data.task._id).subscribe({
            next: (response: any) => {
                if (response.success) {
                    this.volunteers = response.data;
                }
                this.loading = false;
                this.cdr.detectChanges(); // Force change detection after data loads
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
        console.log('Volunteer selected:', volunteer.fullName);
        this.selectedVolunteer = volunteer;
        this.cdr.detectChanges(); // Force change detection on selection
    }

    onAssign() {
        if (!this.selectedVolunteer) return;

        this.assigning = true;
        this.cdr.detectChanges();
        
        this.ngoService.assignTask(this.data.task._id, this.selectedVolunteer._id).subscribe({
            next: () => {
                this.snackBar.open(`Task assigned to ${this.selectedVolunteer!.fullName}`, 'Close', { duration: 2000 });
                this.dialogRef.close(true);
            },
            error: (error: any) => {
                console.error('Error assigning task:', error);
                this.snackBar.open('Error assigning task', 'Close', { duration: 3000 });
                this.assigning = false;
                this.cdr.detectChanges();
            }
        });
    }

    onCancel() {
        this.dialogRef.close();
    }
}
