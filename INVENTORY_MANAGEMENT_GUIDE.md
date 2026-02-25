# 📦 Package-Based Inventory Management

## Overview

The NGO inventory management system now uses a package-based model for tracking aid resources. This aligns with the aid request system where victims request packages instead of individual items.

---

## 🎯 Key Features

### 1. Package-Based System
- Store packages instead of individual items
- Each package has: name, category, quantity, description
- Categories: Food, Medical, Shelter, Clothing

### 2. Real-Time Sync
- Connects to backend API
- Auto-saves changes to database
- Updates capacity calculations automatically

### 3. Inventory Operations
- Add new packages
- Edit existing packages
- Update quantities (+10/-10)
- Delete packages
- View package details

### 4. Summary Dashboard
- Total packages count
- Number of package types
- Low stock alerts (< 20 packages)

---

## 📊 Data Structure

### Package Model
```typescript
{
  packageName: string;      // "Food Package - Family Size"
  category: string;          // "food" | "medical" | "shelter" | "clothing"
  quantity: number;          // 100
  description?: string;      // "Rice, flour, oil, lentils, salt, sugar"
  lastUpdated?: Date;        // 2026-02-24T06:30:00.000Z
}
```

### Example Packages
```javascript
[
  {
    packageName: "Food Package - Family Size",
    category: "food",
    quantity: 100,
    description: "Rice, flour, oil, lentils, salt, sugar",
    lastUpdated: new Date()
  },
  {
    packageName: "Medical Kit - Basic",
    category: "medical",
    quantity: 50,
    description: "First aid supplies, bandages, antiseptic, pain relievers",
    lastUpdated: new Date()
  },
  {
    packageName: "Shelter Kit - Emergency",
    category: "shelter",
    quantity: 30,
    description: "Tent, blankets, sleeping mats, tarpaulin",
    lastUpdated: new Date()
  },
  {
    packageName: "Clothing Package - Winter",
    category: "clothing",
    quantity: 75,
    description: "Warm clothes for family of 4-5 people",
    lastUpdated: new Date()
  }
]
```

---

## 🎨 User Interface

### Main Inventory Page

```
┌─────────────────────────────────────────────────────┐
│  Package Inventory Management                       │
│  Manage your aid packages for distribution          │
│                                          [+ Add Package]
├─────────────────────────────────────────────────────┤
│                                                     │
│  Package Name          Category  Qty  Description  │
│  ─────────────────────────────────────────────────  │
│  🟢 Food Package       Food      100  Rice, flour  │
│     - Family Size                     oil, lentils │
│                                    [+10][-10][✏️][🗑️]│
│                                                     │
│  🔴 Medical Kit        Medical    50   First aid   │
│     - Basic                            supplies    │
│                                    [+10][-10][✏️][🗑️]│
│                                                     │
│  🟠 Shelter Kit        Shelter    30   Tent,       │
│     - Emergency                        blankets    │
│                                    [+10][-10][✏️][🗑️]│
│                                                     │
└─────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📦 Total     │ │ 📋 Package   │ │ ⚠️  Low      │
│    Packages  │ │    Types     │ │    Stock     │
│    180       │ │    3         │ │    1         │
└──────────────┘ └──────────────┘ └──────────────┘
```

### Add/Edit Package Dialog

```
┌─────────────────────────────────────────┐
│  Add New Package                    [X] │
├─────────────────────────────────────────┤
│                                         │
│  📦 Package Name                        │
│  ┌───────────────────────────────────┐ │
│  │ Food Package - Family Size        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📂 Category                            │
│  ┌───────────────────────────────────┐ │
│  │ 🍽️  Food Package              ▼  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  🔢 Quantity (Number of Packages)      │
│  ┌───────────────────────────────────┐ │
│  │ 100                               │ │
│  └───────────────────────────────────┘ │
│  Number of packages available           │
│                                         │
│  📝 Description (Optional)              │
│  ┌───────────────────────────────────┐ │
│  │ Rice, flour, oil, lentils,        │ │
│  │ salt, sugar                       │ │
│  └───────────────────────────────────┘ │
│  What's included in this package        │
│                                         │
│              [Cancel] [Add Package]     │
└─────────────────────────────────────────┘
```

---

## 🔄 User Workflows

### Workflow 1: Add New Package

```
1. NGO logs in
   ↓
2. Navigate to Inventory page
   ↓
3. Click "Add Package" button
   ↓
4. Fill form:
   - Package Name: "Food Package - Family Size"
   - Category: Food
   - Quantity: 100
   - Description: "Rice, flour, oil, lentils"
   ↓
5. Click "Add Package"
   ↓
6. Package saved to database
   ↓
7. Capacity automatically recalculated
   ↓
8. Success message shown
```

### Workflow 2: Update Quantity

```
1. View inventory table
   ↓
2. Find package to update
   ↓
3. Click "+10" to add 10 packages
   OR
   Click "-10" to remove 10 packages
   ↓
4. Quantity updated in database
   ↓
5. Capacity recalculated
   ↓
6. Success message shown
```

### Workflow 3: Edit Package

```
1. View inventory table
   ↓
2. Click edit icon (✏️) on package
   ↓
3. Dialog opens with current values
   ↓
4. Modify fields as needed
   ↓
5. Click "Update Package"
   ↓
6. Changes saved to database
   ↓
7. Success message shown
```

### Workflow 4: Delete Package

```
1. View inventory table
   ↓
2. Click delete icon (🗑️) on package
   ↓
3. Confirmation dialog appears
   ↓
4. Confirm deletion
   ↓
5. Package removed from database
   ↓
6. Capacity recalculated
   ↓
7. Success message shown
```

---

## 🔧 Technical Implementation

### Frontend Component

**File:** `inventory.ts`

```typescript
export class InventoryComponent implements OnInit {
  inventory: PackageItem[] = [];
  ngoId: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.loadInventory();
  }

  loadInventory() {
    this.ngoService.getMyOrganization().subscribe({
      next: (response) => {
        this.ngoId = response.data._id;
        this.inventory = response.data.inventory || [];
      }
    });
  }

  saveInventory() {
    this.ngoService.updateInventory(this.ngoId, { 
      inventory: this.inventory 
    }).subscribe({
      next: () => {
        this.snackBar.open('Inventory updated', 'Close');
      }
    });
  }
}
```

### Backend API

**Endpoint:** `PUT /api/organizations/:id/inventory`

```javascript
// Update inventory
exports.updateInventory = async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update inventory
    organization.inventory = req.body.inventory;
    await organization.save();

    res.status(200).json({
      success: true,
      data: organization
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

## 📊 Capacity Integration

### How Inventory Affects Capacity

```javascript
// Resource Capacity = Sum of all package quantities
resourceCapacity = inventory.reduce((total, item) => {
  return total + item.quantity;
}, 0);

// Example:
inventory = [
  { packageName: "Food Package", quantity: 100 },
  { packageName: "Medical Kit", quantity: 50 },
  { packageName: "Shelter Kit", quantity: 30 }
];

resourceCapacity = 100 + 50 + 30 = 180 packages
```

### Effective Capacity Calculation

```javascript
// Effective Capacity = MIN(human, resource, operational)
effectiveCapacity = Math.min(
  humanCapacity,      // 200 (from volunteers)
  resourceCapacity,   // 180 (from inventory)
  operationalLimit    // 250 (NGO declared)
);

// Result: 180 (limited by resources)
```

---

## 🎯 Category-Specific Features

### Category Colors

```css
Food:     #16a34a (Green)
Medical:  #dc2626 (Red)
Shelter:  #ea580c (Orange)
Clothing: #2563eb (Blue)
```

### Category Icons

```
Food:     🍽️  restaurant
Medical:  🏥 medical_services
Shelter:  🏠 home
Clothing: 👔 checkroom
```

### Category Badges

```html
<span class="category-badge" style="background: #16a34a">
  FOOD
</span>
```

---

## ⚠️ Low Stock Alerts

### Detection

```typescript
getLowStockCount(): number {
  return this.inventory.filter(item => item.quantity < 20).length;
}
```

### Visual Indicators

```html
<!-- Low stock badge -->
<span class="quantity-badge low-stock">
  15 packages
</span>

<!-- CSS -->
.low-stock {
  background: #fee2e2;
  color: #dc2626;
}
```

### Summary Card

```
┌──────────────┐
│ ⚠️  Low      │
│    Stock     │
│    2         │ ← Number of items with quantity < 20
└──────────────┘
```

---

## 🧪 Testing

### Test Scenario 1: Add Package

1. Login as NGO
2. Navigate to Inventory
3. Click "Add Package"
4. Fill form:
   - Name: "Food Package - Test"
   - Category: Food
   - Quantity: 50
   - Description: "Test package"
5. Submit
6. Verify package appears in table
7. Check database for new package

**Expected:**
```javascript
{
  packageName: "Food Package - Test",
  category: "food",
  quantity: 50,
  description: "Test package",
  lastUpdated: Date
}
```

### Test Scenario 2: Update Quantity

1. Find package in table
2. Click "+10" button 3 times
3. Verify quantity increased by 30
4. Click "-10" button once
5. Verify quantity decreased by 10
6. Check database for updated quantity

**Expected:**
- Initial: 50
- After +30: 80
- After -10: 70

### Test Scenario 3: Edit Package

1. Click edit icon on package
2. Change name to "Food Package - Updated"
3. Change quantity to 100
4. Update description
5. Submit
6. Verify changes in table
7. Check database

**Expected:**
```javascript
{
  packageName: "Food Package - Updated",
  quantity: 100,
  description: "Updated description",
  lastUpdated: Date (new)
}
```

### Test Scenario 4: Delete Package

1. Click delete icon
2. Confirm deletion
3. Verify package removed from table
4. Check database
5. Verify capacity recalculated

**Expected:**
- Package removed from inventory array
- Total packages count decreased
- Resource capacity updated

---

## 🎓 For FYP Defense

### Examiner Questions & Answers

**Q: Why use package-based inventory?**
**A:** "Package-based inventory aligns with how aid is actually distributed. Instead of tracking individual items like '10 kg rice, 5 kg flour', we track complete packages like 'Food Package' which contains all items a family needs. This simplifies distribution and ensures consistent aid."

**Q: How does inventory affect capacity?**
**A:** "Resource capacity is calculated as the sum of all package quantities. This is one of three factors in effective capacity calculation. If we have 180 packages but only 150 volunteers, our effective capacity is limited to 150."

**Q: What happens when inventory runs low?**
**A:** "The system shows low stock alerts for items below 20 packages. The summary dashboard displays the count of low stock items. NGOs can quickly identify which packages need restocking."

**Q: Can NGOs customize package contents?**
**A:** "Yes, each package has a description field where NGOs can specify what's included. For example, 'Food Package' might contain 'Rice, flour, oil, lentils, salt, sugar'. This allows flexibility while maintaining standardization."

---

## ✨ Summary

The package-based inventory management system provides:

✅ Standardized package tracking
✅ Real-time database sync
✅ Capacity integration
✅ Low stock alerts
✅ Easy quantity management
✅ Category-based organization
✅ Summary dashboard
✅ Edit/delete capabilities

**Status:** ✅ Complete and ready for testing!

---

## 🚀 Quick Start

1. Login as NGO user
2. Navigate to Inventory page
3. Click "Add Package"
4. Fill package details
5. Submit and verify in table
6. Test quantity updates
7. Check capacity widget updates

**URL:** http://localhost:4200/dashboard/ngo/inventory
