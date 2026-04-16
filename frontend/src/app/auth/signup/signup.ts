import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { InputFieldComponent } from '../../shared/components/input-field/input-field';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatProgressBarModule,
    MatIconModule,
    InputFieldComponent
  ],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent implements OnInit {
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);

  signupForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    role: ['victim', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  isLoading = false;

  ngOnInit() {
    // Check if role is specified in query params (e.g., from "Join as Volunteer" button)
    this.route.queryParams.subscribe(params => {
      if (params['role']) {
        this.signupForm.patchValue({ role: params['role'] });
      }
    });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  onSubmit() {
    if (this.signupForm.invalid) return;

    this.isLoading = true;
    
    this.authService.signup(this.signupForm.value).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.snackBar.open('Account created successfully!', 'OK', { duration: 3000 });
        // Auth service will automatically redirect to role-specific dashboard
      },
      error: (err) => {
        this.isLoading = false;
        const message = err.error?.message || 'Signup failed. Try again.';
        this.snackBar.open(message, 'Close', { duration: 3000 });
      }
    });
  }

  getControl(name: string) { return this.signupForm.get(name) as any; }
}
