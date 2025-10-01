import { Injectable, signal, computed, effect } from '@angular/core';
import { Calendar, DayData, CalendarColor } from '../models/calendar.model';

const STORAGE_KEY = 'customCalendars';

// Predefined beautiful color palettes from Tailwind
export const COLOR_PALETTES: CalendarColor[] = [
  { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500', ring: 'ring-blue-500' },
  { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500', ring: 'ring-emerald-500' },
  { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500', ring: 'ring-purple-500' },
  { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500', ring: 'ring-amber-500' },
  { bg: 'bg-red-500', text: 'text-red-400', border: 'border-red-500', ring: 'ring-red-500' },
  { bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500', ring: 'ring-pink-500' },
  { bg: 'bg-indigo-500', text: 'text-indigo-400', border: 'border-indigo-500', ring: 'ring-indigo-500' },
  { bg: 'bg-teal-500', text: 'text-teal-400', border: 'border-teal-500', ring: 'ring-teal-500' },
  { bg: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500', ring: 'ring-orange-500' },
];

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  calendars = signal<Calendar[]>([]);
  activeCalendarId = signal<string | null>(null);

  activeCalendar = computed(() => {
    const id = this.activeCalendarId();
    const cals = this.calendars();
    return cals.find(cal => cal.id === id);
  });

  constructor() {
    this.loadFromStorage();
    effect(() => {
      this.saveToStorage(this.calendars());
    });
  }

  private loadFromStorage() {
    try {
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            this.calendars.set(JSON.parse(storedData));
        } else {
            this.createCalendar('Gimnasio'); // Create a default if none exist
        }

        if (this.calendars().length > 0 && !this.activeCalendarId()) {
            this.activeCalendarId.set(this.calendars()[0].id);
        }
    } catch (e) {
        console.error("Error loading calendars from localStorage", e);
        this.calendars.set([]);
    }
  }

  private saveToStorage(calendars: Calendar[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(calendars));
    } catch (e) {
        console.error("Error saving calendars to localStorage", e);
    }
  }
  
  private formatDateToKey(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  createCalendar(name: string) {
    if (!name.trim()) return;

    const usedColorBgs = new Set(this.calendars().map(c => c.color.bg));
    const availableColors = COLOR_PALETTES.filter(p => !usedColorBgs.has(p.bg));
    
    let color: CalendarColor;
    if (availableColors.length > 0) {
        color = availableColors[Math.floor(Math.random() * availableColors.length)];
    } else {
        // Fallback if all colors are used
        color = COLOR_PALETTES[this.calendars().length % COLOR_PALETTES.length];
    }

    const newCalendar: Calendar = {
      id: crypto.randomUUID(),
      name: name.trim(),
      color: color,
      data: {},
    };

    this.calendars.update(cals => [...cals, newCalendar]);
    if (!this.activeCalendarId()) {
      this.activeCalendarId.set(newCalendar.id);
    }
  }

  selectCalendar(id: string) {
    this.activeCalendarId.set(id);
  }
  
  renameCalendar(id: string, newName: string) {
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    this.calendars.update(cals =>
      cals.map(cal =>
        cal.id === id ? { ...cal, name: trimmedName } : cal
      )
    );
  }
  
  deleteCalendar(id: string) {
    const wasActive = this.activeCalendarId() === id;
    this.calendars.update(cals => cals.filter(cal => cal.id !== id));

    if (wasActive) {
      if (this.calendars().length > 0) {
        this.activeCalendarId.set(this.calendars()[0].id);
      } else {
        this.activeCalendarId.set(null);
      }
    }
  }

  updateDay(date: Date, newDayData: Partial<DayData>) {
    const calId = this.activeCalendarId();
    if (!calId) return;

    const dateKey = this.formatDateToKey(date);

    this.calendars.update(cals => 
      cals.map(cal => {
        if (cal.id === calId) {
          const existingData = cal.data[dateKey] || { marked: false, note: '' };
          const updatedData = { ...existingData, ...newDayData };

          // If the day becomes default (unmarked and no note), remove it to save space
          if (!updatedData.marked && updatedData.note.trim() === '') {
             const newData = { ...cal.data };
             delete newData[dateKey];
             return { ...cal, data: newData };
          } else {
             return {
                ...cal,
                data: {
                  ...cal.data,
                  [dateKey]: updatedData,
                },
             };
          }
        }
        return cal;
      })
    );
  }

  getDayData(date: Date): DayData | undefined {
    const cal = this.activeCalendar();
    if (!cal) return undefined;
    const dateKey = this.formatDateToKey(date);
    return cal.data[dateKey];
  }

  changeCalendarColor(id: string, colorIndex: number) {
    if (colorIndex < 0 || colorIndex >= COLOR_PALETTES.length) return;

    const newColor = COLOR_PALETTES[colorIndex];

    this.calendars.update(cals =>
      cals.map(cal =>
        cal.id === id ? { ...cal, color: newColor } : cal
      )
    );
  }
}