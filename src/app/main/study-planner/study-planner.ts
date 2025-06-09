import { Component, OnInit } from '@angular/core';
import { CalendarEvent } from 'angular-calendar';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-study-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './study-planner.html',
  styleUrls: ['./study-planner.css'],
})
export class StudyPlanner implements OnInit {
  viewDate: Date = new Date();

  readonly daysName: string[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];

  events: CalendarEvent[] = [];

  previousMonth(): void {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() - 1,
      1
    );
  }

  nextMonth(): void {
    this.viewDate = new Date(
      this.viewDate.getFullYear(),
      this.viewDate.getMonth() + 1,
      1
    );
  }

  dayClicked(date: Date): void {
    if (this.viewDate.getTime() === date.getTime()) {
      // You may toggle some UI state here if needed
      return;
    }
    this.viewDate = date;
  }

  getMonthDays(viewDate: Date): { date: Date; isOtherMonth: boolean }[] {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 0 });
    const days = [];
    let date = start;
    while (date <= end) {
      days.push({
        date: new Date(date),
        isOtherMonth: !isSameMonth(date, viewDate),
      });
      date = addDays(date, 1);
    }
    return days;
  }

  eventsForDay(date: Date): CalendarEvent[] {
    return this.events.filter((event) => isSameDay(event.start, date));
  }

  isToday(date: Date): boolean {
    return isSameDay(date, new Date());
  }

  get monthYear(): string {
    return this.viewDate.toLocaleDateString('default', {
      month: 'long',
      year: 'numeric',
    });
  }

  removeEventsForDay(date: Date): void {
    this.events = this.events.filter((event) => !isSameDay(event.start, date));
  }

  toPascalCase(input: string): string {
    return input
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  generateEventsFromCoursePlan(
    coursePlan: CoursePlan,
    startDate: Date
  ): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    let currentStart = new Date(startDate);

    for (const subTopic of coursePlan.subTopics) {
      for (let i = 0; i < subTopic.duration; i++) {
        const day = addDays(currentStart, i);
        events.push({
          start: day,
          title: `-${this.toPascalCase(subTopic.name)}`,
          color: { primary: '#f2e090', secondary: '#fdf8df' },
        });
      }
      currentStart = addDays(currentStart, subTopic.duration);
    }
    return events;
  }

  addCoursePlanToCalendar(coursePlan: CoursePlan): void {
    const startDate = new Date();
    this.events = this.generateEventsFromCoursePlan(coursePlan, startDate);
  }

  ngOnInit(): void {
    const coursePlan: CoursePlan = {
      topic: 'front-end',
      subTopics: [
        { name: 'angular', duration: 7 },
        { name: 'html', duration: 6 },
      ],
    };
    this.events = this.generateEventsFromCoursePlan(
      coursePlan,
      new Date(2025, 5, 10)
    );
  }
}
