import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VictimService, AidHistory } from '../services/victim.service';

@Component({
    selector: 'app-aid-history',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule, MatProgressSpinnerModule],
    templateUrl: './aid-history.html',
    styleUrls: ['./aid-history.css']
})
export class AidHistoryComponent implements OnInit {
    private victimService = inject(VictimService);
    private cdr = inject(ChangeDetectorRef);

    history: AidHistory[] = [];
    loading = true;
    displayedColumns = ['date', 'type', 'ngo', 'point', 'quantity'];

    ngOnInit() {
        this.victimService.history$.subscribe(h => {
            this.history = h;
            this.loading = false;
            this.cdr.detectChanges();
        });
        // Reload to ensure latest data
        this.victimService.loadMyRequests();
    }
}
