import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { NgoService } from '../services/ngo.service';

@Component({
    selector: 'app-distribution-logs',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
    templateUrl: './distribution-logs.html',
    styleUrls: ['./distribution-logs.css']
})
export class DistributionLogsComponent {
    ngoService = inject(NgoService);
    logs$ = this.ngoService.logs$;
    displayedColumns = ['id', 'time', 'victim', 'region', 'items', 'volunteer'];
}
