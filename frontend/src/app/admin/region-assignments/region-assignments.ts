import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../services/admin-data.service';
import { Disaster, Organization, RegionAssignment } from '../models/admin.models';

@Component({
  selector: 'app-region-assignments',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
    MatCheckboxModule,
    FormsModule
  ],
  templateUrl: './region-assignments.html',
  styleUrls: ['./region-assignments.css']
})
export class RegionAssignmentsComponent implements OnInit {
  private adminService = inject(AdminDataService);

  // Step 1: Select Disaster
  activeDisasters: Disaster[] = [];
  selectedDisaster: Disaster | null = null;

  // Step 2: Select Region
  selectedRegion: string = '';

  // Step 3: View Requirements & NGOs
  eligibleNGOs: Organization[] = [];
  selectedNGOs: string[] = [];

  // Assignment data
  resourceRequirements = {
    food: 0,
    medical: 0,
    shelter: 0
  };
  affectedPopulation = 0;

  loading = true;
  assigning = false;

  ngOnInit() {
    this.loadActiveDisasters();
  }

  private loadActiveDisasters() {
    this.adminService.getActiveDisasters().subscribe(disasters => {
      this.activeDisasters = disasters;
      this.loading = false;
    });
  }

  onDisasterSelected() {
    if (this.selectedDisaster) {
      // Reset selections
      this.selectedRegion = '';
      this.selectedNGOs = [];
      this.eligibleNGOs = [];
    }
  }

  onRegionSelected() {
    if (this.selectedDisaster && this.selectedRegion) {
      // Calculate resource requirements based on disaster severity and population
      this.calculateResourceRequirements();

      // Load eligible NGOs
      this.loadEligibleNGOs();
    }
  }

  private calculateResourceRequirements() {
    if (!this.selectedDisaster) return;

    // Estimate affected population for this region (simplified)
    const totalPopulation = this.selectedDisaster.affectedPopulation;
    const regionCount = this.selectedDisaster.affectedRegions.length;
    this.affectedPopulation = Math.floor(totalPopulation / regionCount);

    // Calculate requirements based on severity and population
    const baseMultiplier = this.affectedPopulation / 100;
    const severityMultipliers = {
      low: 0.5,
      medium: 1,
      high: 1.5,
      critical: 2
    };
    const multiplier = baseMultiplier * severityMultipliers[this.selectedDisaster.severity];

    this.resourceRequirements = {
      food: Math.floor(multiplier * 50),
      medical: Math.floor(multiplier * 10),
      shelter: Math.floor(multiplier * 5)
    };
  }

  private loadEligibleNGOs() {
    if (!this.selectedDisaster || !this.selectedRegion) return;

    this.adminService.getEligibleNGOsForRegion(this.selectedDisaster.id, this.selectedRegion)
      .subscribe(ngos => {
        this.eligibleNGOs = ngos;
      });
  }

  toggleNGOSelection(ngoId: string) {
    const index = this.selectedNGOs.indexOf(ngoId);
    if (index > -1) {
      this.selectedNGOs.splice(index, 1);
    } else {
      this.selectedNGOs.push(ngoId);
    }
  }

  isNGOSelected(ngoId: string): boolean {
    return this.selectedNGOs.includes(ngoId);
  }

  getCapacityMatch(ngo: Organization): number {
    const totalRequired = this.resourceRequirements.food +
      this.resourceRequirements.medical +
      this.resourceRequirements.shelter;

    const totalAvailable = ngo.capacity.resources.food +
      ngo.capacity.resources.medical +
      ngo.capacity.resources.shelter;

    return Math.min(100, Math.floor((totalAvailable / totalRequired) * 100));
  }

  getCapacityColor(match: number): string {
    if (match >= 80) return '#10b981'; // green
    if (match >= 60) return '#eab308'; // yellow
    if (match >= 40) return '#f59e0b'; // amber
    return '#ef4444'; // red
  }

  getTotalSelectedCapacity(): number {
    let total = 0;
    this.selectedNGOs.forEach(ngoId => {
      const ngo = this.eligibleNGOs.find(n => n.id === ngoId);
      if (ngo) {
        total += this.getCapacityMatch(ngo);
      }
    });
    return Math.min(100, total);
  }

  canAssign(): boolean {
    return this.selectedNGOs.length > 0 &&
      this.selectedDisaster !== null &&
      this.selectedRegion !== '';
  }

  assignRegion() {
    if (!this.canAssign() || !this.selectedDisaster) return;

    this.assigning = true;

    const assignment: Omit<RegionAssignment, 'id' | 'assignedDate' | 'assignedBy'> = {
      disasterId: this.selectedDisaster.id,
      disasterName: this.selectedDisaster.name,
      region: this.selectedRegion,
      assignedNGOs: this.selectedNGOs,
      resourceRequirements: this.resourceRequirements,
      resourceCoverage: this.getTotalSelectedCapacity(),
      affectedPopulation: this.affectedPopulation,
      status: 'assigned'
    };

    this.adminService.createAssignment(assignment).subscribe({
      next: (result) => {
        console.log('✅ Assignment created:', result);
        alert(`Successfully assigned ${this.selectedRegion} to ${this.selectedNGOs.length} NGO(s)!`);
        this.resetForm();
        this.assigning = false;
      },
      error: (err) => {
        console.error('❌ Assignment error:', err);
        alert('Failed to create assignment: ' + (err.error?.message || err.message));
        this.assigning = false;
      }
    });
  }

  private resetForm() {
    this.selectedDisaster = null;
    this.selectedRegion = '';
    this.selectedNGOs = [];
    this.eligibleNGOs = [];
    this.resourceRequirements = { food: 0, medical: 0, shelter: 0 };
    this.affectedPopulation = 0;
  }
}
