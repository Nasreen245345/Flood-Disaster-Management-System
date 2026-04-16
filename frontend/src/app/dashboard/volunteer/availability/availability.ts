import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { VolunteerService } from '../services/volunteer.service';
import { AddUnavailableDateDialogComponent } from './add-unavailable-date-dialog/add-unavailable-date-dialog';

@Component({
    selector: 'app-availability',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatSlideToggleModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule
    ],
    templateUrl: './availability.html',
    styleUrls: ['./availability.css']
})
export class AvailabilityComponent {
    volunteerService = inject(VolunteerService);
    readonly dialog = inject(MatDialog);

    isCheckedIn$ = this.volunteerService.isCheckedIn$;

    // Mock unavailable dates
    unavailableDates = [
        { date: new Date('2024-05-20'), reason: 'Personal Leave' },
        { date: new Date('2024-06-15'), reason: 'Exam' }
    ];

    toggleStatus() {
        this.volunteerService.toggleCheckIn();
    }

    openAddDateDialog() {
        const dialogRef = this.dialog.open(AddUnavailableDateDialogComponent, {
            width: '400px'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.unavailableDates = [...this.unavailableDates, result];
            }
        });
    }

    removeDate(index: number) {
        this.unavailableDates.splice(index, 1);
    }
}
