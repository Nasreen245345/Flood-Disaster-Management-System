import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
    private http = inject(HttpClient);
    private cache = new Map<string, string>();
    private apiBase = 'http://localhost:5000/api';

    reverseGeocode(locationStr: string): Observable<string> {
        if (!locationStr) return of('Unknown');

        const trimmed = locationStr.trim();

        // Not coordinate-like → return as-is
        if (!this.isCoordinates(trimmed)) return of(trimmed);

        const coords = this.parseCoords(trimmed);
        if (!coords) return of(trimmed);

        const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`;
        if (this.cache.has(key)) return of(this.cache.get(key)!);

        return this.http.get<any>(
            `${this.apiBase}/map/reverse-geocode?lat=${coords.lat}&lng=${coords.lng}`
        ).pipe(
            map(res => {
                const name = res?.placeName || trimmed;
                this.cache.set(key, name);
                return name;
            }),
            catchError(() => of(trimmed))
        );
    }

    isCoordinates(str: string): boolean {
        if (!str) return false;
        // Starts with an optional sign and digits with decimal point
        return /^-?\d+\.\d+/.test(str.trim());
    }

    private parseCoords(str: string): { lat: number; lng: number } | null {
        // Match two decimal numbers: "32.681445, 71.791590" or "32.681445, 71.791590 Fire"
        const two = str.match(/(-?\d+\.\d+)[,\s]+(-?\d+\.\d+)/);
        if (two) {
            const a = parseFloat(two[1]), b = parseFloat(two[2]);
            if (Math.abs(a) <= 90 && Math.abs(b) <= 180) return { lat: a, lng: b };
            if (Math.abs(b) <= 90 && Math.abs(a) <= 180) return { lat: b, lng: a };
        }
        return null;
    }
}
