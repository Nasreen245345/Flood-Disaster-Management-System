import { Component, Inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Region } from '../services/ngo.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-region-details',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatDividerModule],
    template: `
    <h2 mat-dialog-title>{{ region.name }} Details</h2>
    <mat-dialog-content>
        <div class="details-container">
            <!-- Real Map Area -->
            <div id="dialog-map" class="real-map"></div>

            <div class="info-grid mt-4">
                <div class="info-item">
                    <span class="label">Disaster Type</span>
                    <div class="val">
                        <mat-icon [class]="region.disasterType | lowercase">
                            {{ region.disasterType === 'Flood' ? 'water_drop' : 'warning' }}
                        </mat-icon>
                        {{ region.disasterType }}
                    </div>
                </div>
                <div class="info-item">
                    <span class="label">Population</span>
                    <span class="val">{{ region.population | number }}</span>
                </div>
                <div class="info-item">
                    <span class="label">Status</span>
                    <span class="val status">{{ region.status }}</span>
                </div>
            </div>

            <mat-divider class="my-4"></mat-divider>

            <h3 class="section-title">Approved Aid Requirements</h3>
            <div class="requirements-list">
                <div class="req-item" *ngFor="let req of region.requiredResources.split(',')">
                    <mat-icon>check_circle</mat-icon>
                    <span>{{ req.trim() }}</span>
                </div>
            </div>
        </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Close</button>
        <button mat-flat-button color="primary" mat-dialog-close>Access Region Inventory</button>
    </mat-dialog-actions>
  `,
    styles: [`
    .details-container { padding-bottom: 16px; min-width: 450px; }
    .real-map {
        height: 200px;
        width: 100%;
        border-radius: 8px;
        margin-bottom: 20px;
        border: 1px solid #cbd5e1;
        z-index: 1; /* Ensure map is below dialog actions if needed */
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .mt-4 { margin-top: 16px; }
    .info-item { display: flex; flex-direction: column; gap: 4px; }
    .label { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }
    .val { font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; }
    .val mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .flood { color: #0284c7; }
    .section-title { font-size: 1rem; font-weight: 500; margin: 0 0 12px 0; color: #334155; }
    .requirements-list { display: flex; flex-direction: column; gap: 8px; }
    .req-item { display: flex; align-items: center; gap: 10px; padding: 8px; background: #f8fafc; border-radius: 6px; }
    .req-item mat-icon { color: #16a34a; font-size: 20px; width: 20px; height: 20px; }
    .my-4 { margin: 16px 0; }
  `]
})
export class RegionDetailsDialogComponent implements AfterViewInit {
    private map!: L.Map;

    constructor(@Inject(MAT_DIALOG_DATA) public region: Region) { }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initMap();
        }, 100); // Small delay to ensure dialog animation is done
    }

    private initMap() {
        const coords = this.getCoordinates(this.region.location);

        this.map = L.map('dialog-map').setView(coords, 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        L.circle(coords, {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.5,
            radius: 2000
        }).addTo(this.map);

        L.marker(coords).addTo(this.map)
            .bindPopup(`<b>${this.region.name}</b><br>${this.region.disasterType} Zone`)
            .openPopup();
    }

    private getCoordinates(location: string): [number, number] {
        // Mock Geocoding for Demo Regions
        const locationMap: { [key: string]: [number, number] } = {
            'Nowshera, KPK': [34.0151, 71.9747],
            'Quetta, Balochistan': [30.1798, 66.9750],
            'Dadu, Sindh': [26.7329, 67.7667],
            'Swat, KPK': [35.2227, 72.4258],
            'Islamabad': [33.6844, 73.0479]
        };

        // Check if exact match or contains city name
        for (const key in locationMap) {
            if (location.includes(key.split(',')[0])) {
                return locationMap[key];
            }
        }

        // Default to Islamabad if not found
        return [33.6844, 73.0479];
    }
}
