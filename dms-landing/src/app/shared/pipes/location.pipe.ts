import { Pipe, PipeTransform, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { GeocodingService } from '../services/geocoding.service';

@Pipe({ name: 'locationName', standalone: true, pure: true })
export class LocationNamePipe implements PipeTransform {
    private geo = inject(GeocodingService);

    transform(location: string): Observable<string> {
        if (!location) return of('Unknown');
        return this.geo.reverseGeocode(location);
    }
}
