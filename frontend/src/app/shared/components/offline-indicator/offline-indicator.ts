import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OfflineSyncService } from '../../services/offline-sync.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSnackBarModule],
  template: `
    <div *ngIf="!(sync.isOnline$ | async)" class="offline-banner">
      <mat-icon>wifi_off</mat-icon>
      <span>You are offline. Data will sync when connection is restored.</span>
      <span *ngIf="(sync.pendingCount$ | async)! > 0" class="pending-badge">
        {{ sync.pendingCount$ | async }} pending
      </span>
    </div>
    <div *ngIf="(sync.isOnline$ | async) && (sync.pendingCount$ | async)! > 0" class="sync-banner">
      <mat-icon>sync</mat-icon>
      <span *ngIf="!(sync.syncing$ | async)">
        {{ sync.pendingCount$ | async }} offline requests ready to sync.
      </span>
      <span *ngIf="sync.syncing$ | async">Syncing offline data...</span>
      <button mat-button (click)="sync.syncPendingRequests()" *ngIf="!(sync.syncing$ | async)">
        Sync Now
      </button>
    </div>
  `,
  styles: [`
    .offline-banner {
      display: flex; align-items: center; gap: 8px;
      background: #ef4444; color: white;
      padding: 8px 16px; font-size: 0.85rem;
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    }
    .sync-banner {
      display: flex; align-items: center; gap: 8px;
      background: #f59e0b; color: white;
      padding: 8px 16px; font-size: 0.85rem;
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
    }
    .pending-badge {
      background: rgba(0,0,0,0.2); padding: 2px 8px;
      border-radius: 12px; font-size: 0.75rem;
    }
    mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class OfflineIndicatorComponent {
  sync = inject(OfflineSyncService);
}
