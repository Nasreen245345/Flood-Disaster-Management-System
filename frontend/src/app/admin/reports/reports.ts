import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class ReportsComponent {
  // Mock data for charts
  // Mock data for charts
  requestsPerDisaster = [
    { name: 'Karachi Urban Floods', value: 45 },
    { name: 'Murree Landslide', value: 32 },
    { name: 'Makran Cyclone Alert', value: 28 },
    { name: 'Raja Bazaar Fire', value: 12 }
  ];

  regionsCoveredPerNGO = [
    { name: 'Edhi Foundation', value: 15 },
    { name: 'Al-Khidmat', value: 12 },
    { name: 'NDMA', value: 20 },
    { name: 'Chhipa Welfare', value: 8 }
  ];

  aidDelivered = {
    delivered: 68,
    pending: 32
  };

  getBarWidth(value: number, max: number): number {
    return (value / max) * 100;
  }

  getMaxValue(data: any[]): number {
    return Math.max(...data.map(d => d.value));
  }
}
