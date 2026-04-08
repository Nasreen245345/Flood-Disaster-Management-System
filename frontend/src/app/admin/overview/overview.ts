import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminDataService } from '../services/admin-data.service';
import { SystemStats } from '../models/admin.models';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  iconColor: string;
  growth: number;
  route: string;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css']
})
export class OverviewComponent implements OnInit {
  private adminService = inject(AdminDataService);
  private router = inject(Router);

  stats: SystemStats | null = null;
  statCards: StatCard[] = [];
  loading = true;

  ngOnInit() {
    this.loadSystemStats();
  }

  private loadSystemStats() {
    this.adminService.getSystemStats().subscribe(stats => {
      this.stats = stats;
      this.buildStatCards(stats);
      this.loading = false;
    });
  }

  private buildStatCards(stats: SystemStats) {
    this.statCards = [
      {
        title: 'Total Users',
        value: stats.totalUsers,
        icon: 'people',
        iconColor: 'text-blue-600',
        growth: stats.userGrowth,
        route: '/dashboard/admin/users'
      },
      {
        title: 'Total NGOs',
        value: stats.totalNGOs,
        icon: 'business',
        iconColor: 'text-cyan-600',
        growth: stats.ngoGrowth,
        route: '/dashboard/admin/organizations'
      },
      {
        title: 'Total Volunteers',
        value: stats.totalVolunteers,
        icon: 'volunteer_activism',
        iconColor: 'text-yellow-600',
        growth: stats.volunteerGrowth,
        route: '/dashboard/admin/users'
      },
      {
        title: 'Active Disasters',
        value: stats.activeDisasters,
        icon: 'warning',
        iconColor: 'text-red-600',
        growth: stats.disasterGrowth,
        route: '/dashboard/admin/disasters'
      },
      {
        title: 'Affected Regions',
        value: stats.affectedRegions,
        icon: 'location_on',
        iconColor: 'text-orange-600',
        growth: 0,
        route: '/dashboard/admin/disasters'
      },
      {
        title: 'Pending Assignments',
        value: stats.pendingAssignments,
        icon: 'assignment',
        iconColor: 'text-purple-600',
        growth: 0,
        route: '/dashboard/admin/region-assignments'
      }
    ];
  }

  navigateToDetail(route: string) {
    this.router.navigate([route]);
  }

  getGrowthIcon(growth: number): string {
    if (growth > 0) return 'trending_up';
    if (growth < 0) return 'trending_down';
    return 'trending_flat';
  }

  getGrowthColor(growth: number): string {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  }
}
