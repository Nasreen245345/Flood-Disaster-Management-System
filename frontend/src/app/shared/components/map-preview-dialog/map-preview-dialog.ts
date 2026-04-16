import { Component, Inject, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

export interface MapPreviewData {
    lat: number;
    lng: number;
    label?: string;
    title?: string;
}

@Component({
    selector: 'app-map-preview-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px 0;">
            <h2 mat-dialog-title style="margin:0;font-size:18px;font-weight:600;">
                <mat-icon style="vertical-align:middle;margin-right:6px;color:#3b82f6;">location_on</mat-icon>
                {{ data.title || 'Location' }}
            </h2>
            <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
        </div>
        <mat-dialog-content style="padding:12px 20px 0;margin:0;">
            <p *ngIf="data.label" style="margin:0 0 10px;color:#6b7280;font-size:14px;">
                📍 {{ data.label }}
            </p>
            <div id="map-preview" style="width:100%;height:380px;border-radius:10px;overflow:hidden;"></div>
        </mat-dialog-content>
        <mat-dialog-actions align="end" style="padding:12px 20px;">
            <button mat-button (click)="close()">Close</button>
        </mat-dialog-actions>
    `
})
export class MapPreviewDialogComponent implements AfterViewInit, OnDestroy {
    private map!: L.Map;

    constructor(
        private dialogRef: MatDialogRef<MapPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: MapPreviewData
    ) {}

    ngAfterViewInit() {
        // Small delay to ensure the dialog DOM is rendered
        setTimeout(() => this.initMap(), 100);
    }

    private initMap() {
        this.map = L.map('map-preview', {
            center: [this.data.lat, this.data.lng],
            zoom: 13,
            zoomControl: true
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#ef4444;width:32px;height:32px;
                border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);
                display:flex;align-items:center;justify-content:center;">
                <span style="transform:rotate(45deg);font-size:14px;">📍</span>
            </div>`,
            iconSize: [32, 36],
            iconAnchor: [16, 36]
        });

        L.marker([this.data.lat, this.data.lng], { icon })
            .bindPopup(`<strong>${this.data.label || 'Location'}</strong>`, { closeButton: false })
            .addTo(this.map)
            .openPopup();

        // Fix Leaflet tile rendering inside dialog
        setTimeout(() => this.map.invalidateSize(), 200);
    }

    ngOnDestroy() {
        if (this.map) this.map.remove();
    }

    close() { this.dialogRef.close(); }
}
