// User Model
export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'ngo' | 'volunteer' | 'victim';
    status: 'active' | 'inactive' | 'blocked';
    joinedDate: Date;
    lastActive: Date;
    phone?: string;
    region?: string;
}

// Organization Model
export interface Organization {
    id: string;
    name: string;
    type: 'ngo' | 'government';
    contact: {
        email: string;
        phone: string;
        address: string;
    };
    capacity: {
        volunteers: number;
        resources: {
            food: number;
            medical: number;
            shelter: number;
        };
    };
    status: 'pending' | 'approved' | 'disabled';
    registeredDate: Date;
    currentWorkload: number; // 0-100 percentage
}

// Disaster Model
export interface Disaster {
    id: string;
    type: 'flood' | 'fire' | 'earthquake' | 'landslide' | 'cyclone' | 'accident';
    name: string;
    affectedRegions: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'closed'; // Frontend simplified status
    reportedDate: Date;
    affectedPopulation: number;
    description: string;
}

// Region Assignment Model
export interface RegionAssignment {
    id: string;
    disasterId: string;
    disasterName: string;
    region: string;
    assignedNGOs: string[]; // NGO IDs
    ngoNames?: string[]; // NGO Names (optional for backward compatibility)
    resourceRequirements: {
        food: number;
        medical: number;
        shelter: number;
    };
    resourceCoverage: number; // 0-100 percentage
    affectedPopulation: number;
    status: 'assigned' | 'in-progress' | 'completed';
    assignedDate: Date;
    assignedBy: string; // Admin ID
}

// Activity Log Model
export interface ActivityLog {
    id: string;
    timestamp: Date;
    action: 'ngo_approval' | 'ngo_rejection' | 'region_assignment' | 'user_status_change' | 'organization_status_change';
    performedBy: string; // Admin name
    details: string;
    entityId: string;
    entityType: 'user' | 'organization' | 'disaster' | 'assignment';
}

// System Stats Model
export interface SystemStats {
    totalUsers: number;
    totalNGOs: number;
    totalVolunteers: number;
    activeDisasters: number;
    affectedRegions: number;
    pendingAssignments: number;
    userGrowth: number; // percentage
    ngoGrowth: number;
    volunteerGrowth: number;
    disasterGrowth: number;
}
