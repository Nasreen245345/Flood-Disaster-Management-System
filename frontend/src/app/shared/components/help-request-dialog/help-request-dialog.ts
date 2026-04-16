import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-help-request-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './help-request-dialog.html',
  styleUrls: ['./help-request-dialog.css']
})
export class HelpRequestDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<HelpRequestDialogComponent>);
  private snackBar = inject(MatSnackBar);

  helpForm: FormGroup = this.fb.group({
    // Victim Information
    victimName: ['', Validators.required],
    victimCNIC: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],
    victimPhone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
    
    // Request Details
    location: ['', Validators.required],
    peopleCount: [1, [Validators.required, Validators.min(1)]], // This determines quantity!
    packagesNeeded: this.fb.array([this.createPackageItem()]), // Just category selection, no quantity
    urgency: ['high', Validators.required],
    additionalNotes: ['']
  });

  isSubmitting = false;
  isLoadingLocation = false;
  locationError = '';
  coordinates: { lat: number; lng: number } | null = null;

  // Available package categories
  packageCategories = [
    { value: 'food', label: 'Food Package', description: 'Essential food items' },
    { value: 'medical', label: 'Medical Kit', description: 'First aid and medicines' },
    { value: 'shelter', label: 'Shelter Kit', description: 'Tent and bedding' },
    { value: 'clothing', label: 'Clothing Package', description: 'Essential clothing items' }
  ];

  get packagesNeeded(): FormArray {
    return this.helpForm.get('packagesNeeded') as FormArray;
  }

  createPackageItem(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required]
      // No quantity field - it's calculated from peopleCount
    });
  }

  addPackage() {
    this.packagesNeeded.push(this.createPackageItem());
  }

  removePackage(index: number) {
    if (this.packagesNeeded.length > 1) {
      this.packagesNeeded.removeAt(index);
    }
  }

  onSubmit() {
    if (this.helpForm.invalid) return;

    this.isSubmitting = true;

    // Include coordinates if available
    const formValue = {
      ...this.helpForm.value,
      coordinates: this.coordinates
    };

    this.dialogRef.close(formValue);
  }

  onCancel() {
    this.dialogRef.close();
  }

  getCurrentLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser';
      this.snackBar.open('Geolocation not supported', 'Close', { duration: 3000 });
      return;
    }

    this.isLoadingLocation = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.coordinates = { lat, lng };

        // Store coordinates directly in location field
        this.isLoadingLocation = false;
        this.helpForm.patchValue({ 
          location: `${lat.toFixed(6)}, ${lng.toFixed(6)}` 
        });
        this.snackBar.open('Location detected successfully!', 'Close', { duration: 3000 });
      },
      (error) => {
        this.isLoadingLocation = false;
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            this.locationError = 'Location request timed out.';
            break;
          default:
            this.locationError = 'An unknown error occurred.';
        }
        
        this.snackBar.open(this.locationError, 'Close', { duration: 5000 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }
}
