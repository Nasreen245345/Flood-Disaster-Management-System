import { Component, inject, Inject, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';

@Component({
    selector: 'app-assign-region-dialog',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, AsyncPipe, MatDialogModule, MatButtonModule, MatListModule,
              MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule, LocationNamePipe],
    template: `
        <h2 mat-dialog-title>Assign Disaster Region</h2>
        <mat-dialog-content>
            <p style="color:#64748b;margin-bottom:16px;">
                Select an active disaster to assign <strong>{{ data.volunteerName }}</strong> to:
            </p>

            <div *ngIf="loading" style="display:flex;align-items:center;gap:10px;padding:20px;">
                <mat-spinner diameter="24"></mat-spinner><span>Loading disasters...</span>
            </div>

            <div *ngIf="!loading && errorMsg" style="padding:16px;color:#ef4444;background:#fef2f2;border-radius:8px;">
                {{ errorMsg }}
            </div>

            <mat-list *ngIf="!loading && !errorMsg">
                <mat-list-item *ngFor="let d of disasters"
                               class="disaster-item"
                               [class.selected]="selected?._id === d._id"
                               (click)="selected = d; cdr.markForCheck()">
                    <div matListItemIcon>
                        <mat-icon [style.color]="getColor(d.disasterType)">warning</mat-icon>
                    </div>
                    <div matListItemTitle>{{ d.disasterType | titlecase }} — {{ d.location | locationName | async }}</div>
                    <div matListItemLine>
                        <mat-chip>{{ d.severity }}</mat-chip>
                        &nbsp;{{ d.peopleAffected | number }} affected
                    </div>
                </mat-list-item>
                <div *ngIf="disasters.length === 0" style="padding:20px;color:#94a3b8;text-align:center;">
                    No active disasters assigned to your organization
                </div>
            </mat-list>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="close()">Cancel</button>
            <button mat-raised-button color="primary" [disabled]="!selected || saving" (click)="assign()">
                {{ saving ? 'Assigning...' : 'Assign Region' }}
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        .disaster-item { cursor:pointer; border-radius:8px; margin-bottom:4px; }
        .disaster-item:hover { background:#f1f5f9; }
        .disaster-item.selected { background:#dbeafe; border:2px solid #3b82f6; }
        mat-dialog-content { min-width:480px; max-height:400px; }
    `]
})
export class AssignRegionDialogComponent implements OnInit {
    private http = inject(HttpClient);
    private snackBar = inject(MatSnackBar);
    private dialogRef = inject(MatDialogRef<AssignRegionDialogComponent>);
    cdr = inject(ChangeDetectorRef);

    disasters: any[] = [];
    selected: any = null;
    loading = true;
    saving = false;
    errorMsg = '';

    private apiUrl = 'http://localhost:5000/api';

    constructor(@Inject(MAT_DIALOG_DATA) public data: { volunteerId: string; volunteerName: string; ngoId?: string }) {}

    ngOnInit() {
        const token = localStorage.getItem('dms_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
        const orgId = this.data.ngoId || this.getOrgIdFromToken();

        if (orgId) {
            this.http.get<any>(`${this.apiUrl}/region-assignments/ngo/${orgId}`, { headers })
                .pipe(timeout(10000), catchError(() => of({ success: false, data: [] })))
                .subscribe(res => {
                    if (res.success && res.data?.length > 0) {
                        const seen = new Set<string>();
                        this.disasters = res.data
                            .filter((a: any) => a.disaster && ['active', 'verified', 'reported'].includes(a.disaster.status))
                            .map((a: any) => a.disaster)
                            .filter((d: any) => d && !seen.has(d._id) && !!seen.add(d._id));
                    }
                    if (this.disasters.length === 0) {
                        this.loadAllDisasters(headers);
                    } else {
                        this.loading = false;
                        this.cdr.markForCheck();
                    }
                });
        } else {
            this.loadAllDisasters(headers);
        }
    }

    loadAllDisasters(headers: HttpHeaders) {
        this.http.get<any>(`${this.apiUrl}/disasters`, { headers })
            .pipe(timeout(10000), catchError(() => of({ success: false, data: [] })))
            .subscribe(res => {
                if (res.success) {
                    this.disasters = (res.data || []).filter((d: any) =>
                        ['active', 'verified', 'reported'].includes(d.status)
                    );
                } else {
                    this.errorMsg = 'Failed to load disasters. Please try again.';
                }
                this.loading = false;
                this.cdr.markForCheck();
            });
    }

    private getOrgIdFromToken(): string | null {
        try {
            const user = localStorage.getItem('dms_user');
            if (user) {
                const parsed = JSON.parse(user);
                return parsed.organizationId || parsed.organization || null;
            }
        } catch { /* ignore */ }
        return null;
    }

    assign() {
        if (!this.selected) return;
        this.saving = true;
        this.cdr.markForCheck();
        const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
        this.http.put<any>(
            `${this.apiUrl}/volunteers/${this.data.volunteerId}/assign-region`,
            { disasterId: this.selected._id, regionName: this.selected.location },
            { headers }
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    this.snackBar.open('Region assigned successfully', 'Close', { duration: 2000 });
                    this.dialogRef.close(true);
                }
                this.saving = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.snackBar.open('Error assigning region', 'Close', { duration: 3000 });
                this.saving = false;
                this.cdr.markForCheck();
            }
        });
    }

    getColor(type: string): string {
        return ({ flood: '#3b82f6', fire: '#ef4444', earthquake: '#f97316', landslide: '#92400e', cyclone: '#a855f7' } as any)[type] || '#6b7280';
    }

    close() { this.dialogRef.close(); }
}
