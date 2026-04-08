import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { VolunteerService } from '../services/volunteer.service';
import * as L from 'leaflet';

@Component({
    selector: 'app-assigned-region',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule],
    templateUrl: './assigned-region.html',
    styleUrls: ['./assigned-region.css']
})
export class AssignedRegionComponent implements OnInit, OnDestroy {
    volunteerService = inject(VolunteerService);
    private router = inject(Router);
    private map: L.Map | undefined;

    region = this.volunteerService.getAssignedRegion();

    ngOnInit() {
        // Initialize map after view init
        setTimeout(() => {
            this.initMap();
        }, 100);
    }

    ngOnDestroy() {
        if (this.map) {
            this.map.remove();
        }
    }

    private initMap() {
        const { lat, lng } = this.region.coordinates;

        // Create map
        this.map = L.map('region-map', {
            center: [lat, lng],
            zoom: 13,
            zoomControl: false,
            dragging: false, // Static-ish map
            scrollWheelZoom: false,
            doubleClickZoom: false
        });

        // Add tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add marker
        const icon = L.divIcon({
            className: 'custom-pin',
            html: `<div style="background-color: #ef4444; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [16, 16]
        });

        L.marker([lat, lng], { icon }).addTo(this.map)
            .bindPopup(this.region.name)
            .openPopup();
    }

    getDirections() {
        const { lat, lng } = this.region.coordinates;
        this.router.navigate(['/dashboard/map'], { queryParams: { lat, lng } });
    }
}
