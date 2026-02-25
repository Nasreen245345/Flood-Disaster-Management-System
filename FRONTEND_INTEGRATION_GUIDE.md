# 🎯 FRONTEND-BACKEND INTEGRATION GUIDE

## ✅ COMPLETED

### 1. Volunteer Registration Form
**Location:** `dms-landing/src/app/dashboard/volunteer/register/`
- ✅ Multi-step form with stepper
- ✅ NGO selection dropdown (fetches from `/api/organizations/approved/list`)
- ✅ Category and skill level selection
- ✅ Auto-calculates service rate
- ✅ Availability and shift type
- ✅ Submits to `/api/volunteers`

**To Use:**
1. Add route in `app.routes.ts`:
```typescript
{
  path: 'dashboard/volunteer/register',
  component: VolunteerRegisterComponent
}
```

2. Add navigation link in volunteer dashboard

---

## 🔄 TODO - CRITICAL INTEGRATIONS

### 2. Update NGO Service
**File:** `dms-landing/src/app/dashboard/ngo/services/ngo.service.ts`

Add these methods:

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';

private apiUrl = 'http://localhost:5000/api';

private getHeaders(): HttpHeaders {
  const token = localStorage.getItem('dms_token');
  return new HttpHeaders().set('Authorization', `Bearer ${token}`);
}

// Get NGO organization
getMyOrganization(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/organizations/me`, { 
    headers: this.getHeaders() 
  });
}

// Get volunteers for NGO
getVolunteers(ngoId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/volunteers/ngo/${ngoId}`, { 
    headers: this.getHeaders() 
  });
}

// Get capacity calculation
getCapacity(ngoId: string): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/volunteers/capacity/${ngoId}`, { 
    headers: this.getHeaders() 
  });
}

// Verify volunteer
verifyVolunteer(volunteerId: string): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/volunteers/${volunteerId}/verify`, {
    verifiedByNGO: true,
    verificationStatus: 'verified'
  }, { headers: this.getHeaders() });
}

// Update inventory
updateInventory(ngoId: string, inventory: any): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/organizations/${ngoId}/inventory`, 
    inventory, 
    { headers: this.getHeaders() }
  );
}

// Update active distributions
updateActiveDistributions(ngoId: string, count: number): Observable<any> {
  return this.http.put<any>(`${this.apiUrl}/organizations/${ngoId}/distributions`, {
    activeDistributions: count
  }, { headers: this.getHeaders() });
}
```

---

### 3. Update NGO Volunteers Component
**File:** `dms-landing/src/app/dashboard/ngo/volunteers/volunteers.ts`

Replace with:

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoService } from '../services/ngo.service';

@Component({
  selector: 'app-volunteers',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatTableModule, MatButtonModule, 
    MatIconModule, MatMenuModule, MatChipsModule, MatSnackBarModule
  ],
  templateUrl: './volunteers.html',
  styleUrls: ['./volunteers.css']
})
export class VolunteersComponent implements OnInit {
  private ngoService = inject(NgoService);
  private snackBar = inject(MatSnackBar);

  volunteers: any[] = [];
  loading = true;
  ngoId: string = '';

  displayedColumns = ['name', 'category', 'skillLevel', 'serviceRate', 'availability', 'verification', 'actions'];

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.ngoService.getMyOrganization().subscribe({
      next: (response) => {
        if (response.success) {
          this.ngoId = response.data._id;
          this.loadVolunteers();
        }
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  private loadVolunteers() {
    this.ngoService.getVolunteers(this.ngoId).subscribe({
      next: (response) => {
        if (response.success) {
          this.volunteers = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  verifyVolunteer(volunteerId: string) {
    this.ngoService.verifyVolunteer(volunteerId).subscribe({
      next: () => {
        this.snackBar.open('Volunteer verified', 'Close', { duration: 3000 });
        this.loadVolunteers();
      },
      error: (err) => {
        this.snackBar.open('Failed to verify', 'Close', { duration: 3000 });
      }
    });
  }
}
```

---

### 4. Create NGO Capacity Dashboard Widget
**File:** `dms-landing/src/app/dashboard/ngo/capacity-widget/capacity-widget.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { NgoService } from '../services/ngo.service';

@Component({
  selector: 'app-capacity-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatProgressBarModule],
  template: `
    <mat-card class="capacity-card">
      <h3>Capacity Overview</h3>
      
      <div *ngIf="capacity" class="capacity-content">
        <div class="capacity-row">
          <span class="label">👥 Human Capacity:</span>
          <span class="value">{{ capacity.overall.humanCapacity }}</span>
          <span class="sub">({{ capacity.overall.volunteers }} volunteers)</span>
        </div>

        <div class="capacity-row">
          <span class="label">📦 Resource Capacity:</span>
          <span class="value">{{ capacity.overall.resourceCapacity }}</span>
        </div>

        <div class="capacity-row">
          <span class="label">⚙️ Operational Limit:</span>
          <span class="value">{{ capacity.overall.operationalCapacity }}</span>
        </div>

        <mat-divider></mat-divider>

        <div class="capacity-row highlight">
          <span class="label">✅ Effective Capacity:</span>
          <span class="value primary">{{ capacity.overall.effectiveCapacity }}</span>
        </div>

        <div class="limiting-factor">
          <mat-icon>warning</mat-icon>
          <span>Limiting Factor: <strong>{{ getLimitingFactorLabel(capacity.overall.limitingFactor) }}</strong></span>
        </div>

        <div class="workload-section">
          <div class="workload-header">
            <span>Current Workload</span>
            <span class="workload-value">{{ capacity.workload }}%</span>
          </div>
          <mat-progress-bar 
            mode="determinate" 
            [value]="capacity.workload"
            [color]="getWorkloadColor(capacity.workload)">
          </mat-progress-bar>
          <div class="workload-info">
            {{ capacity.activeDistributions }} / {{ capacity.overall.effectiveCapacity }} active distributions
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <mat-icon>hourglass_empty</mat-icon>
        <p>Loading capacity...</p>
      </div>
    </mat-card>
  `,
  styles: [`
    .capacity-card {
      padding: 20px;
    }

    h3 {
      margin: 0 0 16px 0;
      font-size: 18px;
      font-weight: 600;
    }

    .capacity-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
    }

    .capacity-row.highlight {
      background: #e3f2fd;
      padding: 16px;
      border-radius: 8px;
      margin: 16px 0;
    }

    .label {
      font-size: 14px;
      color: #666;
    }

    .value {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .value.primary {
      color: #1976d2;
    }

    .sub {
      font-size: 12px;
      color: #999;
      margin-left: 8px;
    }

    .limiting-factor {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fff3e0;
      border-radius: 8px;
      margin: 16px 0;
    }

    .limiting-factor mat-icon {
      color: #ff9800;
    }

    .workload-section {
      margin-top: 24px;
    }

    .workload-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .workload-value {
      font-weight: 600;
      color: #1976d2;
    }

    .workload-info {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    .loading {
      text-align: center;
      padding: 32px;
      color: #666;
    }
  `]
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
            }
          });
        }
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

  getWorkloadColor(workload: number): string {
    if (workload < 50) return 'primary';
    if (workload < 80) return 'accent';
    return 'warn';
  }
}
```

Add to NGO overview page:
```html
<app-capacity-widget></app-capacity-widget>
```

---

### 5. Update Admin Organizations Component
**File:** `dms-landing/src/app/admin/services/admin-data.service.ts`

Already updated! Just ensure the frontend component uses it:

```typescript
// In organizations.ts
ngOnInit() {
  this.adminService.getAllOrganizations().subscribe({
    next: (response) => {
      if (response.success) {
        this.organizations = response.data; // Already includes capacity!
      }
    }
  });
}
```

Update the HTML template to show capacity:

```html
<td mat-cell *matCellDef="let org">
  <div class="capacity-info">
    <div>👥 {{ org.capacity.volunteers }} volunteers</div>
    <div>📦 {{ org.capacity.resourceCapacity }} resources</div>
    <div>✅ {{ org.capacity.effectiveCapacity }} effective</div>
    <div class="limiting">⚠️ {{ org.capacity.limitingFactor }}</div>
  </div>
</td>
```

---

### 6. Update Inventory Management
**File:** `dms-landing/src/app/dashboard/ngo/inventory/inventory.ts`

When adding/updating inventory, call the API:

```typescript
updateInventory() {
  const inventoryData = {
    food: this.foodCount,
    medical: this.medicalCount,
    shelter: this.shelterCount,
    clothing: this.clothingCount,
    other: this.otherCount
  };

  this.ngoService.updateInventory(this.ngoId, inventoryData).subscribe({
    next: () => {
      this.snackBar.open('Inventory updated', 'Close', { duration: 3000 });
      // Refresh capacity display
    }
  });
}
```

---

## 🚀 QUICK START CHECKLIST

1. ✅ Backend is running on port 5000
2. ✅ Frontend is running on port 4200
3. [ ] Add volunteer registration route
4. [ ] Update NGO service with API methods
5. [ ] Update NGO volunteers component
6. [ ] Add capacity widget to NGO dashboard
7. [ ] Update admin organizations to show real capacity
8. [ ] Connect inventory management to API
9. [ ] Test volunteer registration flow
10. [ ] Test capacity calculations

---

## 🧪 TESTING FLOW

### Test 1: Volunteer Registration
1. Login as volunteer user
2. Navigate to volunteer registration
3. Select an NGO
4. Fill form and submit
5. Check MongoDB - volunteer should be created with status='pending'

### Test 2: NGO Verification
1. Login as NGO user
2. Go to volunteers page
3. See pending volunteer
4. Click verify
5. Check MongoDB - verifiedByNGO should be true

### Test 3: Capacity Calculation
1. Login as NGO
2. View capacity widget
3. Should show:
   - Human capacity (sum of verified volunteers' service rates)
   - Resource capacity (sum of inventory)
   - Effective capacity (minimum of both)
   - Workload percentage

### Test 4: Admin View
1. Login as admin
2. Go to organizations page
3. Should see all NGOs with real capacity data
4. Should show limiting factor for each

---

## 📊 API ENDPOINTS SUMMARY

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/organizations/approved/list` | GET | Get NGOs for volunteer registration |
| `/api/volunteers` | POST | Register volunteer |
| `/api/volunteers/me` | GET | Get my volunteer profile |
| `/api/volunteers/ngo/:ngoId` | GET | Get NGO's volunteers |
| `/api/volunteers/capacity/:ngoId` | GET | Get NGO capacity calculation |
| `/api/volunteers/:id/verify` | PUT | Verify volunteer |
| `/api/organizations/me` | GET | Get my NGO organization |
| `/api/organizations` | GET | Get all organizations (admin) |
| `/api/organizations/:id/inventory` | PUT | Update inventory |
| `/api/organizations/:id/distributions` | PUT | Update active distributions |

---

## 🎓 DEFENSE READY!

With this implementation, you can demonstrate:

1. **Realistic Capacity Model** - Based on volunteers × service rate
2. **Multi-Factor Constraints** - Human, resource, operational limits
3. **Real-Time Calculations** - Dynamic capacity updates
4. **Professional Architecture** - Clean separation of concerns
5. **Scalable Design** - Category-specific capacity support

Your system now intelligently calculates NGO capacity based on actual data, not mock numbers!
