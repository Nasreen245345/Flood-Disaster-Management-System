import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-about-system',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule],
    templateUrl: './about-system.html',
    styles: []
})
export class AboutSystemComponent { }
