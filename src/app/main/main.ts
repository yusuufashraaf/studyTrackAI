import { Component } from '@angular/core';
import { Sidebar } from './sidebar/sidebar';
import { RouterOutlet } from '@angular/router';
import { AiChatComponent } from './ai-chat/ai-chat.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [RouterOutlet, Sidebar, AiChatComponent],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {}
