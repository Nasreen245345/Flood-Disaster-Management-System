import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GeocodingService {
    private http = inject(HttpClient);
    private cache = new Map<string, string>();

    // Convert "lat, lng" string to place name using Nominatim
    reverseGeocode(locationStr: string): Observable<string> {
        // If it doesn't look like coordinates, return as-is
        if (!this.isCoordinates(locationStr)) {
            return of(locationStr);
        }

        const parts = locationStr.split(',').map(p => p.trim());
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

        // Return cached result
        if (this.cache.has(key)) {
            return of(this.cache.get(key)!);
        }

        return this.http.get<any>(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`,
            { headers: { 'Accept-Language': 'en' } }
        ).pipe(
            map(res => {
                const addr = res.address;
                // Build a readable name: city/town/village + state/province
                const place = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
                const state = addr.state || addr.province || '';
                const name = place && state ? `${place}, ${state}` : place || state || res.display_name?.split(',')[0] || locationStr;
                this.cache.set(key, name);
                return name;
            }),
            catchError(() => of(locationStr))
        );
    }

    isCoordinates(str: string): boolean {
        if (!str) return false;
        const parts = str.split(',');
        if (parts.length !== 2) return false;
        const lat = parseFloat(parts[0].trim());
        const lng = parseFloat(parts[1].trim());
        return !isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
    }
}
