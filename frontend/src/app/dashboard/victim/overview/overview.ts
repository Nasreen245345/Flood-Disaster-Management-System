import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { VictimService } from '../services/victim.service';
import { map } from 'rxjs';

@Component({
    selector: 'app-victim-overview',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, RouterLink],
    templateUrl: './overview.html',
    styleUrls: ['./overview.css']
})
export class VictimOverviewComponent {
    victimService = inject(VictimService);
    private router = inject(Router);

    profile$ = this.victimService.profile$;
    requests$ = this.victimService.requests$;

    activeRequestsCount$ = this.requests$.pipe(
        map(reqs => reqs.filter(r => r.status !== 'Fulfilled').length)
    );

    fulfilledRequestsCount$ = this.requests$.pipe(
        map(reqs => reqs.filter(r => r.status === 'Fulfilled').length)
    );

    requestHelp() {
        this.router.navigate(['/dashboard/victim/requests']);
    }
}
