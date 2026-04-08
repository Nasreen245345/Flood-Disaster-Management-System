import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { VictimService } from '../services/victim.service';

@Component({
    selector: 'app-aid-history',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatTableModule, MatIconModule],
    templateUrl: './aid-history.html',
    styleUrls: ['./aid-history.css']
})
export class AidHistoryComponent {
    victimService = inject(VictimService);
    history$ = this.victimService.history$;
    displayedColumns = ['date', 'type', 'ngo', 'point', 'quantity'];
}
