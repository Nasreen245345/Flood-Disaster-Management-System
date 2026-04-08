import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReportDisasterDialogComponent } from '../../shared/components/report-disaster-dialog/report-disaster-dialog';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink, MatDialogModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {
  readonly dialog = inject(MatDialog);

  openReportDialog() {
    this.dialog.open(ReportDisasterDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });
  }
}



