import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
@Component({
    selector: 'app-assign-region-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule,
              MatIconModule, MatProgressSpinnerModule, MatSnackBarModule, MatChipsModule],
    template: `
        <h2 mat-dialog-title>Assign Disaster Region</h2>
        <mat-dialog-content>
            <p style="color:#64748b;margin-bottom:16px;">
                Select an active disaster to assign <strong>{{ data.volunteerName }}</strong> to:
            </p>

            <div *ngIf="loading" style="display:flex;align-items:center;gap:10px;padding:20px;">
                <mat-spinner diameter="24"></mat-spinner><span>Loading disasters...</span>
            </div>

            <mat-list *ngIf="!loading">
                <mat-list-item *ngFor="let d of disasters"
                               class="disaster-item"
                               [class.selected]="selected?._id === d._id"
                               (click)="selected = d">
                    <div matListItemIcon>
                        <mat-icon [style.color]="getColor(d.disasterType)">warning</mat-icon>
                    </div>
                    <div matListItemTitle>{{ d.disasterType | titlecase }} — {{ d.location }}</div>
                    <div matListItemLine>
                        <mat-chip>{{ d.severity }}</mat-chip>
                        &nbsp;{{ d.peopleAffected | number }} affected
                    </div>
                </mat-list-item>
                <div *ngIf="disasters.length === 0" style="padding:20px;color:#94a3b8;text-align:center;">
                    No active disasters found
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

    disasters: any[] = [];
    selected: any = null;
    loading = true;
    saving = false;

    private apiUrl = environment.apiUrl;

    constructor(@Inject(MAT_DIALOG_DATA) public data: { volunteerId: string; volunteerName: string }) {}

    ngOnInit() {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
        this.http.get<any>(`${this.apiUrl}/disasters?status=active`, { headers }).subscribe({
            next: (res) => {
                if (res.success) this.disasters = res.data.filter((d: any) => d.status === 'active' || d.status === 'verified');
                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    assign() {
        if (!this.selected) return;
        this.saving = true;
        const headers = new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
        this.http.put<any>(`${this.apiUrl}/volunteers/${this.data.volunteerId}/assign-region`,
            { disasterId: this.selected._id, regionName: this.selected.location },
            { headers }
        ).subscribe({
            next: (res) => {
                if (res.success) {
                    this.snackBar.open('Region assigned successfully', 'Close', { duration: 2000 });
                    this.dialogRef.close(true);
                }
                this.saving = false;
            },
            error: () => {
                this.snackBar.open('Error assigning region', 'Close', { duration: 3000 });
                this.saving = false;
            }
        });
    }

    getColor(type: string): string {
        return ({ flood:'#3b82f6', fire:'#ef4444', earthquake:'#f97316', landslide:'#92400e', cyclone:'#a855f7' } as any)[type] || '#6b7280';
    }

    close() { this.dialogRef.close(); }
}
