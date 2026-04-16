import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-add-item-dialog',
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
    templateUrl: './add-item-dialog.html',
    styleUrls: ['./add-item-dialog.css']
})
export class AddItemDialogComponent {
    private fb = inject(FormBuilder);
    private dialogRef = inject(MatDialogRef<AddItemDialogComponent>);

    isEditMode = false;

    form = this.fb.group({
        packageName: ['', Validators.required],
        category: ['food', Validators.required],
        quantity: [0, [Validators.required, Validators.min(0)]],
        description: ['']
    });

    packageCategories = [
        { value: 'food', label: 'Food Package', icon: 'restaurant', color: '#16a34a' },
        { value: 'medical', label: 'Medical Kit', icon: 'medical_services', color: '#dc2626' },
        { value: 'shelter', label: 'Shelter Kit', icon: 'home', color: '#ea580c' },
        { value: 'clothing', label: 'Clothing Package', icon: 'checkroom', color: '#2563eb' }
    ];

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
        if (data) {
            this.isEditMode = true;
            this.form.patchValue({
                packageName: data.packageName,
                category: data.category,
                quantity: data.quantity,
                description: data.description || ''
            });
        }
    }

    submit() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    close() {
        this.dialogRef.close();
    }
}
