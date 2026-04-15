import { Component, inject, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as L from 'leaflet';
import { LocationNamePipe } from '../../../shared/pipes/location.pipe';

@Component({
    selector: 'app-assigned-region',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule,
              MatDividerModule, MatProgressSpinnerModule, MatChipsModule, MatSnackBarModule, LocationNamePipe],
    templateUrl: './assigned-region.html',
    styleUrls: ['./assigned-region.css']
})
export class AssignedRegionComponent implements OnInit, OnDestroy {
    private http = inject(HttpClient);
    private router = inject(Router);
    private ngZone = inject(NgZone);
    private snackBar = inject(MatSnackBar);
    private map: L.Map | undefined;

    private apiUrl = 'http://localhost:5000/api';
    loading = true;
    assignedRegion: string | null = null;
    disaster: any = null;

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    ngOnInit() {
        this.http.get<any>(`${this.apiUrl}/volunteers/my-region`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    if (res.success) {
                        this.assignedRegion = res.data.assignedRegion;
                        this.disaster = res.data.assignedDisaster;
                    }
                    this.loading = false;
                    if (this.disaster?.coordinates?.latitude) {
                        setTimeout(() => this.initMap(), 200);
                    }
                });
            },
            error: () => { this.ngZone.run(() => { this.loading = false; }); }
        });
    }

    ngOnDestroy() {
        if (this.map) this.map.remove();
    }

    private initMap() {
        const lat = this.disaster.coordinates.latitude;
        const lng = this.disaster.coordinates.longitude;

        this.map = L.map('region-map', { center: [lat, lng], zoom: 12, zoomControl: true });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        const color = this.getDisasterColor(this.disaster.disasterType);
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;">
                <span style="transform:rotate(45deg);font-size:16px;">${this.getDisasterEmoji(this.disaster.disasterType)}</span>
            </div>`,
            iconSize: [36, 40], iconAnchor: [18, 40]
        });

        L.marker([lat, lng], { icon })
            .bindPopup(`<strong>${this.disaster.disasterType?.toUpperCase()}</strong><br>${this.disaster.location}`)
            .addTo(this.map)
            .openPopup();

        // Radius circle
        L.circle([lat, lng], { radius: 3000, color, fillColor: color, fillOpacity: 0.1, weight: 2 }).addTo(this.map);
    }

    openFullMap() {
        if (this.disaster?.coordinates) {
            this.router.navigate(['/dashboard/map'], {
                queryParams: {
                    lat: this.disaster.coordinates.latitude,
                    lng: this.disaster.coordinates.longitude
                }
            });
        }
    }

    getDisasterColor(type: string): string {
        return ({ flood:'#3b82f6', fire:'#ef4444', earthquake:'#f97316', landslide:'#92400e', cyclone:'#a855f7', accident:'#eab308' } as Record<string,string>)[type] || '#6b7280';
    }

    getDisasterEmoji(type: string): string {
        return ({ flood:'🌊', fire:'🔥', earthquake:'🏚', landslide:'⛰', cyclone:'🌪', accident:'🚑' } as Record<string,string>)[type] || '⚠️';
    }

    getSeverityColor(s: string): string {
        return ({ low:'primary', medium:'accent', high:'warn', critical:'warn' } as Record<string,string>)[s] || 'primary';
    }
}
