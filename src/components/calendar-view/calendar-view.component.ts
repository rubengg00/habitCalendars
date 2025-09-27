import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Calendar, DayData } from '../../models/calendar.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-calendar-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar-view.component.html',
  styleUrls: ['./calendar-view.component.css'],
  // Activa la detección de cambios "OnPush": Angular solo volverá a renderizar este componente
  // si una de sus @Input cambia, se emite un evento (@Output) o se dispara un Observable
  // al que esté suscrito dentro del template. Mejora el rendimiento al evitar chequeos innecesarios.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarViewComponent {
  activeCalendar = input.required<Calendar>();
  selectedDate = input<Date | null>(null);
  daySelected = output<Date>();

  currentDate = signal(new Date());
  weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  private formatDateToKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  currentMonthAndYear = computed(() => {
    return this.currentDate().toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
  });

  // Contador de días marcados en el mes actual
  markedDaysCount = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const calendar = this.activeCalendar();

    let count = 0;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const key = this.formatDateToKey(currentDate);
      if (calendar.data[key]?.marked) {
        count++;
      }
    }

    return count;
  });

  monthGrid = computed<CalendarDay[][]>(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDayOfMonth.getDay();
    const totalDays = lastDayOfMonth.getDate();
    
    const grid: CalendarDay[] = [];
    const prevMonthLastDay = new Date(year, month, 0).getDate();

    // Days from previous month
    for (let i = firstDayOfWeek; i > 0; i--) {
      grid.push({ 
        date: new Date(year, month - 1, prevMonthLastDay - i + 1), 
        isCurrentMonth: false 
      });
    }

    // Days from current month
    for (let i = 1; i <= totalDays; i++) {
      grid.push({ 
        date: new Date(year, month, i), 
        isCurrentMonth: true 
      });
    }
    
    // Days from next month
    const gridEndIndex = grid.length;
    for (let i = 1; grid.length < 42; i++) {
        grid.push({ 
            date: new Date(year, month + 1, i), 
            isCurrentMonth: false 
        });
    }
    
    // Chunk into weeks
    const weeks: CalendarDay[][] = [];
    for (let i = 0; i < grid.length; i += 7) {
        weeks.push(grid.slice(i, i + 7));
    }
    return weeks;
  });
  
  previousMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    this.currentDate.update(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  
  goToToday() {
    this.currentDate.set(new Date());
  }

  selectDay(day: CalendarDay) {
    if (day.isCurrentMonth) {
        this.daySelected.emit(day.date);
    }
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  isSelected(date: Date): boolean {
    const selected = this.selectedDate();
    if (!selected || !date) return false;
    return date.getDate() === selected.getDate() &&
           date.getMonth() === selected.getMonth() &&
           date.getFullYear() === selected.getFullYear();
  }

  getDayData(date: Date): DayData | undefined {
    const calendar = this.activeCalendar();
    const key = this.formatDateToKey(date);
    return calendar.data[key];
  }
}
