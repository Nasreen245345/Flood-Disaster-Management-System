import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './features.html',
  styleUrls: ['./features.css']
})
export class FeaturesComponent {
  features = [
    {
      title: 'Real-time Flood Mapping',
      desc: 'Officers can tag and visualize flood-affected areas using interactive maps with polygon drawing tools. Citizens can view active zones in real-time.',
      icon: 'map' // or location_on
    },
    {
      title: 'Help Request System',
      desc: 'Citizens can quickly submit help requests specifying their location and needed resources (food, water, medical supplies, shelter, etc.).',
      icon: 'warning'
    },
    {
      title: 'NGO Assignment',
      desc: 'Officers can view pending requests grouped by area and assign them to available NGOs based on capacity, type, and availability.',
      icon: 'group'
    },
    {
      title: 'Digital ID Verification',
      desc: 'NGOs and volunteers can quickly verify recipient IDs to ensure aid reaches the right people securely and efficiently.',
      icon: 'verified_user'
    },
    {
      title: 'Role-Based Access Control',
      desc: 'Three distinct user roles (Citizens, NGOs, Officers) with specific permissions and dashboards tailored to their responsibilities.',
      icon: 'security'
    },
    {
      title: 'Analytics & Reports',
      desc: 'Comprehensive reporting tools for officers including activity logs, NGO performance tracking, and resource estimation modules.',
      icon: 'analytics'
    }
  ];
}



