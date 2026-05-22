import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
    selector: 'app-edit-profile-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        MatTabsModule,
        MatSelectModule,
        MatChipsModule,
        MatCheckboxModule
    ],
    templateUrl: './edit-profile-dialog.html',
    styleUrls: ['./edit-profile-dialog.css']
})
export class EditProfileDialogComponent implements OnInit {
    profileForm: FormGroup;
    role: string = '';

    // Options for dropdowns
    serviceCategories = ['Health', 'Food', 'Shelter', 'Education', 'Logistics'];
    expertiseOptions = ['Medical', 'Logistics', 'Search & Rescue', 'General Support', 'Education'];

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<EditProfileDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.role = data.user.role || 'volunteer'; // Default/Fallback
        this.profileForm = this.fb.group({}); // Initialized in ngOnInit
    }

    ngOnInit() {
        this.initForm();
    }

    initForm() {
        const user = this.data.user;

        // Common Fields (Identity)
        // Note: Admin Name is editable, Victim Name is read-only (based on prompt)
        // We'll handle disabled state in template or via 'disabled' prop here

        if (this.role === 'admin') {
            this.profileForm = this.fb.group({
                fullName: [user.name, [Validators.required, Validators.maxLength(100)]],
                email: [user.email, [Validators.required, Validators.email]],
                phone: [user.phone || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                currentPassword: [''],
                newPassword: ['', [Validators.minLength(6)]]
            });
        }
        else if (this.role === 'ngo') {
            this.profileForm = this.fb.group({
                orgName: [user.name, [Validators.required, Validators.maxLength(150)]],
                email: [user.email, [Validators.required, Validators.email]],
                phone: [user.phone || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                address: [user.address || '', [Validators.required, Validators.maxLength(300)]],
                serviceCategory: [user.category || 'Food'],
                maxCapacity: [user.capacity || 100, [Validators.min(0), Validators.max(100000)]],
                emergencyContact: [user.emergencyContact || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                currentPassword: [''],
                newPassword: ['', [Validators.minLength(6)]]
            });
        }
        else if (this.role === 'volunteer') {
            this.profileForm = this.fb.group({
                fullName: [user.name, [Validators.required, Validators.maxLength(100)]],
                email: [user.email, [Validators.required, Validators.email]],
                phone: [user.phone || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                expertise: [user.expertise || []],
                availability: [user.availability || 'Active'],
                currentPassword: [''],
                newPassword: ['', [Validators.minLength(6)]]
            });
        }
        else if (this.role === 'victim') {
            this.profileForm = this.fb.group({
                fullName: [{ value: user.name, disabled: true }], // Read-only for victim
                phone: [user.phone || '', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
                address: [user.address || '', [Validators.required, Validators.maxLength(300)]], // Temp address
                familySize: [user.familySize || 1, [Validators.min(1), Validators.max(50)]],
                specialNeeds: [user.specialNeeds || []]
                // No password change for victim in this simple flow? Or add if needed.
            });
        }
    }

    save() {
        if (this.profileForm.valid) {
            // Logic to filter out unchanged or read-only values would go here
            this.dialogRef.close(this.profileForm.getRawValue());
        }
    }

    close() {
        this.dialogRef.close();
    }

    // Helper for array controls if needed
}
