import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { VolunteerService, VolunteerTask } from '../services/volunteer.service';
import { map } from 'rxjs';

@Component({
    selector: 'app-my-tasks',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTabsModule, MatChipsModule, MatSnackBarModule, MatTooltipModule],
    templateUrl: './my-tasks.html',
    styleUrls: ['./my-tasks.css']
})
export class MyTasksComponent implements OnInit {
    volunteerService = inject(VolunteerService);
    private snackBar = inject(MatSnackBar);

    tasks$ = this.volunteerService.tasks$;
    loading = false;

    pendingTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.status === 'pending' || t.status === 'assigned')));
    activeTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.status === 'in_progress')));
    completedTasks$ = this.tasks$.pipe(map(tasks => tasks.filter(t => t.status === 'completed')));

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        const user = JSON.parse(localStorage.getItem('dms_user') || '{}');
        const volunteerId = user.volunteerId;

        if (!volunteerId) {
            this.snackBar.open('Volunteer profile not found', 'Close', { duration: 3000 });
            return;
        }

        this.loading = true;
        this.volunteerService.getMyTasks(volunteerId).subscribe({
            next: () => {
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading tasks:', error);
                this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    startTask(id: string) {
        this.volunteerService.startTask(id).subscribe({
            next: () => {
                this.snackBar.open('Task started!', 'Close', { duration: 2000 });
                this.loadTasks();
            },
            error: (error) => {
                console.error('Error starting task:', error);
                this.snackBar.open('Error starting task', 'Close', { duration: 3000 });
            }
        });
    }

    completeTask(id: string) {
        this.volunteerService.completeTask(id, 'Task completed successfully').subscribe({
            next: () => {
                this.snackBar.open('Task completed!', 'Close', { duration: 2000 });
                this.loadTasks();
            },
            error: (error) => {
                console.error('Error completing task:', error);
                this.snackBar.open('Error completing task', 'Close', { duration: 3000 });
            }
        });
    }

    getTaskTypeIcon(type: string): string {
        switch (type) {
            case 'delivery': return 'local_shipping';
            case 'warehouse': return 'warehouse';
            case 'field_work': return 'explore';
            default: return 'assignment';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority) {
            case 'critical': return 'warn';
            case 'high': return 'warn';
            case 'medium': return 'accent';
            default: return 'primary';
        }
    }
}
