import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
  color: string;
  participants: string[]; // ✅ Add this line
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  today = new Date().toDateString();
  currentDate = new Date();
  weeks: any[] = [];
  form!: FormGroup;
  showForm = false;
  selectedDate = '';
  events: CalendarEvent[] = [];
  editingEvent: CalendarEvent | null = null;
  apiUrl = 'http://localhost:3000';
  suggestions: any[] = [];
new: any;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() {
    this.loadEvents();
    this.generateCalendar();
    this.form = this.fb.group({
      title: ['', Validators.required],
      category: ['Meeting', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      participants: ['user1']
    });
  }

  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < startDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
    while (days.length % 7 !== 0) days.push(null);

    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) this.weeks.push(days.slice(i, i + 7));
  }

  openForm(date: Date | null) {
    if (!date) return;
    this.selectedDate = date.toISOString().split('T')[0];
    this.suggestions = [];
    this.editingEvent = null;
    this.form.reset({ category: 'Meeting', participants: 'user1' });
    this.showForm = true;
  }

  saveEvent() {
    if (this.form.invalid) return;
  
    const startTime = `${this.selectedDate}T${this.form.value.startTime}`;
    const endTime = `${this.selectedDate}T${this.form.value.endTime}`;
    const participants = [this.form.value.participants];
  
    if (this.editingEvent) {
      const idx = this.events.findIndex(e => e.id === this.editingEvent!.id);
      this.events[idx] = {
        ...this.editingEvent,
        title: this.form.value.title,
        category: this.form.value.category,
        startTime,
        endTime,
        color: this.getColor(this.form.value.category)
      };
      this.saveToLocalStorage();
      this.showForm = false;
      alert('✅ Event updated successfully!');
      this.editingEvent = null;
      return;
    }
  
    // ✅ Call backend for conflict check
    this.http.post(`${this.apiUrl}/check-conflicts`, { startTime, endTime, participants })
      .subscribe({
        next: (res: any) => {
          console.log('API Response:', res); // 👈 Add this for debugging
          if (res.conflict) {
            alert('⚠️ Conflict found! Showing alternate suggestions...');
            this.getSuggestions(startTime, endTime);
          } else {
            alert('✅ No conflict, event added!');
            this.addEvent(startTime, endTime);
          }
        },
        error: (err) => {
          console.error('API Error:', err);
          alert('❌ Something went wrong while checking conflicts.');
        }
      });
  }
  
  

  editEvent(event: any, ev: MouseEvent) {
    ev.stopPropagation(); // prevent opening day form
    this.editingEvent = event;
    this.selectedDate = event.date;
    this.suggestions = [];
  
    this.form.patchValue({
      title: event.title,
      category: event.category,
      startTime: event.startTime.split('T')[1].substring(0, 5),
      endTime: event.endTime.split('T')[1].substring(0, 5),
      participants: 'user1'
    });
  
    this.showForm = true;
  }

  deleteEvent() {
    if (confirm('Delete this event?')) {
      this.events = this.events.filter(e => e.id !== this.editingEvent!.id);
      this.saveToLocalStorage();
      this.showForm = false;
      this.editingEvent = null;
    }
  }
  
  

  getSuggestions(startTime: string, endTime: string) {
    this.http.post(`${this.apiUrl}/suggest-times`, { startTime, endTime })
      .subscribe((res: any) => this.suggestions = res.suggestions);
  }

  addEvent(startTime: string, endTime: string) {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      date: this.selectedDate,
      title: this.form.value.title,
      startTime,
      endTime,
      category: this.form.value.category,
      color: this.getColor(this.form.value.category),
      participants: [this.form.value.participants] // ✅ Include user array
    };
  
    this.events.push(newEvent);
    this.saveToLocalStorage();
    this.showForm = false;
  
    // Optional feedback
    
  }
  
  toTimeInputValue(dt: Date): string {
    const h = dt.getHours().toString().padStart(2, '0');
    const m = dt.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  applySuggestion(s: any) {
    // s.startTime / s.endTime are ISO strings from backend (possibly UTC).
    const start = new Date(s.startTime);
    const end   = new Date(s.endTime);
  
    // Convert to the local HH:MM string for time inputs
    this.form.patchValue({
      startTime: this.toTimeInputValue(start),
      endTime:   this.toTimeInputValue(end)
    });
  
   
    this.suggestions = [];
    
  }
  getEvents(date: Date | null) {
    if (!date) return [];
    const d = date.toISOString().split('T')[0];
    return this.events.filter(e => e.date === d);
  }

  prevMonth() {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate = new Date(this.currentDate.setMonth(currentMonth - 1));
    this.generateCalendar();
  }
  
  nextMonth() {
    const currentMonth = this.currentDate.getMonth();
    this.currentDate = new Date(this.currentDate.setMonth(currentMonth + 1));
    this.generateCalendar();
  }
  getColor(cat: string) {
    switch (cat) {
      case 'Meeting': return '#60a5fa';
      case 'Personal': return '#86efac';
      case 'Work': return '#facc15';
      default: return '#d1d5db';
    }
  }

  saveToLocalStorage() {
    if (typeof window !== 'undefined' && localStorage) {
      localStorage.setItem('calendarEvents', JSON.stringify(this.events));
    }
  }  loadEvents() {
    if (typeof window !== 'undefined' && localStorage) {
      const saved = localStorage.getItem('calendarEvents');
      this.events = saved ? JSON.parse(saved) : [];
    } else {
      this.events = [];
    }
  }
}
