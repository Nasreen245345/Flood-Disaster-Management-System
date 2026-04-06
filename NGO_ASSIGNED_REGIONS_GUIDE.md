# NGO Assigned Regions - Complete Guide

## 📋 Overview

This document explains how region assignments work from creation to NGO viewing and management.

---

## 🔄 Complete Flow

### 1. Admin Creates Assignment

**Location**: Admin Dashboard → Region Assignments

**Process**:
1. Admin selects an active disaster
2. Admin selects a specific region from that disaster
3. System calculates resource requirements automatically
4. Admin selects one or more NGOs to assign
5. System creates assignment in database

**Database Storage**:
```javascript
RegionAssignment {
  _id: "699d5e924507d84b0ffb6ccb",
  disaster: ObjectId("699d5a47cc0c7ceb069916bb"),
  disasterName: "Karachi Flood",
  region: "Karachi",
  assignedNGOs: [ObjectId("69956ee5fc279ce9b2ab9e92")],
  resourceRequirements: {
    food: 10000,
    medical: 2000,
    shelter: 500
  },
  resourceCoverage: 85,
  affectedPopulation: 8333,
  status: "assigned",
  assignedBy: ObjectId("admin_id"),
  createdAt: "2026-02-24T08:00:00.000Z"
}
```

---

### 2. NGO Views Assignments

**Location**: NGO Dashboard → Assigned Regions

**API Call**:
```
GET /api/region-assignments/ngo/:ngoId
```

**What NGO Sees**:
- List of all regions assigned to their organization
- Disaster information (type, severity, location)
- Affected population count
- Resource requirements (food, medical, shelter)
- Resource coverage percentage
- Ass