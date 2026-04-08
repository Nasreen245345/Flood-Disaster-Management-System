import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { NgoService } from '../services/ngo.service';
import { CapacityWidgetComponent } from '../capacity-widget/capacity-widget';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-ngo-overview',
    standalone: true,
    imports: [
        CommonModule, 
        MatCardModule, 
        MatIconModule, 
        MatTableModule, 
        MatButtonModule, 
        RouterLink,
        CapacityWidgetComponent
    ],
    templateUrl: './overview.html',
    styleUrls: ['./overview.css']
})
export class NgoOverviewComponent {
    ngoService = inject(NgoService);

    // Stats
    assignedRegionsCount$ = this.ngoService.regions$.pipe(map(regions => regions.length));
    inventoryCount$ = this.ngoService.inventory$.pipe(map(items => items.reduce((acc, i) => acc + i.quantity, 0)));
    pendingRequestsCount$ = this.ngoService.aidRequests$.pipe(map(reqs => reqs.filter(r => r.status === 'Approved').length));
    activeVolunteers$ = this.ngoService.volunteers$.pipe(map(vols => vols.filter(v => v.availability !== 'Offline').length));

    // Recent Activity (Mock for now, or derived from logs)
    recentLogs$ = this.ngoService.logs$.pipe(map(logs => logs.slice(0, 5))); // Last 5 logs
    displayedColumns = ['time', 'region', 'items', 'volunteer'];
}
