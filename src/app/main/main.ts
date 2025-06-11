import { Component } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
