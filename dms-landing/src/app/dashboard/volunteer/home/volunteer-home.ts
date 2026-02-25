import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { VolunteerService } from '../services/volunteer.service';
import { map } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
    selector: 'app-volunteer-home',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
    templateUrl: './volunteer-home.html',
    styleUrls: ['./volunteer-home.css']
})
export class VolunteerHomeComponent implements OnInit {
    volunteerService = inject(VolunteerService);
    private router = inject(Router);
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:5000/api';

    tasks$ = this.volunteerService.tasks$;
    stats$ = this.volunteerService.stats$;
    isCheckedIn$ = this.volunteerService.isCheckedIn$;

    // Get only the first active task for the "Current Task" card
    currentTask$ = this.tasks$.pipe(
        map(tasks => tasks.find(t => t.status === 'Active') || tasks.find(t => t.status === 'Pending'))
    );

    ngOnInit() {
        this.checkVolunteerProfile();
    }

    private checkVolunteerProfile() {
        const token = localStorage.getItem('dms_token');
        if (!token) return;

        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers }).subscribe({
            next: (response) => {
                // Profile exists, continue
                console.log('Volunteer profile found:', response.data);
            },
            error: (err) => {
                // Profile doesn't exist - redirect to registration
                if (err.status === 404) {
                    console.log('No volunteer profile found, redirecting to registration...');
                    this.router.navigate(['/dashboard/volunteer/register']);
                }
            }
        });
    }

    toggleCheckIn() {
        this.volunteerService.toggleCheckIn();
    }

    viewAllTasks() {
        this.router.navigate(['/dashboard/volunteer/tasks']);
    }
}
