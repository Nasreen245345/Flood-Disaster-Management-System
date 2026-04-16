import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-how-it-works',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './how-it-works.html',
    styles: []
})
export class HowItWorksComponent {
    steps = [
        {
            num: 1,
            title: 'Officer Tags Areas',
            desc: 'Government officers identify and map disaster-affected areas on the system.'
        },
        {
            num: 2,
            title: 'Citizens Request Help',
            desc: 'Affected citizens submit help requests specifying needed resources.'
        },
        {
            num: 3,
            title: 'NGOs Deliver Aid',
            desc: 'NGOs are assigned requests and deliver verified aid using QR codes.'
        }
    ];
}
