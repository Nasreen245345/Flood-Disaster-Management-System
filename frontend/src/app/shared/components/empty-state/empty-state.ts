import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="empty-state">
      <div class="empty-icon-wrapper" *ngIf="icon">
        <mat-icon>{{ icon }}</mat-icon>
      </div>
      <div class="empty-text">
        <h3 *ngIf="title">{{ title }}</h3>
        <p *ngIf="description">{{ description }}</p>
      </div>
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      margin: 24px 0;
      text-align: center;
      background: #f9fafb;
      border: 2px dashed #e5e7eb;
      border-radius: 12px;
    }
    .empty-icon-wrapper {
      width: 64px;
      height: 64px;
      background: #e0e7ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .empty-icon-wrapper mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #4f46e5;
    }
    .empty-text h3 {
      margin: 0 0 8px 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }
    .empty-text p {
      margin: 0;
      font-size: 0.875rem;
      color: #6b7280;
      max-width: 400px;
      line-height: 1.5;
    }
  `]
})
export class EmptyStateComponent {
  @Input() icon?: string;
  @Input() title?: string;
  @Input() description?: string;
}