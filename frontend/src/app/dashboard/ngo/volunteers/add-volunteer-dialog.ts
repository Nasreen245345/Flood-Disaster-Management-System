import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-add-volunteer-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule
    ],
    template: `
    <h2 mat-dialog-title>Add NGO Volunteer</h2>
    <p class="subtitle">Register a volunteer working under your organization</p>
    
    <form [formGroup]="volunteerForm" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
            <div class="form-grid">
                <!-- Section 1: Basic Info -->
                <div class="section">
                    <h3>Basic Information</h3>
                    <div class="row">
                        <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Full Name</mat-label>
                            <input matInput formControlName="name" placeholder="John Doe">
                            <mat-error *ngIf="volunteerForm.get('name')?.hasError('required')">Name is required</mat-error>
                        </mat-form-field>
                    </div>
                    <div class="row">
                        <mat-form-field appearance="outline">
                            <mat-label>CNIC / National ID</mat-label>
                            <input matInput formControlName="cnic" placeholder="12345-1234567-1">
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                            <mat-label>Phone Number</mat-label>
                            <input matInput formControlName="contact" placeholder="+92 300 1234567">
                             <mat-error *ngIf="volunteerForm.get('contact')?.hasError('required')">Phone is required</mat-error>
                        </mat-form-field>
                    </div>
                    <div class="row">
                         <mat-form-field appearance="outline" class="col-span-2">
                            <mat-label>Email Address</mat-label>
                            <input matInput formControlName="email" placeholder="john@example.com">
                        </mat-form-field>
                    </div>
                </div>

                <!-- Section 2: Role & Expertise -->
                <div class="section">
                    <h3>Volunteer Role & Expertise</h3>
                    <div class="row">
                        <mat-form-field appearance="outline">
                            <mat-label>Volunteer Type</mat-label>
                            <mat-select formControlName="type" [disabled]="true">
                                <mat-option value="NGO Volunteer">NGO Volunteer</mat-option>
                            </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline">
                            <mat-label>Primary Expertise</mat-label>
                            <mat-select formControlName="expertise">
                                <mat-option value="Doctor">Doctor</mat-option>
                                <mat-option value="Nurse">Nurse</mat-option>
                                <mat-option value="Paramedic">Paramedic</mat-option>
                                <mat-option value="Medical Assistant">Medical Assistant</mat-option>
                                <mat-option value="Logistics">Logistics</mat-option>
                                <mat-option value="Driver">Driver</mat-option>
                                <mat-option value="General Support">General Support</mat-option>
                            </mat-select>
                            <mat-error *ngIf="volunteerForm.get('expertise')?.hasError('required')">Expertise is required</mat-error>
                        </mat-form-field>
                    </div>
                    <div class="row">
                        <mat-form-field appearance="outline">
                            <mat-label>Years of Experience</mat-label>
                            <input matInput type="number" formControlName="experience" min="0">
                        </mat-form-field>
                    </div>
                </div>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button type="button" mat-dialog-close>Cancel</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="volunteerForm.invalid">Register Volunteer</button>
        </mat-dialog-actions>
    </form>
  `,
    styles: [`
    .subtitle { margin: -10px 0 20px 0; color: #64748b; font-size: 0.9rem; }
    .form-grid { display: flex; flex-direction: column; gap: 24px; padding-bottom: 16px; width: 600px; max-width: 100%; }
    .section h3 { font-size: 1rem; color: #1e293b; margin: 0 0 16px 0; font-weight: 600; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 8px; }
    .col-span-2 { grid-column: span 2; }
    @media (max-width: 600px) {
        .row { grid-template-columns: 1fr; }
        .col-span-2 { grid-column: span 1; }
        .form-grid { width: 100%; }
    }
  `]
})
export class AddVolunteerDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<AddVolunteerDialogComponent>);

    volunteerForm = this.fb.group({
        name: ['', Validators.required],
        cnic: [''],
        contact: ['', Validators.required],
        email: [''],
        type: [{ value: 'NGO Volunteer', disabled: true }],
        expertise: ['', Validators.required],
        experience: ['']
    });

    onSubmit() {
        if (this.volunteerForm.valid) {
            this.dialogRef.close(this.volunteerForm.getRawValue());
        }
    }
}
