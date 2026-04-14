
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgoService } from '../services/ngo.service';
import { AddItemDialogComponent } from './add-item-dialog';

interface PackageItem {
    packageName: string;
    category: string;
    quantity: number;
    description?: string;
    lastUpdated?: Date;
}

@Component({
    selector: 'app-inventory',
    standalone: true,
    imports: [
        
        CommonModule,
        MatCardModule,
        MatTableModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './inventory.html',
    styleUrls: ['./inventory.css']
})
export class InventoryComponent implements OnInit {
    ngoService = inject(NgoService);
    dialog = inject(MatDialog);
    snackBar = inject(MatSnackBar);
    
    inventory: PackageItem[] = [];
    ngoId: string | null = null;
    isLoading = false;
    
    displayedColumns = ['packageName', 'category', 'quantity', 'description', 'lastUpdated', 'actions'];

    ngOnInit() {
        this.loadInventory();
    }

    loadInventory() {
        this.isLoading = true;
        this.ngoService.getMyOrganization().subscribe({
            next: (response) => {
                console.log('=== LOAD INVENTORY ===');
                console.log('Response:', response);
                
                this.ngoId = response.data._id;
                
                // Clean the inventory data - remove MongoDB _id fields
                this.inventory = (response.data.inventory || []).map((item: any) => ({
                    packageName: item.packageName,
                    category: item.category,
                    quantity: item.quantity,
                    description: item.description,
                    lastUpdated: item.lastUpdated ? new Date(item.lastUpdated) : new Date()
                }));
                
                console.log('Cleaned inventory:', this.inventory);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading inventory:', err);
                this.snackBar.open('Failed to load inventory', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    updateQuantity(index: number, delta: number) {
        const item = this.inventory[index];
        const newQuantity = Math.max(0, item.quantity + delta);
        
        console.log('=== UPDATE QUANTITY ===');
        console.log('Item:', item);
        console.log('Delta:', delta);
        console.log('New Quantity:', newQuantity);
        
        this.inventory[index] = {
            packageName: item.packageName,
            category: item.category,
            quantity: newQuantity,
            description: item.description,
            lastUpdated: new Date()
        };

        console.log('Updated item:', this.inventory[index]);
        this.saveInventory();
    }

    deleteItem(index: number) {
        const item = this.inventory[index];
        if (confirm(`Delete ${item.packageName}?`)) {
            this.inventory.splice(index, 1);
            this.saveInventory();
        }
    }

    addItem() {
        const dialogRef = this.dialog.open(AddItemDialogComponent, {
            width: '500px',
            maxWidth: '95vw',
            panelClass: 'glass-dialog'
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('=== ADD ITEM ===');
                console.log('Dialog result:', result);
                
                const newItem = {
                    packageName: result.packageName,
                    category: result.category,
                    quantity: result.quantity,
                    description: result.description || '',
                    lastUpdated: new Date()
                };
                
                console.log('New item:', newItem);
                this.inventory.push(newItem);
                this.saveInventory();
            }
        });
    }

    editItem(index: number) {
        const item = this.inventory[index];
        const dialogRef = this.dialog.open(AddItemDialogComponent, {
            width: '500px',
            maxWidth: '95vw',
            panelClass: 'glass-dialog',
            data: {
                packageName: item.packageName,
                category: item.category,
                quantity: item.quantity,
                description: item.description
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('=== EDIT ITEM ===');
                console.log('Dialog result:', result);
                
                this.inventory[index] = {
                    packageName: result.packageName,
                    category: result.category,
                    quantity: result.quantity,
                    description: result.description || '',
                    lastUpdated: new Date()
                };
                
                console.log('Updated item:', this.inventory[index]);
                this.saveInventory();
            }
        });
    }

    private saveInventory() {
        if (!this.ngoId) {
            console.error('❌ No NGO ID available');
            return;
        }

        // Validate and clean inventory data before sending
        const cleanInventory = this.inventory.map(item => {
            if (!item.packageName || !item.category) {
                console.error('❌ Invalid item:', item);
                throw new Error('Invalid inventory item: missing packageName or category');
            }
            
            return {
                packageName: item.packageName,
                category: item.category,
                quantity: Number(item.quantity) || 0,
                description: item.description || '',
                lastUpdated: new Date()
            };
        });

        console.log('=== SAVING INVENTORY ===');
        console.log('NGO ID:', this.ngoId);
        console.log('Clean Inventory:', cleanInventory);

        this.isLoading = true;
        this.ngoService.updateInventory(this.ngoId, { inventory: cleanInventory }).subscribe({
            next: (response) => {
                console.log('✅ Inventory saved successfully:', response);
                this.snackBar.open('Inventory updated successfully', 'Close', { duration: 2000 });
                this.isLoading = false;
                // Reload to get fresh data from server
                this.loadInventory();
            },
            error: (err) => {
                console.error('❌ Error saving inventory:', err);
                console.error('Error details:', err.error);
                this.snackBar.open('Failed to save inventory: ' + (err.error?.message || err.message), 'Close', { duration: 5000 });
                this.isLoading = false;
            }
        });
    }

    getCategoryColor(category: string): string {
        const colors: Record<string, string> = {
            'food': '#16a34a',
            'medical': '#dc2626',
            'shelter': '#ea580c',
            'clothing': '#2563eb'
        };
        return colors[category.toLowerCase()] || '#6b7280';
    }

    getCategoryLabel(category: string): string {
        const labels: Record<string, string> = {
            'food': 'Food',
            'medical': 'Medical',
            'shelter': 'Shelter',
            'clothing': 'Clothing'
        };
        return labels[category.toLowerCase()] || category;
    }

    getTotalPackages(): number {
        return this.inventory.reduce((sum, item) => sum + item.quantity, 0);
    }

    getLowStockCount(): number {
        return this.inventory.filter(item => item.quantity < 20).length;
    }
}

