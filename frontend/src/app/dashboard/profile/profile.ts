import { environment } from '../../../environments/environment';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../auth/services/auth.service';
import { VictimService } from '../victim/services/victim.service';
import { EditProfileDialogComponent } from './edit-profile-dialog/edit-profile-dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
    selector: 'app-profile',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule],
    templateUrl: './profile.html',
    styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
    authService = inject(AuthService);
    victimService = inject(VictimService);
    dialog = inject(MatDialog);
    private http = inject(HttpClient);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);
    private apiUrl = environment.apiUrl;

    victimProfile$ = this.victimService.profile$;
    volunteerProfile: any = null;
    loadingVolunteerProfile = false;

    get user() {
        return this.authService.getCurrentUser();
    }

    // Mock activity
    activities = [
        { action: 'Logged in', time: new Date() },
        { action: 'Updated Settings', time: new Date(Date.now() - 3600000) },
        { action: 'Viewed Reports', time: new Date(Date.now() - 86400000) }
    ];

    ngOnInit() {
        // If user is volunteer, fetch volunteer profile
        if (this.user?.role === 'volunteer') {
            this.loadVolunteerProfile();
        }
    }

    private loadVolunteerProfile() {
        this.loadingVolunteerProfile = true;
        const token = localStorage.getItem('dms_token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers }).subscribe({
            next: (response) => {
                if (response.success) {
                    this.volunteerProfile = response.data;
                }
                this.loadingVolunteerProfile = false;
            },
            error: (err) => {
                this.loadingVolunteerProfile = false;
                if (err.status === 404) {
                    // No volunteer profile yet
                    this.volunteerProfile = null;
                }
            }
        });
    }

    openEditProfile() {
        // If volunteer and no profile, redirect to registration
        if (this.user?.role === 'volunteer' && !this.volunteerProfile) {
            this.snackBar.open('Please complete your volunteer profile first', 'OK', { duration: 3000 });
            this.router.navigate(['/dashboard/volunteer/register']);
            return;
        }

        // If volunteer with profile, open volunteer edit form
        if (this.user?.role === 'volunteer' && this.volunteerProfile) {
            this.router.navigate(['/dashboard/volunteer/register'], {
                queryParams: { edit: 'true' }
            });
            return;
        }

        // For other roles, open the regular edit dialog
        this.dialog.open(EditProfileDialogComponent, {
            width: '500px',
            data: { user: this.user }
        }).afterClosed().subscribe(result => {
            if (result) {
                console.log('Profile updated:', result);
            }
        });
    }
}


