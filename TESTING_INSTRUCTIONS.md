# Testing Instructions

## 🧪 How to Test the Updated Features

### Prerequisites
- Both servers are running (Backend: port 5000, Frontend: port 4200)
- You are logged in as an NGO user or Admin user
- Browser console is open (F12 → Console tab)

---

## TEST 1: Inventory Management (NGO User)

### Step 1: Navigate to Inventory Page
1. Login as NGO user
2. Go to Dashboard → Inventory Management
3. You should see a table with your packages

### Step 2: Test Loading Inventory
**Expected Result**:
- Table displays all packages
- Summary cards show correct totals
- Browser console shows: `=== LOAD INVENTORY ===`

### Step 3: Test Quick Update (+10/-10 Buttons)
1. Find any package in the table
2. Note the current quantity
3. Click the **+10** button
4. **Watch for**:
   - Browser console: `=== UPDATE QUANTITY ===`
   - Browser console: `=== SAVING INVENTORY ===`
   - Backend terminal: `=== UPDATE INVENTORY ===`
   - Backend terminal: `✅ Inventory updated successfully`
   - Snackbar message: "Inventory updated successfully"
   - Table refreshes with new quantity

5. Click the **-10** button
6. Verify quantity decreases by 10

**If it works**: ✅ Inventory update is working!

**If it doesn't work**:
- Check browser console for errors
- Check backend terminal for errors
- Check Network tab (F12 → Network) for the PUT request
- Take a screenshot and share the error

### Step 4: Test Add New Package
1. Click **Add Package** button
2. Fill in the form:
   - Package Name: "Test Package"
   - Category: Select any
   - Quantity: 100
   - Description: "Testing"
3. Click **Save**
4. **Watch for**:
   - Browser console: `=== ADD ITEM ===`
   - New package appears in table
   - Summary cards update

### Step 5: Test Edit Package
1. Click the **Edit** icon (pencil) on any package
2. Change the quantity
3. Click **Save**
4. **Watch for**:
   - Browser console: `=== EDIT ITEM ===`
   - Package updates in table

### Step 6: Test Delete Package
1. Click the **Delete** icon (trash) on any package
2. Confirm deletion
3. Package should disappear from table

### Step 7: Verify in Database
1. Open MongoDB Compass
2. Connect to your cluster
3. Navigate to: `dms` → `organizations` → Find your NGO
4. Check the `inventory` array
5. Verify the changes are saved

---

## TEST 2: Admin Dashboard - Organizations (Admin User)

### Step 1: Navigate to Organizations Page
1. Login as Admin user
2. Go to Admin Dashboard → Organizations
3. You should see a table with all organizations

### Step 2: Test Loading Organizations
**Expected Result**:
- Table displays all organizations from database
- Shows real data (not mock data)
- Capacity shows: volunteers count + resources count
- Workload shows percentage with colored bar

### Step 3: Test Filters
1. Try filtering by Type: NGO / Government
2. Try filtering by Status: Approved / Pending / Disabled
3. Results count should update

### Step 4: Test Approve Organization
1. Find an organization with status "Pending"
2. Click the **three dots** menu (⋮)
3. Click **Approve**
4. Confirm the action
5. **Watch for**:
   - Status changes to "Approved"
   - Green chip with checkmark icon
   - Backend terminal: `✅ Organization [name] status updated to: approved`

### Step 5: Test Disable Organization
1. Find an organization with status "Approved"
2. Click the **three dots** menu (⋮)
3. Click **Disable**
4. Confirm the action
5. **Watch for**:
   - Status changes to "Disabled"
   - Backend terminal: `✅ Organization [name] status updated to: disabled`

### Step 6: Test Enable Organization
1. Find an organization with status "Disabled"
2. Click the **three dots** menu (⋮)
3. Click **Enable**
4. **Watch for**:
   - Status changes to "Approved"

---

## 🔍 Debugging Tips

### Browser Console Logs
Open browser console (F12 → Console) and look for:

**Inventory Management**:
```
=== LOAD INVENTORY ===
Response: { success: true, data: {...} }
Cleaned inventory: [...]

=== UPDATE QUANTITY ===
Item: { packageName: "...", quantity: 50 }
Delta: 10
New Quantity: 60
Updated item: { packageName: "...", quantity: 60 }

=== SAVING INVENTORY ===
NGO ID: 69956ee5fc279ce9b2ab9e92
Clean Inventory: [...]
✅ Inventory saved successfully
```

**Admin Organizations**:
```
Organizations loaded: [...]
Status updated: { success: true, data: {...} }
```

### Backend Terminal Logs
Check the backend terminal for:

```
=== UPDATE INVENTORY ===
Organization ID: 69956ee5fc279ce9b2ab9e92
User ID: 696494ee4ce1eb3066776bd0
Request Body Keys: [ 'inventory' ]
✅ Received 4 packages
✅ Clean inventory prepared: 4 items
✅ Inventory updated successfully for Akhuwat Foundation
✅ New inventory count: 4 items
```

### Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "XHR" or "Fetch"
4. Look for requests to:
   - `PUT http://localhost:5000/api/organizations/[id]/inventory`
   - `PUT http://localhost:5000/api/organizations/[id]/status`
5. Check the request payload and response

---

## ❌ Common Errors and Solutions

### Error: "Failed to save inventory"
**Possible Causes**:
1. Token expired → Login again
2. Not authorized → Check if you're the NGO admin
3. Invalid data → Check console for validation errors

**Solution**:
- Logout and login again
- Check backend terminal for detailed error message

### Error: "Organization not found"
**Possible Causes**:
1. NGO ID is incorrect
2. Organization was deleted

**Solution**:
- Check if organization exists in database
- Verify the NGO ID in localStorage

### Error: Network request failed
**Possible Causes**:
1. Backend server is not running
2. Wrong API URL
3. CORS issue

**Solution**:
- Check if backend is running on port 5000
- Verify API URL in service: `http://localhost:5000/api`

---

## ✅ Success Criteria

### Inventory Management
- ✅ Can load inventory from database
- ✅ Can see all packages in table
- ✅ Can add new package
- ✅ Can edit existing package
- ✅ Can delete package
- ✅ Can update quantity with +10/-10 buttons
- ✅ Changes persist in database
- ✅ Summary cards show correct totals

### Admin Organizations
- ✅ Can load organizations from API
- ✅ Can see real data (not mock)
- ✅ Can filter by type and status
- ✅ Can approve pending organizations
- ✅ Can disable approved organizations
- ✅ Can enable disabled organizations
- ✅ Status changes persist in database

---

## 📸 What to Share if Issues Occur

If you encounter any issues, please share:

1. **Screenshot of browser console** (with error messages)
2. **Screenshot of backend terminal** (with error logs)
3. **Screenshot of Network tab** (showing the failed request)
4. **Description of what you were trying to do**
5. **Your user role** (NGO or Admin)

---

## 🎉 Next Steps After Testing

Once testing is complete and everything works:

1. ✅ Mark inventory management as fully working
2. ✅ Mark admin organizations as fully working
3. 🔄 Integrate real data for other admin pages:
   - Users page
   - Disasters page
   - Region assignments page
   - Activity logs page
4. 🔄 Add more features as needed

---

**Happy Testing!** 🚀

If everything works, you now have:
- ✅ Package-based aid request system
- ✅ GPS coordinate location tracking
- ✅ Complete inventory management for NGOs
- ✅ Real-time admin dashboard for organizations
