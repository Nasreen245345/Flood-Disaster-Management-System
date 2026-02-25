import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { NgoService } from '../services/ngo.service';

@Component({
  selector: 'app-capacity-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule, MatDividerModule],
  templateUrl: './capacity-widget.html',
  styleUrls: ['./capacity-widget.css']
})
export class CapacityWidgetComponent implements OnInit {
  private ngoService = inject(NgoService);

  capacity: any = null;
  loading = true;

  ngOnInit() {
    this.loadCapacity();
  }

  private loadCapacity() {
    this.ngoService.getMyOrganization().subscribe({
      next: (response) => {
        if (response.success) {
          const ngoId = response.data._id;
          this.ngoService.getCapacity(ngoId).subscribe({
            next: (capResponse) => {
              if (capResponse.success) {
                this.capacity = capResponse.data;
              }
              this.loading = false;
            },
            error: (err) => {
              console.error('Error loading capacity:', err);
              this.loading = false;
            }
          });
        }
      },
      error: (err) => {
        console.error('Error loading organization:', err);
        this.loading = false;
      }
    });
  }

  getLimitingFactorLabel(factor: string): string {
    const labels: Record<string, string> = {
      'volunteers': 'Volunteers (Need more volunteers)',
      'resources': 'Resources (Need more inventory)',
      'operational_limit': 'Operational Limit (Increase capacity)'
    };
    return labels[factor] || factor;
  }

  getLimitingFactorIcon(factor: string): string {
    const icons: Record<string, string> = {
      'volunteers': 'group',
      'resources': 'inventory_2',
      'operational_limit': 'settings'
    };
    return icons[factor] || 'info';
  }

  getWorkloadColor(workload: number): string {
    if (workload < 50) return 'primary';
    if (workload < 80) return 'accent';
    return 'warn';
  }

  getWorkloadStatus(workload: number): string {
    if (workload < 50) return 'Low';
    if (workload < 80) return 'Moderate';
    return 'High';
  }
}
