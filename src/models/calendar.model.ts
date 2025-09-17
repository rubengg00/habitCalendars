
export interface DayData {
  marked: boolean;
  note: string;
}

export interface CalendarColor {
  bg: string;
  text: string;
  border: string;
  ring: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: CalendarColor;
  data: {
    [dateKey: string]: DayData; // key is 'YYYY-MM-DD'
  };
}
