import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface NGO {
  _id: string;
  name: string;
  type: string;
  contact: {
    email: string;
    phone: string;
  };
}

@Component({
  selector: 'app-volunteer-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatCheckboxModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './volunteer-register.html',
  styleUrls: ['./volunteer-register.css']
})
export class VolunteerRegisterComponent implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private apiUrl = 'http://localhost:5000/api';

  approvedNGOs: NGO[] = [];
  loading = false;
  isSubmitting = false;
  isEditMode = false;
  volunteerProfile: any = null;

  // Form groups
  basicInfoForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    cnic: ['', [Validators.required, Validators.pattern(/^\d{5}-\d{7}-\d{1}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?\d{10,15}$/)]],
    email: ['', [Validators.email]],
    assignedNGO: ['', Validators.required]
  });

  classificationForm: FormGroup = this.fb.group({
    category: ['', Validators.required],
    skillLevel: ['', Validators.required]
  });

  availabilityForm: FormGroup = this.fb.group({
    availabilityStatus: ['active', Validators.required],
    shiftType: ['full_day', Validators.required]
  });

  deploymentForm: FormGroup = this.fb.group({
    preferredWorkingArea: [''],
    hasMobility: [false],
    hasVehicle: [false]
  });

  categories = [
    { value: 'medical', label: '🏥 Medical', description: 'Healthcare and emergency medical services' },
    { value: 'food_distribution', label: '🍲 Food Distribution', description: 'Food and water distribution' },
    { value: 'shelter_management', label: '⛺ Shelter Management', description: 'Shelter setup and management' },
    { value: 'logistics', label: '🚚 Logistics', description: 'Transportation and supply chain' },
    { value: 'general_support', label: '🤝 General Support', description: 'General assistance and support' }
  ];

  skillLevels = [
    { value: 'beginner', label: 'Beginner', rate: 15, description: 'New volunteer, basic training' },
    { value: 'trained', label: 'Trained', rate: 20, description: 'Completed volunteer training' },
    { value: 'certified_professional', label: 'Certified Professional', rate: 25, description: 'Professional certification' },
    { value: 'doctor', label: 'Doctor', rate: 40, description: 'Medical doctor' },
    { value: 'nurse', label: 'Nurse', rate: 35, description: 'Registered nurse' },
    { value: 'paramedic', label: 'Paramedic', rate: 30, description: 'Certified paramedic' }
  ];

  ngOnInit() {
    // Check if in edit mode
    this.route.queryParams.subscribe(params => {
      if (params['edit'] === 'true') {
        this.isEditMode = true;
        this.loadVolunteerProfile();
      }
    });
    
    this.loadApprovedNGOs();
  }

  private loadVolunteerProfile() {
    const token = localStorage.getItem('dms_token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers }).subscribe({
      next: (response) => {
        if (response.success) {
          this.volunteerProfile = response.data;
          this.populateForm();
        }
      },
      error: (err) => {
        console.error('Error loading volunteer profile:', err);
      }
    });
  }

  private populateForm() {
    if (!this.volunteerProfile) return;

    this.basicInfoForm.patchValue({
      fullName: this.volunteerProfile.fullName,
      cnic: this.volunteerProfile.cnic,
      phone: this.volunteerProfile.phone,
      email: this.volunteerProfile.email,
      assignedNGO: this.volunteerProfile.assignedNGO?._id || this.volunteerProfile.assignedNGO
    });

    this.classificationForm.patchValue({
      category: this.volunteerProfile.category,
      skillLevel: this.volunteerProfile.skillLevel
    });

    this.availabilityForm.patchValue({
      availabilityStatus: this.volunteerProfile.availabilityStatus,
      shiftType: this.volunteerProfile.shiftType
    });

    this.deploymentForm.patchValue({
      preferredWorkingArea: this.volunteerProfile.preferredWorkingArea,
      hasMobility: this.volunteerProfile.hasMobility,
      hasVehicle: this.volunteerProfile.hasVehicle
    });
  }

  private loadApprovedNGOs() {
    this.loading = true;
    this.http.get<any>(`${this.apiUrl}/organizations/approved/list`).subscribe({
      next: (response) => {
        if (response.success) {
          this.approvedNGOs = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading NGOs:', err);
        this.snackBar.open('Failed to load NGOs', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  getSelectedSkillRate(): number {
    const skillLevel = this.classificationForm.get('skillLevel')?.value;
    const skill = this.skillLevels.find(s => s.value === skillLevel);
    return skill?.rate || 20;
  }

  onSubmit() {
    if (this.basicInfoForm.invalid || this.classificationForm.invalid || this.availabilityForm.invalid) {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;

    const formData = {
      ...this.basicInfoForm.value,
      ...this.classificationForm.value,
      ...this.availabilityForm.value,
      ...this.deploymentForm.value
    };

    const token = localStorage.getItem('dms_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    if (this.isEditMode && this.volunteerProfile) {
      // Update existing profile
      this.http.put<any>(`${this.apiUrl}/volunteers/${this.volunteerProfile._id}`, formData, { headers }).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open('Volunteer profile updated successfully!', 'Close', { duration: 5000 });
            this.router.navigate(['/dashboard/profile']);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Update error:', err);
          const message = err.error?.message || 'Failed to update. Please try again.';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    } else {
      // Create new profile
      this.http.post<any>(`${this.apiUrl}/volunteers`, formData, { headers }).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open('Volunteer profile created successfully! Awaiting verification.', 'Close', { duration: 5000 });
            this.router.navigate(['/dashboard/volunteer/home']);
          }
        },
        error: (err) => {
          this.isSubmitting = false;
          console.error('Registration error:', err);
          const message = err.error?.message || 'Failed to register. Please try again.';
          this.snackBar.open(message, 'Close', { duration: 5000 });
        }
      });
    }
  }
}
