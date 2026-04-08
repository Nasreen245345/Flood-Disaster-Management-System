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
        background-color: #18181b !important; /* zinc-900 */
        color: #e4e4e7 !important; /* zinc-200 */
        border: 1px solid #27272a; /* zinc-800 */
    }
    :host ::ng-deep .mat-expansion-panel-header-title,
    :host ::ng-deep .mat-expansion-panel-header-description {
        color: #fff !important;
    }
    :host ::ng-deep .mat-expansion-indicator::after {
        color: #fff !important;
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
            q: 'What is the QR code verification system?',
            a: 'When an NGO is assigned to a request, a unique QR code is generated for that specific delivery. The citizen shows this QR code to the NGO upon aid delivery. The NGO scans it to confirm delivery, ensuring transparency and preventing fraud.'
        },
        {
            q: 'How quickly will my help request be processed?',
            a: 'Once you submit a help request, officers monitor it in real-time and typically assign an NGO within hours depending on availability and severity. You\'ll receive notifications at each step of the process.'
        }
    ];
}
