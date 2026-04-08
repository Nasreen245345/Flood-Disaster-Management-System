import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { VolunteerService } from '../services/volunteer.service';
import { map } from 'rxjs';

@Component({
    selector: 'app-activity-log',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatListModule, MatIconModule, MatProgressBarModule],
    templateUrl: './activity-log.html',
    styleUrls: ['./activity-log.css']
})
export class ActivityLogComponent {
    volunteerService = inject(VolunteerService);

    stats$ = this.volunteerService.stats$;
    completedTasks$ = this.volunteerService.tasks$.pipe(
        map(tasks => tasks.filter(t => t.status === 'completed'))
    );
}
