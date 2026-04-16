import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-unavailable-date-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        FormsModule
    ],
    templateUrl: './add-unavailable-date-dialog.html',
    styles: [`
    .mat-mdc-form-field { width: 100%; }
  `]
})
export class AddUnavailableDateDialogComponent {
    data = {
        date: new Date(),
        reason: ''
    };

    constructor(
        public dialogRef: MatDialogRef<AddUnavailableDateDialogComponent>
    ) { }

    onNoClick(): void {
        this.dialogRef.close();
    }

    save(): void {
        if (this.data.date && this.data.reason) {
            this.dialogRef.close(this.data);
        }
    }
}
