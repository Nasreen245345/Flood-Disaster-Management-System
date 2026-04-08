import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoService } from '../services/ngo.service';

@Component({
    selector: 'app-create-shift-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule
    ],
    template: `
        <h2 mat-dialog-title>Create Distribution Shift</h2>
        <mat-dialog-content>
            <form [formGroup]="shiftForm" class="shift-form">
                <mat-form-field appearance="outline">
                    <mat-label>Location</mat-label>
                    <input matInput formControlName="location" required>
                    <mat-hint>Distribution point location</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Shift Start Date & Time</mat-label>
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
                    <mat-label>Shift End Date & Time</mat-label>
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
                    <textarea matInput formControlName="notes" rows="3"></textarea>
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
        .shift-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 500px;
        }

        mat-dialog-content {
            padding: 20px 24px;
        }
    `]
})
export class CreateShiftDialogComponent {
    private fb = inject(FormBuilder);
    private ngoService = inject(NgoService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<CreateShiftDialogComponent>);

    loading = false;
    shiftForm: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { organizationId: string }) {
        const today = new Date();
        this.shiftForm = this.fb.group({
            location: ['', Validators.required],
            shiftStart: [today, Validators.required],
            startTime: ['09:00', Validators.required],
            shiftEnd: [today, Validators.required],
            endTime: ['17:00', Validators.required],
            notes: ['']
        });
    }

    onCreate() {
        if (this.shiftForm.invalid) return;

        const formValue = this.shiftForm.value;
        
        // Combine date and time
        const shiftStart = this.combineDateTime(formValue.shiftStart, formValue.startTime);
        const shiftEnd = this.combineDateTime(formValue.shiftEnd, formValue.endTime);

        if (shiftEnd <= shiftStart) {
            this.snackBar.open('End time must be after start time', 'Close', { duration: 3000 });
            return;
        }

        this.loading = true;
        const shiftData = {
            organization: this.data.organizationId,
            location: formValue.location,
            shiftStart: shiftStart.toISOString(),
            shiftEnd: shiftEnd.toISOString(),
            notes: formValue.notes
        };

        this.ngoService.createShift(shiftData).subscribe({
            next: () => {
                this.snackBar.open('Shift created successfully', 'Close', { duration: 2000 });
                this.dialogRef.close(true);
            },
            error: (error: any) => {
                console.error('Error creating shift:', error);
                this.snackBar.open('Error creating shift', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    combineDateTime(date: Date, time: string): Date {
        const [hours, minutes] = time.split(':').map(Number);
        const combined = new Date(date);
        combined.setHours(hours, minutes, 0, 0);
        return combined;
    }

    onCancel() {
        this.dialogRef.close();
    }
}
