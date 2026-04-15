import { Component, inject, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NgoService } from '../services/ngo.service';

interface DayForecast {
    day: number;
    label: string;
    predictions: {
        food_packages: number;
        medical_packages: number;
        shelter_packages: number;
        clothing_packages: number;
        water_packages: number;
    };
    total: number;
}

@Component({
    selector: 'app-resource-forecast',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule,
              MatChipsModule, MatButtonModule, MatTooltipModule],
    templateUrl: './resource-forecast.html',
    styleUrls: ['./resource-forecast.css']
})
export class ResourceForecastComponent implements OnInit {
    private http = inject(HttpClient);
    private ngoService = inject(NgoService);
    private ngZone = inject(NgZone);

    private apiUrl = 'http://localhost:5000/api';

    loading = true;
    error = false;
    forecast: DayForecast[] = [];
    context: any = null;
    organizationId = '';

    categories = [
        { key: 'food_packages',    label: 'Food',    icon: 'restaurant',    color: '#f59e0b' },
        { key: 'medical_packages', label: 'Medical', icon: 'medical_services', color: '#ef4444' },
        { key: 'shelter_packages', label: 'Shelter', icon: 'home',          color: '#3b82f6' },
        { key: 'clothing_packages',label: 'Clothing',icon: 'checkroom',     color: '#8b5cf6' },
        { key: 'water_packages',   label: 'Water',   icon: 'water_drop',    color: '#06b6d4' },
    ];

    private getHeaders(): HttpHeaders {
        return new HttpHeaders().set('Authorization', `Bearer ${localStorage.getItem('dms_token')}`);
    }

    ngOnInit() {
        this.ngoService.getMyOrganization().subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    if (res.success) {
                        this.organizationId = res.data._id;
                        this.loadForecast();
                    } else {
                        this.loading = false;
                        this.error = true;
                    }
                });
            },
            error: () => { this.ngZone.run(() => { this.loading = false; this.error = true; }); }
        });
    }

    loadForecast() {
        this.loading = true;
        this.error = false;
        this.http.get<any>(`${this.apiUrl}/predictions/${this.organizationId}`, { headers: this.getHeaders() }).subscribe({
            next: (res) => {
                this.ngZone.run(() => {
                    if (res.success) {
                        this.forecast = res.data.forecast;
                        this.context = res.data.context;
                    } else {
                        this.error = true;
                    }
                    this.loading = false;
                });
            },
            error: () => { this.ngZone.run(() => { this.loading = false; this.error = true; }); }
        });
    }

    getBarWidth(value: number, dayIndex: number): number {
        if (!this.forecast[dayIndex]) return 0;
        const max = Math.max(...Object.values(this.forecast[dayIndex].predictions));
        return max > 0 ? (value / max) * 100 : 0;
    }

    getCategoryValue(day: DayForecast, key: string): number {
        return (day.predictions as any)[key] || 0;
    }

    getSeverityColor(severity: string): string {
        return ({ low: 'primary', medium: 'accent', high: 'warn', critical: 'warn' } as any)[severity] || 'primary';
    }

    getCategoryIcon(category: string): string {
        return ({
            food: 'restaurant', medical: 'medical_services',
            shelter: 'home', clothing: 'checkroom', water: 'water_drop'
        } as any)[category] || 'category';
    }

    getCategoryColor(category: string): string {
        return ({
            food: '#f59e0b', medical: '#ef4444',
            shelter: '#3b82f6', clothing: '#8b5cf6', water: '#06b6d4'
        } as any)[category] || '#6b7280';
    }
}
