import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CalendarService } from './services/calendar.service';
import { CalendarViewComponent } from './components/calendar-view/calendar-view.component';
import { Calendar, DayData } from './models/calendar.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarViewComponent],
})
export class AppComponent {
  calendarService = inject(CalendarService);
  
  calendars = this.calendarService.calendars;
  activeCalendar = this.calendarService.activeCalendar;

  newCalendarName = signal('');
  selectedDate = signal<Date | null>(null);
  isSidebarOpen = signal(false);
  
  editingCalendarId = signal<string | null>(null);
  renamingText = signal('');
  calendarToDelete = signal<Calendar | null>(null);

  handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newCalendarName.set(target.value);
  }

  addCalendar() {
    this.calendarService.createCalendar(this.newCalendarName());
    this.newCalendarName.set('');
  }

  selectCalendar(id: string) {
    this.calendarService.selectCalendar(id);
    this.isSidebarOpen.set(false); // Close sidebar on mobile after selection
    this.selectedDate.set(null); // Deselect day when changing calendar
  }
  
  startRenaming(calendar: Calendar): void {
    this.editingCalendarId.set(calendar.id);
    this.renamingText.set(calendar.name);
  }

  handleRenameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.renamingText.set(target.value);
  }

  saveRename(): void {
    const id = this.editingCalendarId();
    if (id) {
      this.calendarService.renameCalendar(id, this.renamingText());
    }
    this.editingCalendarId.set(null);
  }
  
  cancelRename(): void {
    this.editingCalendarId.set(null);
  }

  promptDelete(calendar: Calendar): void {
    this.calendarToDelete.set(calendar);
  }
  
  confirmDelete(): void {
    const cal = this.calendarToDelete();
    if (cal) {
      this.calendarService.deleteCalendar(cal.id);
      this.calendarToDelete.set(null);
    }
  }

  cancelDelete(): void {
    this.calendarToDelete.set(null);
  }

  onDaySelected(date: Date) {
    const currentSelectedDate = this.selectedDate();
    const isSameDay = currentSelectedDate &&
      currentSelectedDate.getFullYear() === date.getFullYear() &&
      currentSelectedDate.getMonth() === date.getMonth() &&
      currentSelectedDate.getDate() === date.getDate();

    if (isSameDay) {
      // It's already selected, so this click toggles the marked state
      const dayData = this.calendarService.getDayData(date);
      this.calendarService.updateDay(date, {
        marked: !dayData?.marked,
      });
    } else {
      // It's a new selection. Mark it and select it.
      this.calendarService.updateDay(date, { marked: true });
      this.selectedDate.set(date);
    }
  }

  handleNoteInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    const date = this.selectedDate();
    if (date) {
        this.calendarService.updateDay(date, { note: target.value });
    }
  }
}