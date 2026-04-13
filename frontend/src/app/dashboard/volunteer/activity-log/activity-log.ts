import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { VolunteerService, VolunteerStats } from '../services/volunteer.service';

import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatProgressBarModule, MatProgressSpinnerModule],
    templateUrl: './activity-log.html',
    styleUrls: ['./activity-log.css']
})
export class ActivityLogComponent implements OnInit {
    private volunteerService = inject(VolunteerService);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private apiUrl = environment.apiUrl;

    stats: VolunteerStats = { hoursServed: 0, tasksCompleted: 0, distributionsAssisted: 0, currentStreak: 0 };
    completedTasks: any[] = [];
    loading = true;

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    ngOnInit() {
        // Get volunteer profile to get ID
        this.http.get<any>(`${this.apiUrl}/volunteers/me`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) {
                    const volunteerId = res.data._id;
                    this.volunteerService.loadStats(volunteerId);
                    this.volunteerService.getMyTasks(volunteerId).subscribe();
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });

        this.volunteerService.stats$.subscribe(s => {
            this.stats = s;
            this.cdr.detectChanges();
        });

        this.volunteerService.tasks$.subscribe(tasks => {
            this.completedTasks = tasks.filter(t => t.status === 'completed');
            this.cdr.detectChanges();
        });
    }
}
