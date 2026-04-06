import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';
import { InputFieldComponent } from '../../shared/components/input-field/input-field';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatProgressBarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    InputFieldComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  authService = inject(AuthService);
  snackBar = inject(MatSnackBar);
  fb = inject(FormBuilder);
  cdr = inject(ChangeDetectorRef);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  cnicForm: FormGroup = this.fb.group({
    cnic: ['', [Validators.required]],
    phone: ['', [Validators.required]]
  });

  isLoading = false;

  onSubmit() {
    if (this.loginForm.invalid) return;
    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: () => { this.isLoading = false; },
      error: () => {
        this.isLoading = false;
        this.snackBar.open('Invalid credentials', 'Close', { duration: 3000 });
        this.cdr.detectChanges();
      }
    });
  }

  onCnicLogin() {
    if (this.cnicForm.invalid) return;
    this.isLoading = true;
    // Strip dashes and spaces before sending
    const cnic = this.cnicForm.value.cnic.replace(/[-\s]/g, '');
    const phone = this.cnicForm.value.phone.trim();

    this.authService.cnicLogin(cnic, phone).subscribe({
      next: () => { this.isLoading = false; },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err.error?.message || 'CNIC or phone number not found';
        this.snackBar.open(msg, 'Close', { duration: 4000 });
        this.cdr.detectChanges();
      }
    });
  }

  get emailControl() { return this.loginForm.get('email') as any; }
  get passwordControl() { return this.loginForm.get('password') as any; }
  get cnicControl() { return this.cnicForm.get('cnic') as any; }
  get phoneControl() { return this.cnicForm.get('phone') as any; }
}
