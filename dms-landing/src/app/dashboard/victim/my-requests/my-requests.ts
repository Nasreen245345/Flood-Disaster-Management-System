import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioButton, MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VictimService } from '../services/victim.service';
import { HelpRequestDialogComponent } from '../../../shared/components/help-request-dialog/help-request-dialog';

@Component({
    selector: 'app-my-requests',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatTabsModule,
        MatCardModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatStepperModule,
        MatProgressBarModule,
        MatSnackBarModule,
        MatDividerModule,
        MatRadioModule,
        MatDialogModule
    ],
    templateUrl: './my-requests.html',
    styleUrls: ['./my-requests.css']
})
export class MyRequestsComponent {
    private fb = inject(FormBuilder);
    private victimService = inject(VictimService);
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);

    requests$ = this.victimService.requests$;

    openRequestDialog() {
        const dialogRef = this.dialog.open(HelpRequestDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            panelClass: 'glass-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.victimService.submitRequest(result).subscribe({
                    next: () => {
                        this.snackBar.open('Request Submitted Successfully!', 'Close', { duration: 3000 });
                    },
                    error: (err) => {
                        console.error('Submission Error:', err);
                        this.snackBar.open('Failed to submit request. Please try again.', 'Close', { duration: 3000 });
                    }
                });
            }
        });
    }

    getStatusStep(status: string): number {
        switch (status) {
            case 'Pending': return 0;
            case 'Approved': return 1;
            case 'Ready': return 2;
            case 'Fulfilled': return 3;
            default: return 0;
        }
    }
}
