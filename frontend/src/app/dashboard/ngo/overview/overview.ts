import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink, Router } from '@angular/router';
import { NgoService } from '../services/ngo.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-ngo-overview',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatIconModule,
        MatTableModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        RouterLink
    ],
    templateUrl: './overview.html',
    styleUrls: ['./overview.css']
})
export class NgoOverviewComponent implements OnInit {
    ngoService = inject(NgoService);
    router = inject(Router);
    http = inject(HttpClient);

    // Stats
    assignedRegionsCount = 0;
    inventoryCount = 0;
    pendingRequestsCount = 0;
    activeVolunteers = 0;

    // Recent logs
    recentLogs: any[] = [];
    displayedColumns = ['time', 'region', 'items', 'volunteer'];

    loading = true;
    ngoId: string | null = null;

    private apiUrl = 'http://localhost:5000/api';

    quickActions = [
        { icon: 'assignment_ind', label: 'Assign Volunteer', desc: 'Assign a volunteer to a disaster region', route: '/dashboard/ngo/volunteers', color: '#3b82f6', bg: '#eff6ff' },
        { icon: 'add_task', label: 'Create Task', desc: 'Create a new operational task', route: '/dashboard/ngo/tasks', color: '#8b5cf6', bg: '#f5f3ff' },
        { icon: 'schedule', label: 'New Shift', desc: 'Schedule a distribution shift', route: '/dashboard/ngo/shifts', color: '#10b981', bg: '#f0fdf4' },
        { icon: 'inventory_2', label: 'Manage Inventory', desc: 'Update resource stock levels', route: '/dashboard/ngo/inventory', color: '#f59e0b', bg: '#fffbeb' },
        { icon: 'medical_services', label: 'Aid Requests', desc: 'Review pending aid requests', route: '/dashboard/ngo/aid-requests', color: '#ef4444', bg: '#fef2f2' },
        { icon: 'map', label: 'View Map', desc: 'See live disaster map', route: '/dashboard/map', color: '#06b6d4', bg: '#ecfeff' },
    ];

    ngOnInit() {
        this.ngoService.getMyOrganization().subscribe({
            next: (res) => {
                if (res.success && res.data) {
                    this.ngoId = res.data._id;
                    this.loadDashboardData(res.data);
                } else {
                    this.loading = false;
                }
            },
            error: () => { this.loading = false; }
        });
    }

    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('dms_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    private loadDashboardData(orgData: any) {
        const id = this.ngoId!;

        forkJoin({
            regions: this.ngoService.getAssignedRegions(id).pipe(catchError(() => of({ data: [] }))),
            volunteers: this.ngoService.getVolunteers(id).pipe(catchError(() => of({ data: [] }))),
            aidRequests: this.ngoService.getAidRequests(id).pipe(catchError(() => of({ data: [] }))),
            logs: this.http.get<any>(`${this.apiUrl}/distribution/logs/${id}`, { headers: this.getHeaders() })
                .pipe(catchError(() => of({ success: false, data: [] })))
        }).subscribe({
            next: ({ regions, volunteers, aidRequests, logs }) => {
                this.assignedRegionsCount = regions.data?.length || 0;

                // Inventory total from org data
                const inv = orgData.inventory || [];
                this.inventoryCount = inv.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

                // Pending = approved aid requests
                this.pendingRequestsCount = (aidRequests.data || [])
                    .filter((r: any) => r.status === 'approved' || r.status === 'Approved').length;

                // Active volunteers
                this.activeVolunteers = (volunteers.data || [])
                    .filter((v: any) => v.status === 'active' || v.availability !== 'Offline').length;

                // Recent distribution logs
                const rawLogs = logs.data || logs.logs || [];
                this.recentLogs = rawLogs.slice(0, 5).map((log: any) => ({
                    timestamp: log.createdAt || log.timestamp,
                    region: log.region || log.location || '—',
                    items: Array.isArray(log.items) ? log.items.join(', ') : (log.packageType || '—'),
                    distributedBy: log.volunteer?.fullName || log.distributedBy || '—'
                }));

                this.loading = false;
            },
            error: () => { this.loading = false; }
        });
    }

    navigate(route: string) {
        this.router.navigate([route]);
    }
}
