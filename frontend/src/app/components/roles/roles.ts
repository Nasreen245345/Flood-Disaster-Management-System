import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './roles.html',
  styleUrls: ['./roles.css']
})
export class RolesComponent { }



