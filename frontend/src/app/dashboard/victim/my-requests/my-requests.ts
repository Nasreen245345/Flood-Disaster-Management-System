import { environment } from '../../../../environments/environment';
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { VictimService, VictimRequest } from '../services/victim.service';
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
        MatDialogModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './my-requests.html',
    styleUrls: ['./my-requests.css']
})
export class MyRequestsComponent implements OnInit {
    private fb = inject(FormBuilder);
    private victimService = inject(VictimService);
    private snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);
    private router = inject(Router);

    requests: VictimRequest[] = [];
    loading = true;

    private apiUrl = environment.apiUrl;

    ngOnInit() {
        this.victimService.requests$.subscribe(reqs => {
            this.requests = reqs;
            this.loading = false;
            this.cdr.detectChanges();
        });
        this.victimService.loadMyRequests();
    }

    openOnMap(shift: any) {
        if (shift.coordinates?.latitude && shift.coordinates?.longitude) {
            // Navigate to full interactive map, centered on this specific distribution point
            this.router.navigate(['/dashboard/map'], {
                queryParams: {
                    lat: shift.coordinates.latitude,
                    lng: shift.coordinates.longitude,
                    zoom: 15,
                    highlight: 'distribution'
                }
            });
        } else {
            // No coordinates — open Google Maps with location name
            const query = encodeURIComponent(shift.location);
            window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        }
    }

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
        const s = status?.toLowerCase();
        switch (s) {
            case 'pending': return 0;
            case 'approved': return 1;
            case 'in_progress': return 2;
            case 'fulfilled': return 3;
            default: return 0;
        }
    }

    getStatusColor(status: string): string {
        switch (status?.toLowerCase()) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#3b82f6';
            case 'in_progress': return '#8b5cf6';
            case 'fulfilled': return '#10b981';
            case 'rejected': return '#ef4444';
            default: return '#6b7280';
        }
    }

    getStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            pending: 'Pending', approved: 'Approved',
            in_progress: 'In Progress', fulfilled: 'Fulfilled', rejected: 'Rejected'
        };
        return labels[status?.toLowerCase()] || status;
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }
}


