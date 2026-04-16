import { environment } from '../../../../environments/environment';
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-report-disaster-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    MatCheckboxModule
  ],
  templateUrl: './report-disaster-dialog.html',
  styleUrls: ['./report-disaster-dialog.css']
})
export class ReportDisasterDialogComponent {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<ReportDisasterDialogComponent>);
  private snackBar = inject(MatSnackBar);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/disasters';

  coordinates: { latitude: number; longitude: number } | null = null;
  isDetectingLocation = false;
  locationDetected = false;

  reportForm: FormGroup = this.fb.group({
    location: ['', Validators.required],
    disasterType: ['', Validators.required],
    severity: ['medium', Validators.required],
    peopleAffected: [null],
    needs: this.fb.group({
      food: [false],
      water: [false],
      shelter: [false],
      medical: [false],
      rescue: [false],
      other: [false]
    }),
    comments: [''],
    contactName: [''],
    contactPhone: ['']
  });

  isSubmitting = false;

  detectLocation() {
    if (!navigator.geolocation) {
      this.snackBar.open('Geolocation not supported by your browser', 'Close', { duration: 3000 });
      return;
    }
    this.isDetectingLocation = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
        this.locationDetected = true;
        this.isDetectingLocation = false;
        // Auto-fill location field with coordinates
        this.reportForm.patchValue({
          location: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`
        });
        this.snackBar.open('Location detected successfully!', 'Close', { duration: 2000 });
      },
      () => {
        this.isDetectingLocation = false;
        this.snackBar.open('Could not detect location. Please enter manually.', 'Close', { duration: 3000 });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  onSubmit() {
    if (this.reportForm.invalid) return;
    this.isSubmitting = true;

    const payload = {
      ...this.reportForm.value,
      coordinates: this.coordinates  // Include GPS coordinates
    };

    this.http.post<any>(this.apiUrl, payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Disaster report submitted. Monitoring team alerted.', 'OK', { duration: 5000 });
        this.dialogRef.close(response.data);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error('Disaster Report Error:', err);
        this.snackBar.open('Failed to submit disaster report. Please try again.', 'Close', { duration: 5000 });
      }
    });
  }

  onCancel() {
    this.dialogRef.close();
  }
}


