import { environment } from '../../../environments/environment';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../auth/services/auth.service';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
        MatIconModule, MatDividerModule, MatFormFieldModule, MatInputModule,
        MatSnackBarModule, MatChipsModule, MatProgressSpinnerModule
    ],
    templateUrl: './profile.html',
    styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
    private authService = inject(AuthService);
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);

    private apiUrl = environment.apiUrl;

    user = this.authService.getCurrentUser();
    volunteerProfile: any = null;
    ngoProfile: any = null;
    loading = false;
    saving = false;
    editMode = false;

    profileForm: FormGroup = this.fb.group({
        name: [this.user?.name || '', Validators.required],
        phone: [this.user?.phone || ''],
        region: [this.user?.region || ''],
        currentPassword: [''],
        newPassword: ['']
    });

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    ngOnInit() {
        if (this.user?.role === 'volunteer') this.loadVolunteerProfile();
        if (this.user?.role === 'ngo') this.loadNgoProfile();
    }

    loadVolunteerProfile() {
        this.loading = true;
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers: this.getHeaders() }).subscribe({
            next: (res) => { if (res.success) this.volunteerProfile = res.data; this.loading = false; this.cdr.detectChanges(); },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
    }

    loadNgoProfile() {
        this.loading = true;
        this.http.get<any>(`${this.apiUrl}/organizations/me`, { headers: this.getHeaders() }).subscribe({
            next: (res) => { if (res.success) this.ngoProfile = res.data; this.loading = false; this.cdr.detectChanges(); },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
    }

    toggleEdit() {
        this.editMode = !this.editMode;
        if (this.editMode) {
            this.profileForm.patchValue({
                name: this.user?.name || '',
                phone: this.user?.phone || '',
                region: this.user?.region || '',
                currentPassword: '',
                newPassword: ''
            });
        }
    }

    saveProfile() {
        if (this.profileForm.invalid) return;
        this.saving = true;

        const payload: any = {
            name: this.profileForm.value.name,
            phone: this.profileForm.value.phone,
            region: this.profileForm.value.region
        };
        if (this.profileForm.value.newPassword && this.profileForm.value.currentPassword) {
            payload.currentPassword = this.profileForm.value.currentPassword;
            payload.newPassword = this.profileForm.value.newPassword;
        }

        this.http.put<any>(`${this.apiUrl}/users/me`, payload, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) {
                    // Update local user data
                    const updated = { ...this.user, name: payload.name, phone: payload.phone, region: payload.region };
                    localStorage.setItem('dms_user', JSON.stringify(updated));
                    this.user = updated as any;
                    this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
                    this.editMode = false;
                }
                this.saving = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.snackBar.open(err.error?.message || 'Error updating profile', 'Close', { duration: 3000 });
                this.saving = false;
                this.cdr.detectChanges();
            }
        });
    }

    getRoleBadgeColor(): string {
        return ({ admin: '#dc2626', ngo: '#0891b2', volunteer: '#d97706', victim: '#ea580c' } as Record<string, string>)[this.user?.role || ''] || '#6b7280';
    }

    capitalize(s: string): string {
        return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
    }
}


