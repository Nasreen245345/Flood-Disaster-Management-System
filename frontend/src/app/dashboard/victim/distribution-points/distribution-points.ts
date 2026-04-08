import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { VictimService } from '../services/victim.service';

@Component({
    selector: 'app-distribution-points',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
    templateUrl: './distribution-points.html',
    styleUrls: ['./distribution-points.css']
})
export class DistributionPointsComponent {
    victimService = inject(VictimService);
    private router = inject(Router);
    points$ = this.victimService.points$;

    getDirections(point: any) {
        // Mock coordinates if not in point object, or use real ones if available. 
        // Assuming point has location string, we'll mock coords for demo or parse if possible.
        // For now, let's use a fixed mock coord or random near Colombo for demo.
        const lat = 6.9271;
        const lng = 79.8612;
        this.router.navigate(['/dashboard/map'], { queryParams: { lat, lng } });
    }
}
