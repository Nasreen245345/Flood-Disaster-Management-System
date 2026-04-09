import { environment } from '../../../environments/environment';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HelpRequestDialogComponent } from '../../shared/components/help-request-dialog/help-request-dialog';
import { ReportDisasterDialogComponent } from '../../shared/components/report-disaster-dialog/report-disaster-dialog';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, RouterLink, MatDialogModule, MatSnackBarModule],
  // Note: We don't strictly typically need to import content components in directives/pipes arrays 
  // for MatDialog.open, but adding them here ensures they are retained by the optimizer.
  templateUrl: './hero.html',
  styleUrls: ['./hero.css']
})
export class HeroComponent {
  readonly dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private apiUrl = environment.apiUrl + '/aid-requests';

  openHelpDialog() {
    const dialogRef = this.dialog.open(HelpRequestDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      panelClass: 'glass-dialog',
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Check if user is logged in
        const token = localStorage.getItem('dms_token');
        
        if (!token) {
          this.snackBar.open('Please login to submit a request', 'Login', { duration: 5000 })
            .onAction().subscribe(() => {
              this.router.navigate(['/login']);
            });
          return;
        }

        // Submit the request
        this.submitRequest(result, token);
      }
    });
  }

  private submitRequest(formData: any, token: string) {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Transform packages to include packageName and quantity (based on peopleCount)
    const packageMap: Record<string, string> = {
      'food': 'Food Package',
      'medical': 'Medical Kit',
      'shelter': 'Shelter Kit',
      'clothing': 'Clothing Package'
    };

    // Quantity = peopleCount (1 package per person)
    const peopleCount = formData.peopleCount || 1;

    const packagesNeeded = formData.packagesNeeded.map((pkg: any) => ({
      category: pkg.category,
      packageName: packageMap[pkg.category] || pkg.category,
      quantity: peopleCount  // Auto-calculated: 1 package per person
    }));

    const payload: any = {
      victimName: formData.victimName,
      victimCNIC: formData.victimCNIC,
      victimPhone: formData.victimPhone,
      location: formData.location,
      packagesNeeded: packagesNeeded,
      urgency: formData.urgency || 'medium',
      peopleCount: peopleCount,
      additionalNotes: formData.additionalNotes || ''
    };

    // Add coordinates if available
    if (formData.coordinates) {
      payload.coordinates = {
        latitude: formData.coordinates.lat,
        longitude: formData.coordinates.lng
      };
    }

    console.log('Submitting aid request:', payload);

    this.http.post<any>(this.apiUrl, payload, { headers }).subscribe({
      next: (response) => {
        console.log('Aid request response:', response);
        this.snackBar.open('Request Submitted Successfully!', 'Close', { duration: 3000 });
      },
      error: (err) => {
        console.error('Submission Error:', err);
        this.snackBar.open('Failed to submit request. Please try again.', 'Close', { duration: 3000 });
      }
    });
  }
}







