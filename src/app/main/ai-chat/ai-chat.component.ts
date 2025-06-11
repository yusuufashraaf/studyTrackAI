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
  isLimitReached: boolean = false;
  resetTime: Date | null = null;

  geminiService: GeminiService = inject(GeminiService);

  async sendMessage() {
    if (!this.userInput.trim()) return;

    // If already limited, just show the reset time
    if (this.isLimitReached) {
      if (this.resetTime) {
        this.response = `You can try again at ${this.resetTime.toLocaleString()}.`;
      } else {
        this.response =
          'You have reached your daily limit. Please try again later.';
      }
      return;
    }

    // Check limit before sending
    const promptStatus = await this.geminiService.getPromptLimitStatus();
    if (promptStatus.limitReached) {
      this.isLimitReached = true;
      this.resetTime = promptStatus.resetTime;
      this.response = `You can try again at ${this.resetTime?.toLocaleString()}.`;
      return;
    }

    this.response = '';
    this.geminiService
      .generateResponse(this.userInput)
      .then(() => {
        this.response = 'roadmap is added to your calendar 🚀';
        this.isLimitReached = false;
        this.resetTime = null;
      })
      .catch((error) => {
        if (error && error.limitReached) {
          this.isLimitReached = true;
          this.resetTime = error.resetTime;
          this.response = `You can try again at ${this.resetTime?.toLocaleString()}.`;
        } else {
          this.response = 'An error occurred while generating the response.';
        }
      });
    this.userInput = '';
  }
}
