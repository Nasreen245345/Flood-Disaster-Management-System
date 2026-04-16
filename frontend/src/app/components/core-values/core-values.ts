import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-core-values',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './core-values.html',
    styles: []
})
export class CoreValuesComponent {
    values = [
        {
            title: 'Transparency',
            desc: 'Every action is logged and tracked. We maintain complete accountability from request creation to aid delivery, ensuring trust in the system.',
            icon: 'shield',
            color: 'green'
        },
        {
            title: 'Efficiency',
            desc: 'Automated matching algorithms and streamlined workflows reduce response times by up to 65%, ensuring aid reaches those who need it faster.',
            icon: 'bolt',
            color: 'blue'
        },
        {
            title: 'Coordination',
            desc: 'Seamless communication between citizens, NGOs, and officers eliminates confusion and ensures everyone works together toward common goals.',
            icon: 'groups',
            color: 'green'
        }
    ];
}
