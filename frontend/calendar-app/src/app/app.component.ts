import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarComponent } from './components/calendar/calendar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CalendarComponent],
  template: `<app-calendar></app-calendar>`,
  styleUrls: ['./app.component.css']
})
export class AppComponent {}
