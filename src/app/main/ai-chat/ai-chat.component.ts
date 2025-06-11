import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from './gemini-service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chat.component.html',
  styleUrls: ['./ai-chat.component.css'],
})
export class AiChatComponent {
  userInput: string = '';
  response: any;

  geminiService: GeminiService = inject(GeminiService);

  sendMessage() {
    if (this.userInput.trim()) {
      this.geminiService
        .generateResponse(this.userInput)
        .then((res) => {
          this.response = res;
          console.log('Response from Gemini:', this.response);
        })
        .catch((error) => {
          console.error('Error generating response:', error);
          this.response = 'An error occurred while generating the response.';
        });
      this.userInput = '';
    }
  }
}
