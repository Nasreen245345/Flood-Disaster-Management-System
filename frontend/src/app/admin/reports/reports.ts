import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { GeocodingService } from '../../shared/services/geocoding.service';

import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private geo = inject(GeocodingService);
  private apiUrl = environment.apiUrl;
  
  loading = true;
  requestsPerDisaster: { name: string; value: number }[] = [];
  regionsCoveredPerNGO: { name: string; value: number }[] = [];
  aidDelivered = { delivered: 0, pending: 0, total: 0 };

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
  }

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.loading = true;
    const headers = this.getHeaders();

    // Load aid requests for delivered vs pending
    this.http.get<any>(`${this.apiUrl}/aid-requests`, { headers }).subscribe({
      next: (res) => {
        if (res.success) {
          const all = res.data;
          const fulfilled = all.filter((r: any) => r.status === 'fulfilled').length;
          const pending = all.filter((r: any) => ['pending', 'approved', 'in_progress'].includes(r.status)).length;
          const total = all.length;
          this.aidDelivered = {
            delivered: total > 0 ? Math.round((fulfilled / total) * 100) : 0,
            pending: total > 0 ? Math.round((pending / total) * 100) : 0,
            total
          };

          // Requests per location — reverse geocode coordinates
          const rawMap = new Map<string, number>();
          all.forEach((r: any) => {
              const loc = r.location?.trim() || 'Unknown';
              rawMap.set(loc, (rawMap.get(loc) || 0) + 1);
          });

          // Resolve place names for coordinate-based locations
          const entries = Array.from(rawMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
          const resolved: { name: string; value: number }[] = [];
          let remaining = entries.length;

          if (remaining === 0) {
              this.requestsPerDisaster = [];
              this.loading = false;
              this.cdr.detectChanges();
              return;
          }

          entries.forEach(([loc, count]) => {
              this.geo.reverseGeocode(loc).subscribe(name => {
                  resolved.push({ name, value: count });
                  remaining--;
                  if (remaining === 0) {
                      this.requestsPerDisaster = resolved.sort((a, b) => b.value - a.value);
                      this.loading = false;
                      this.cdr.detectChanges();
                  }
              });
          });
        }
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });

    // Regions covered per NGO
    this.http.get<any>(`${this.apiUrl}/region-assignments`, { headers }).subscribe({
      next: (res) => {
        if (res.success) {
          const ngoMap = new Map<string, number>();
          res.data.forEach((a: any) => {
            a.assignedNGOs?.forEach((ngo: any) => {
              const name = ngo.name || 'Unknown';
              ngoMap.set(name, (ngoMap.get(name) || 0) + 1);
            });
          });
          this.regionsCoveredPerNGO = Array.from(ngoMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);
          this.cdr.detectChanges();
        }
      },
      error: () => {}
    });
  }

  getBarWidth(value: number, max: number): number {
    return max > 0 ? (value / max) * 100 : 0;
  }

  getMaxValue(data: any[]): number {
    return data.length > 0 ? Math.max(...data.map(d => d.value)) : 1;
  }
}
