import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NgoService } from '../services/ngo.service';

@Component({
    selector: 'app-scan-distribute',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatStepperModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatListModule,
        MatDividerModule,
        MatSnackBarModule
    ],
    templateUrl: './scan-distribute.html',
    styleUrls: ['./scan-distribute.css']
})
export class ScanDistributeComponent {
    private _formBuilder = inject(FormBuilder);
    private ngoService = inject(NgoService);
    private snackBar = inject(MatSnackBar);

    regions$ = this.ngoService.regions$;
    inventory$ = this.ngoService.inventory$;
    volunteers$ = this.ngoService.volunteers$;

    // Step 1: Verification
    verificationForm = this._formBuilder.group({
        region: ['', Validators.required],
        victimId: ['', Validators.required]
    });

    // Step 2: Distribution Items
    // Helper form controls for adding items
    selectedInventoryItem = '';
    manualItemName = '';

    // Main FormArray
    itemsForm = this._formBuilder.group({
        items: this._formBuilder.array([], Validators.required)
    });

    get itemsArray() {
        return this.itemsForm.get('items') as any;
    }

    addInventoryItem() {
        if (!this.selectedInventoryItem) return;

        this.itemsArray.push(this._formBuilder.group({
            name: [this.selectedInventoryItem, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            isManual: [false]
        }));
        this.selectedInventoryItem = ''; // Reset selection
    }

    addManualItem() {
        if (!this.manualItemName.trim()) return;

        this.itemsArray.push(this._formBuilder.group({
            name: [this.manualItemName, Validators.required],
            quantity: [1, [Validators.required, Validators.min(1)]],
            isManual: [true]
        }));
        this.manualItemName = ''; // Reset input
    }

    removeItem(index: number) {
        this.itemsArray.removeAt(index);
    }

    // Step 3: Confirmation
    confirmationForm = this._formBuilder.group({
        volunteer: ['', Validators.required]
    });

    victimDetails: any = null; // Mock victim profile
    isScanning = false;

    simulateScan() {
        this.isScanning = true;
        setTimeout(() => {
            this.verificationForm.patchValue({ victimId: 'V123-SCANNED' });
            this.isScanning = false;
            this.fetchVictim();
        }, 1500);
    }

    fetchVictim() {
        const id = this.verificationForm.get('victimId')?.value;
        if (id) {
            // Mock fetch
            this.victimDetails = {
                name: 'Mock Victim ' + id,
                cnic: '12345-6789012-3',
                status: 'Eligible',
                lastAid: '2 weeks ago'
            };
        }
    }

    confirmDistribution() {
        const victimId = this.verificationForm.value.victimId!;
        const region = this.verificationForm.value.region!;
        const items = this.itemsForm.value.items as { name: string, quantity: number, isManual: boolean }[];
        const volunteer = this.confirmationForm.value.volunteer!;

        this.ngoService.distributeAid(victimId, region, items, volunteer).subscribe(() => {
            this.snackBar.open('Distribution Confirmed & Logged!', 'Close', { duration: 3000 });
            // Ideally reset forms here
            this.itemsArray.clear();
            this.verificationForm.reset();
            this.confirmationForm.reset();
            this.victimDetails = null;
        });
    }
}
