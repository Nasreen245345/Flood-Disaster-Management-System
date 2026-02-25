# 🔍 Inventory Update Debugging Steps

## Step 1: Open Browser Console

1. Press **F12** to open Developer Tools
2. Click on the **Console** tab
3. Clear the console (click the 🚫 icon)

## Step 2: Try to Update Quantity

1. Click the **+10** button on any package
2. Watch the console for logs

### Expected Logs:

```
=== UPDATE QUANTITY ===
Item: {packageName: "Food Package - Family Size", category: "food", quantity: 20, ...}
Delta: 10
New Quantity: 30
Updated item: {packageName: "Food Package - Family Size", category: "food", quantity: 30, ...}
=== SAVING INVENTORY ===
NGO ID: 65f...
Clean Inventory: [{packageName: "Food Package - Family Size", ...}, ...]
✅ Inventory saved successfully: {success: true, data: {...}}
=== LOAD INVENTORY ===
Response: {success: true, data: {...}}
Cleaned inventory: [{...}, ...]
```

### If You See Errors:

**Error 1: "❌ No NGO ID available"**
- The NGO ID is not loaded
- Refresh the page and try again

**Error 2: "❌ Invalid item: ..."**
- The inventory item is missing required fields
- Take a screenshot and share

**Error 3: "❌ Error saving inventory: ..."**
- API call failed
- Check the error message
- Go to Network tab to see the request

## Step 3: Check Network Tab

1. Click on the **Network** tab in Developer Tools
2. Clear the network log
3. Click **+10** button again
4. Look for a request to `/api/organizations/.../inventory`

### Check the Request:

**Request URL:** `http://localhost:5000/api/organizations/65f.../inventory`
**Method:** PUT
**Status:** Should be 200 (green)

**Request Payload:**
```json
{
  "inventory": [
    {
      "packageName": "Food Package - Family Size",
      "category": "food",
      "quantity": 30,
      "description": "Rice, flour...",
      "lastUpdated": "2026-02-24T..."
    },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Inventory updated successfully"
}
```

### If Status is Red (400, 403, 500):

**403 Forbidden:**
- Not authorized
- Check if you're logged in as the correct NGO user

**400 Bad Request:**
- Invalid data
- Check the response for error details

**500 Server Error:**
- Backend error
- Check backend terminal for error logs

## Step 4: Check Backend Terminal

Look at the backend terminal for logs:

### Expected Logs:

```
=== UPDATE INVENTORY ===
Organization ID: 65f...
User ID: 696...
User Role: ngo
Request Body: {
  "inventory": [...]
}
Organization Admin User: 696...
✅ Updating inventory with 4 packages
✅ Inventory updated successfully for Akhuwat Foundation
```

### If You See Errors:

**"❌ Organization not found"**
- Invalid organization ID
- Check the NGO ID in the request

**"❌ Not authorized"**
- User is not the admin of this organization
- Check user ID vs organization adminUser

**"Organization validation failed"**
- Data validation error
- Check which fields are missing

## Step 5: Manual Test via MongoDB Compass

1. Open MongoDB Compass
2. Connect to your database
3. Go to `dms` database → `organizations` collection
4. Find your organization (Akhuwat Foundation)
5. Click Edit Document
6. Find the `inventory` array
7. Change a quantity manually
8. Click Update
9. Refresh the browser page
10. Check if the change appears

## Step 6: Test with Postman/Thunder Client

### Request:

```
PUT http://localhost:5000/api/organizations/YOUR_ORG_ID/inventory
Headers:
  Authorization: Bearer YOUR_TOKEN
  Content-Type: application/json

Body:
{
  "inventory": [
    {
      "packageName": "Test Package",
      "category": "food",
      "quantity": 100,
      "description": "Test",
      "lastUpdated": "2026-02-24T07:00:00.000Z"
    }
  ]
}
```

### Get Your Token:

1. Open Browser Console
2. Type: `localStorage.getItem('dms_token')`
3. Copy the token

### Get Your Org ID:

1. Open Browser Console
2. Type: `localStorage.getItem('dms_user')`
3. Or check the Network tab for the organization ID in API calls

## Common Issues & Solutions

### Issue 1: Changes Not Persisting

**Symptoms:** You see success message but changes don't save
**Cause:** Database connection issue or validation error
**Solution:** 
- Check backend logs for validation errors
- Verify MongoDB connection is active
- Check if organization document has the correct structure

### Issue 2: Authorization Error

**Symptoms:** 403 Forbidden error
**Cause:** User is not the admin of the organization
**Solution:**
- Verify you're logged in as the NGO user
- Check if the organization's `adminUser` matches your user ID
- Run: `db.organizations.findOne({name: "Akhuwat Foundation"}, {adminUser: 1})`
- Compare with: `db.users.findOne({email: "your@email.com"}, {_id: 1})`

### Issue 3: Validation Error

**Symptoms:** "packageName is required" or "category is required"
**Cause:** Data is not being sent correctly
**Solution:**
- Check browser console for the "Clean Inventory" log
- Verify all items have packageName and category
- Check if data is being corrupted during transmission

### Issue 4: Network Error

**Symptoms:** Request fails, no response
**Cause:** Backend not running or CORS issue
**Solution:**
- Check if backend is running on port 5000
- Verify CORS is configured correctly
- Check if firewall is blocking the request

## Quick Fix: Reset Inventory

If nothing works, reset the inventory:

```bash
cd backend
node add-test-inventory.js
```

This will reset all NGO inventories to the test data.

## Need More Help?

Share the following information:

1. **Browser Console Logs** (screenshot or copy-paste)
2. **Network Tab** (screenshot of the failed request)
3. **Backend Terminal Logs** (copy-paste the error)
4. **MongoDB Document** (screenshot of the organization document)

This will help identify the exact issue!
