import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-input-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <mat-form-field appearance="outline" class="w-full custom-field">
      <mat-label>{{ label }}</mat-label>
      <input matInput [type]="type" [formControl]="control" [placeholder]="placeholder">
      <mat-icon matPrefix class="mr-2 text-primary/60">{{ icon }}</mat-icon>
      
      <mat-error *ngIf="control.hasError('required')">{{ label }} is required</mat-error>
      <mat-error *ngIf="control.hasError('email')">Please enter a valid email</mat-error>
      <mat-error *ngIf="control.hasError('minlength')">Password is too short</mat-error>
    </mat-form-field>
  `,
  styles: [`
    :host { display: block; margin-bottom: 1rem; }
    /* Local scoped styles if global overrides aren't enough, but global strategies usually best for Material */
  `]
})
export class InputFieldComponent {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() icon: string = '';
  @Input() control: FormControl = new FormControl();
}
