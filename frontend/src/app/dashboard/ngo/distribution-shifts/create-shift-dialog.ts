import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgoService } from '../services/ngo.service';

import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-create-shift-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
        MatInputModule, MatSelectModule, MatButtonModule, MatDatepickerModule,
        MatNativeDateModule, MatSnackBarModule, MatProgressSpinnerModule
    ],
    template: `
        <h2 mat-dialog-title>Create Distribution Shift</h2>
        <mat-dialog-content>
            <form [formGroup]="shiftForm" class="shift-form">

                <!-- Disaster Selector -->
                <mat-form-field appearance="outline">
                    <mat-label>Associated Disaster</mat-label>
                    <mat-select formControlName="disaster" required (selectionChange)="onDisasterChange($event.value)">
                        <mat-option *ngIf="loadingDisasters" disabled>Loading disasters...</mat-option>
                        <mat-option *ngFor="let d of disasters" [value]="d._id">
                            {{ d.disasterType | titlecase }} — {{ d.location }} ({{ d.severity }})
                        </mat-option>
                        <mat-option *ngIf="!loadingDisasters && disasters.length === 0" disabled>
                            No active disasters assigned to your NGO
                        </mat-option>
                    </mat-select>
                    <mat-hint>Select the disaster this shift is for</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Distribution Point Location</mat-label>
                    <input matInput formControlName="location" required>
                    <mat-hint>e.g., "Main Relief Camp, Nowshera"</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Shift Start Date</mat-label>
                    <input matInput [matDatepicker]="startPicker" formControlName="shiftStart" required>
                    <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
                    <mat-datepicker #startPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Start Time (HH:MM)</mat-label>
                    <input matInput formControlName="startTime" placeholder="09:00" required>
                    <mat-hint>24-hour format</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Shift End Date</mat-label>
                    <input matInput [matDatepicker]="endPicker" formControlName="shiftEnd" required>
                    <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
                    <mat-datepicker #endPicker></mat-datepicker>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>End Time (HH:MM)</mat-label>
                    <input matInput formControlName="endTime" placeholder="17:00" required>
                    <mat-hint>24-hour format</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Notes (Optional)</mat-label>
                    <textarea matInput formControlName="notes" rows="2"></textarea>
                </mat-form-field>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button mat-raised-button color="primary" (click)="onCreate()" [disabled]="!shiftForm.valid || loading">
                {{ loading ? 'Creating...' : 'Create Shift' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .shift-form { display: flex; flex-direction: column; gap: 16px; min-width: 500px; }
        mat-dialog-content { padding: 20px 24px; }
    `]
})
export class CreateShiftDialogComponent implements OnInit {
    private fb = inject(FormBuilder);
    private ngoService = inject(NgoService);
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<CreateShiftDialogComponent>);

    private apiUrl = environment.apiUrl;
    loading = false;
    loadingDisasters = true;
    disasters: any[] = [];
    selectedDisaster: any = null;

    shiftForm: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { organizationId: string }) {
        const today = new Date();
        this.shiftForm = this.fb.group({
            disaster: ['', Validators.required],
            location: ['', Validators.required],
            shiftStart: [today, Validators.required],
            startTime: ['09:00', Validators.required],
            shiftEnd: [today, Validators.required],
            endTime: ['17:00', Validators.required],
            notes: ['']
        });
    }

    ngOnInit() {
        this.loadDisasters();
    }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    loadDisasters() {
        this.loadingDisasters = true;
        this.http.get<any>(`${this.apiUrl}/distribution/ngo-disasters/${this.data.organizationId}`, {
            headers: this.getHeaders()
        }).subscribe({
            next: (res) => {
                if (res.success) this.disasters = res.data;
                this.loadingDisasters = false;
            },
            error: () => { this.loadingDisasters = false; }
        });
    }

    onDisasterChange(disasterId: string) {
        this.selectedDisaster = this.disasters.find(d => d._id === disasterId);
        // Auto-fill location from disaster
        if (this.selectedDisaster) {
            this.shiftForm.patchValue({
                location: `Relief Camp — ${this.selectedDisaster.location}`
            });
        }
    }

    onCreate() {
        if (this.shiftForm.invalid) return;
        const v = this.shiftForm.value;

        const shiftStart = this.combineDateTime(v.shiftStart, v.startTime);
        const shiftEnd = this.combineDateTime(v.shiftEnd, v.endTime);

        if (shiftEnd <= shiftStart) {
            this.snackBar.open('End time must be after start time', 'Close', { duration: 3000 });
            return;
        }

        this.loading = true;
        const payload: any = {
            organization: this.data.organizationId,
            disaster: v.disaster,
            location: v.location,
            shiftStart: shiftStart.toISOString(),
            shiftEnd: shiftEnd.toISOString(),
            notes: v.notes
        };

        // Auto-fill coordinates from selected disaster
        if (this.selectedDisaster?.coordinates?.latitude) {
            payload.coordinates = {
                latitude: this.selectedDisaster.coordinates.latitude,
                longitude: this.selectedDisaster.coordinates.longitude
            };
        }

        this.ngoService.createShift(payload).subscribe({
            next: () => {
                this.snackBar.open('Shift created successfully', 'Close', { duration: 2000 });
                this.dialogRef.close(true);
            },
            error: (err: any) => {
                this.snackBar.open('Error creating shift', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    combineDateTime(date: Date, time: string): Date {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(date);
        d.setHours(h, m, 0, 0);
        return d;
    }

    onCancel() { this.dialogRef.close(); }
}
