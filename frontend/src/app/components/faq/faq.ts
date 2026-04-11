import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
    selector: 'app-faq',
    standalone: true,
    imports: [CommonModule, MatExpansionModule],
    templateUrl: './faq.html',
    styles: [`
    :host ::ng-deep .mat-expansion-panel {
        background-color: #1e3a8a !important; /* blue-900 */
        color: #e0e7ff !important; /* blue-100 */
        border: 1px solid #1e40af; /* blue-800 */
        margin-bottom: 24px !important;
        border-radius: 12px !important;
    }
    :host ::ng-deep .mat-accordion .mat-expansion-panel + .mat-expansion-panel {
        margin-top: 0 !important;
    }
    :host ::ng-deep .mat-expansion-panel-header-title,
    :host ::ng-deep .mat-expansion-panel-header-description {
        color: #ffffff !important;
    }
    :host ::ng-deep .mat-expansion-indicator::after {
        color: #ffffff !important;
        border-color: #ffffff !important;
    }
    :host ::ng-deep .mat-expansion-indicator svg path {
        fill: #ffffff !important;
        stroke: #ffffff !important;
    }
  `]
})
export class FaqComponent {
    faqs = [
        {
            q: 'How do I register as a citizen?',
            a: 'Click on the "Register" button on the home page and select "Citizen". Fill in your basic information including name, email, phone, and password. Once registered, you can immediately start submitting help requests.'
        },
        {
            q: 'How do NGOs get verified?',
            a: 'NGOs can register with their organization details. Officers will review and verify your organization before you can receive assignments. This ensures only legitimate relief organizations participate in the system.'
        },
        {
            q: 'How quickly will my help request be processed?',
            a: 'Once you submit a help request, officers monitor it in real-time and typically assign an NGO within hours depending on availability and severity. You\'ll receive notifications at each step of the process.'
        }
    ];
}
