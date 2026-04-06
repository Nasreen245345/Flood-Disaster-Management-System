import { Routes } from '@angular/router';

import { HeroComponent } from './components/hero/hero'; // Or landing page wrapper if we had one, but currently components are directly in App
// Ideally we should have a 'LandingComponent' wrapper. For now, we routed root to nothing (shows app.html content which has everything).
// But App.html has HARDCODED components. This blocks routing.
// We need to REFACTOR App.html to be a layout or move landing content to a LandingComponent.

// PLAN:
// 1. Create LandingComponent.
// 2. Move App.html content (except router-outlet) to LandingComponent.
// 3. Update App.html to only have RouterOutlet.
// 4. Update Routes.

export const routes: Routes = [
    { path: '', loadComponent: () => import('./pages/landing/landing').then(m => m.LandingComponent) },
    { path: 'auth/login', loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent) },
    { path: 'auth/signup', loadComponent: () => import('./auth/signup/signup').then(m => m.SignupComponent) },

    {
        path: 'dashboard',
        loadComponent: () => import('./dashboard/layout/layout').then(m => m.LayoutComponent),
        children: [
            { path: '', redirectTo: 'overview', pathMatch: 'full' },
            { path: 'overview', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },

            // Admin Routes
            { path: 'admin/overview', loadComponent: () => import('./admin/overview/overview').then(m => m.OverviewComponent) },
            { path: 'admin/users', loadComponent: () => import('./admin/users/users').then(m => m.UsersComponent) },
            { path: 'admin/organizations', loadComponent: () => import('./admin/organizations/organizations').then(m => m.OrganizationsComponent) },
            { path: 'admin/disasters', loadComponent: () => import('./admin/disasters/disasters').then(m => m.DisastersComponent) },
            { path: 'admin/region-assignments', loadComponent: () => import('./admin/region-assignments/region-assignments').then(m => m.RegionAssignmentsComponent) },
            { path: 'admin/assignment-monitoring', loadComponent: () => import('./admin/assignment-monitoring/assignment-monitoring').then(m => m.AssignmentMonitoringComponent) },
            { path: 'admin/reports', loadComponent: () => import('./admin/reports/reports').then(m => m.ReportsComponent) },
            { path: 'admin/activity-log', loadComponent: () => import('./admin/activity-log/activity-log').then(m => m.ActivityLogComponent) },

            // Other role routes (placeholders)
            { path: 'system', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'users', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'analytics', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'resources', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'volunteers', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'response', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'assignments', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'tasks', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'training', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'availability', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'requests', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'status', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'aid', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'notifications', loadComponent: () => import('./dashboard/notifications/notifications').then(m => m.NotificationsComponent) },
            { path: 'map', loadComponent: () => import('./shared/components/interactive-map/interactive-map').then(m => m.InteractiveMapComponent) },
            { path: 'profile', loadComponent: () => import('./dashboard/profile/profile').then(m => m.ProfileComponent) },

            // NGO Routes
            {
                path: 'ngo', children: [
                    { path: 'overview', loadComponent: () => import('./dashboard/ngo/overview/overview').then(m => m.NgoOverviewComponent) },
                    { path: 'assigned-regions', loadComponent: () => import('./dashboard/ngo/assigned-regions/assigned-regions').then(m => m.AssignedRegionsComponent) },
                    { path: 'inventory', loadComponent: () => import('./dashboard/ngo/inventory/inventory').then(m => m.InventoryComponent) },
                    { path: 'aid-requests', loadComponent: () => import('./dashboard/ngo/aid-requests/aid-requests').then(m => m.AidRequestsComponent) },
                    { path: 'tasks', loadComponent: () => import('./dashboard/ngo/tasks/tasks').then(m => m.NgoTasksComponent) },
                    { path: 'distribution-shifts', loadComponent: () => import('./dashboard/ngo/distribution-shifts/distribution-shifts').then(m => m.DistributionShiftsComponent) },
                    { path: 'scan-distribute', loadComponent: () => import('./dashboard/ngo/scan-distribute/scan-distribute').then(m => m.ScanDistributeComponent) },
                    { path: 'volunteers', loadComponent: () => import('./dashboard/ngo/volunteers/volunteers').then(m => m.VolunteersComponent) },
                    { path: 'logs', loadComponent: () => import('./dashboard/ngo/distribution-logs/distribution-logs').then(m => m.DistributionLogsComponent) },
                ]
            },

            // Victim Routes
            {
                path: 'victim', children: [
                    { path: '', redirectTo: 'overview', pathMatch: 'full' },
                    { path: 'overview', loadComponent: () => import('./dashboard/victim/overview/overview').then(m => m.VictimOverviewComponent) },
                    { path: 'requests', loadComponent: () => import('./dashboard/victim/my-requests/my-requests').then(m => m.MyRequestsComponent) },
                    { path: 'history', loadComponent: () => import('./dashboard/victim/aid-history/aid-history').then(m => m.AidHistoryComponent) },
                    { path: 'points', loadComponent: () => import('./dashboard/victim/distribution-points/distribution-points').then(m => m.DistributionPointsComponent) },
                ]
            },

            // Volunteer Routes
            {
                path: 'volunteer', children: [
                    { path: '', redirectTo: 'home', pathMatch: 'full' },
                    { path: 'home', loadComponent: () => import('./dashboard/volunteer/home/volunteer-home').then(m => m.VolunteerHomeComponent) },
                    { path: 'register', loadComponent: () => import('./dashboard/volunteer/register/volunteer-register').then(m => m.VolunteerRegisterComponent) },
                    { path: 'tasks', loadComponent: () => import('./dashboard/volunteer/my-tasks/my-tasks').then(m => m.MyTasksComponent) },
                    { path: 'distribution', loadComponent: () => import('./dashboard/volunteer/distribution/distribution').then(m => m.VolunteerDistributionComponent) },
                    { path: 'region', loadComponent: () => import('./dashboard/volunteer/region/assigned-region').then(m => m.AssignedRegionComponent) },
                    { path: 'history', loadComponent: () => import('./dashboard/volunteer/activity-log/activity-log').then(m => m.ActivityLogComponent) },
                    { path: 'availability', loadComponent: () => import('./dashboard/volunteer/availability/availability').then(m => m.AvailabilityComponent) },
                ]
            },
        ]
    },
    { path: '**', redirectTo: '' }
];
