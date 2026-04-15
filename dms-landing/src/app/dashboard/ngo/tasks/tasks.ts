import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgoService } from '../services/ngo.service';
import { CreateTaskDialogComponent } from './create-task-dialog';
import { AssignVolunteerDialogComponent } from './assign-volunteer-dialog';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';

interface Task {
    _id: string;
    taskType: 'delivery' | 'warehouse' | 'field_work' | 'other';
    title: string;
    description: string;
    status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'critical';
    location?: string;
    dueDate?: Date;
    assignedVolunteer?: any;
    relatedAidRequest?: any;
    createdAt: Date;
}

@Component({
    selector: 'app-ngo-tasks',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatChipsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        LocationNamePipe
    ],
    templateUrl: './tasks.html',
    styleUrls: ['./tasks.css']
})
export class NgoTasksComponent implements OnInit {
    private ngoService = inject(NgoService);
    private dialog = inject(MatDialog);
    private snackBar = inject(MatSnackBar);
    private cdr = inject(ChangeDetectorRef);

    tasks: Task[] = [];
    loading = false;
    organizationId: string = '';

    ngOnInit() {
        this.loadOrganization();
    }

    loadOrganization() {
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                if (response.success) {
                    this.organizationId = response.data._id;
                    this.loadTasks();
                }
                this.cdr.detectChanges();
            },
            error: (error) => {
                console.error('Error loading organization:', error);
                this.snackBar.open('Error loading organization', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
            }
        });
    }

    loadTasks() {
        if (!this.organizationId) return;

        this.loading = true;
        this.cdr.detectChanges();
        
        this.ngoService.getTasks(this.organizationId).subscribe({
            next: (response: any) => {
                if (response.success) {
                    this.tasks = response.data;
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('Error loading tasks:', error);
                this.snackBar.open('Error loading tasks', 'Close', { duration: 3000 });
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get pendingTasks() {
        return this.tasks.filter(t => t.status === 'pending');
    }

    get assignedTasks() {
        return this.tasks.filter(t => t.status === 'assigned');
    }

    get inProgressTasks() {
        return this.tasks.filter(t => t.status === 'in_progress');
    }

    get completedTasks() {
        return this.tasks.filter(t => t.status === 'completed');
    }

    openCreateTaskDialog() {
        const dialogRef = this.dialog.open(CreateTaskDialogComponent, {
            width: '600px',
            data: { organizationId: this.organizationId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
                this.cdr.detectChanges();
            }
        });
    }

    openAssignDialog(task: Task) {
        const dialogRef = this.dialog.open(AssignVolunteerDialogComponent, {
            width: '500px',
            data: { task, organizationId: this.organizationId }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.loadTasks();
                this.cdr.detectChanges();
            }
        });
    }

    deleteTask(taskId: string) {
        if (!confirm('Are you sure you want to delete this task?')) return;

        this.ngoService.deleteTask(taskId).subscribe({
            next: () => {
                this.snackBar.open('Task deleted', 'Close', { duration: 2000 });
                this.loadTasks();
                this.cdr.detectChanges();
            },
            error: (error: any) => {
                console.error('Error deleting task:', error);
                this.snackBar.open('Error deleting task', 'Close', { duration: 3000 });
                this.cdr.detectChanges();
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
            case 'critical': return '#dc2626';
            case 'high': return '#f59e0b';
            case 'medium': return '#3b82f6';
            default: return '#64748b';
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'pending': return '#94a3b8';
            case 'assigned': return '#3b82f6';
            case 'in_progress': return '#f59e0b';
            case 'completed': return '#10b981';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    }
}
