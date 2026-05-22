import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoService } from '../services/ngo.service';

@Component({
    selector: 'app-create-task-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSnackBarModule
    ],
    template: `
        <h2 mat-dialog-title>Create New Task</h2>
        <mat-dialog-content>
            <form [formGroup]="taskForm" class="task-form">
                <mat-form-field appearance="outline">
                    <mat-label>Task Type</mat-label>
                    <mat-select formControlName="taskType" required>
                        <mat-option value="delivery">Delivery</mat-option>
                        <mat-option value="warehouse">Warehouse</mat-option>
                        <mat-option value="field_work">Field Work</mat-option>
                        <mat-option value="other">Other</mat-option>
                    </mat-select>
                    <mat-error *ngIf="taskForm.get('taskType')?.hasError('required')">
                        Task Type is required
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Title</mat-label>
                    <input matInput formControlName="title" required>
                    <mat-error *ngIf="taskForm.get('title')?.hasError('required')">
                        Title is required
                    </mat-error>
                    <mat-error *ngIf="taskForm.get('title')?.hasError('minlength')">
                        Title must be at least 5 characters long
                    </mat-error>
                    <mat-error *ngIf="taskForm.get('title')?.hasError('maxlength')">
                        Title cannot exceed 100 characters
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Description</mat-label>
                    <textarea matInput formControlName="description" rows="3" required></textarea>
                    <mat-error *ngIf="taskForm.get('description')?.hasError('required')">
                        Description is required
                    </mat-error>
                    <mat-error *ngIf="taskForm.get('description')?.hasError('minlength')">
                        Description must be at least 10 characters long
                    </mat-error>
                    <mat-error *ngIf="taskForm.get('description')?.hasError('maxlength')">
                        Description cannot exceed 1000 characters
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Priority</mat-label>
                    <mat-select formControlName="priority" required>
                        <mat-option value="low">Low</mat-option>
                        <mat-option value="medium">Medium</mat-option>
                        <mat-option value="high">High</mat-option>
                        <mat-option value="critical">Critical</mat-option>
                    </mat-select>
                    <mat-error *ngIf="taskForm.get('priority')?.hasError('required')">
                        Priority is required
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Location (Optional)</mat-label>
                    <input matInput formControlName="location">
                    <mat-hint>e.g., "24.8607, 67.0011" or "Sector F-10"</mat-hint>
                    <mat-error *ngIf="taskForm.get('location')?.hasError('maxlength')">
                        Location cannot exceed 200 characters
                    </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                    <mat-label>Due Date (Optional)</mat-label>
                    <input matInput [matDatepicker]="picker" formControlName="dueDate">
                    <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                    <mat-datepicker #picker></mat-datepicker>
                </mat-form-field>
            </form>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
            <button mat-raised-button color="primary" (click)="onCreate()" [disabled]="!taskForm.valid || loading">
                {{ loading ? 'Creating...' : 'Create Task' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .task-form {
            display: flex;
            flex-direction: column;
            gap: 16px;
            min-width: 500px;
        }

        mat-dialog-content {
            padding: 20px 24px;
        }
    `]
})
export class CreateTaskDialogComponent {
    private fb = inject(FormBuilder);
    private ngoService = inject(NgoService);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<CreateTaskDialogComponent>);

    loading = false;
    taskForm: FormGroup;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { organizationId: string }) {
        this.taskForm = this.fb.group({
            taskType: ['delivery', Validators.required],
            title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
            priority: ['medium', Validators.required],
            location: ['', Validators.maxLength(200)],
            dueDate: [null]
        });
    }

    onCreate() {
        if (this.taskForm.invalid) return;

        this.loading = true;
        const taskData = {
            ...this.taskForm.value,
            organization: this.data.organizationId
        };

        this.ngoService.createTask(taskData).subscribe({
            next: () => {
                this.snackBar.open('Task created successfully', 'Close', { duration: 2000 });
                this.dialogRef.close(true);
            },
            error: (error: any) => {
                console.error('Error creating task:', error);
                this.snackBar.open('Error creating task', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    onCancel() {
        this.dialogRef.close();
    }
}
