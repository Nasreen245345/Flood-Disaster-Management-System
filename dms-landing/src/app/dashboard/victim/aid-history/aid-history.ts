import { Component, inject, OnInit, NgZone } from '@angular/core';
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
    private ngZone = inject(NgZone);

    history: AidHistory[] = [];
    loading = true;
    displayedColumns = ['date', 'type', 'ngo', 'point', 'quantity'];

    ngOnInit() {
        this.victimService.history$.subscribe(h => {
            this.ngZone.run(() => {
                this.history = h;
                this.loading = false;
            });
        });
        // Reload to ensure latest data
        this.victimService.loadMyRequests();
    }
}
