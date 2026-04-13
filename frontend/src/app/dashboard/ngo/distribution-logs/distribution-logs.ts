import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgoService } from '../services/ngo.service';

import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-distribution-logs',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatProgressSpinnerModule, MatChipsModule],
    templateUrl: './distribution-logs.html',
    styleUrls: ['./distribution-logs.css']
})
export class DistributionLogsComponent implements OnInit {
    private ngoService = inject(NgoService);
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);

    private apiUrl = environment.apiUrl;
    logs: any[] = [];
    loading = true;
    displayedColumns = ['time', 'victim', 'location', 'packages', 'volunteer'];

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    ngOnInit() {
        this.ngoService.getMyOrganization().subscribe({
            next: (res) => {
                if (res.success) this.loadLogs(res.data._id);
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
    }

    loadLogs(orgId: string) {
        this.http.get<any>(`${this.apiUrl}/distribution/logs/${orgId}`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                if (res.success) this.logs = res.data;
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: () => { this.loading = false; this.cdr.detectChanges(); }
        });
    }
}
