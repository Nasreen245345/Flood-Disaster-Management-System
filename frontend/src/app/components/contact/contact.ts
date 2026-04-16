import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-contact',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        FormsModule
    ],
    templateUrl: './contact.html',
    styles: [`
    :host ::ng-deep .mat-mdc-text-field-wrapper {
        background-color: #27272a !important; /* zinc-800 */
    }
    :host ::ng-deep .mat-mdc-form-field-label {
        color: #a1a1aa !important; /* zinc-400 */
    }
    :host ::ng-deep .mat-mdc-input-element {
        color: #fff !important;
    }
  `]
})
export class ContactComponent {

    contactInfo = [
        {
            title: 'Our Location',
            lines: ['Disaster Management Center', 'Kharian, Punjab', 'Pakistan'],
            icon: 'location_on'
        },
        {
            title: 'Phone',
            lines: ['Emergency: 1122', 'Support: +92-XXX-XXXXXXX'],
            icon: 'phone'
        },
        {
            title: 'Email',
            lines: ['support@floodmgmt.gov.pk', 'info@floodmgmt.gov.pk'],
            icon: 'email'
        }
    ];

    formData = {
        name: '',
        email: '',
        subject: '',
        message: ''
    };

    submit() {
        console.log('Form submitted:', this.formData);
    }
}
