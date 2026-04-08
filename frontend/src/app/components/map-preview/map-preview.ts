import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-map-preview',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './map-preview.html',
  styleUrls: ['./map-preview.css']
})
export class MapPreviewComponent { }



