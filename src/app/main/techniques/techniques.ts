import { Component, inject, OnInit } from '@angular/core';
import { FirestoreService } from '../../firebase/firestore.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-techniques',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './techniques.html',
  styleUrl: './techniques.css',
})
export class Techniques implements OnInit {
  private firestore = inject(FirestoreService);
  techniques: {
    topic: string;
    questions: any[];
    videoURL:string,
    order: number;
    expanded?: boolean;
  }[] = [];

  async ngOnInit() {
    this.techniques = await this.firestore.getTechniques();
    // Initialize expanded flag to false for all topics    
    this.techniques.forEach((t) => (t.expanded = false));
  }

  toggleExpand(topic: string) {
    // Toggle the expanded property of the clicked topic
    this.techniques = this.techniques.map((t) =>
      t.topic === topic ? { ...t, expanded: !t.expanded } : t
    );
  }
}
