// src/utils/timeConverter.ts
export const timeUtils = {
  convertTo24Hour: (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');

    let hours24 = parseInt(hours, 10);

    if (hours24 === 12) {
      hours24 = modifier === 'PM' ? 12 : 0;
    } else if (modifier === 'PM') {
      hours24 = hours24 + 12;
    }

    return `${hours24.toString().padStart(2, '0')}:${minutes}`;
  },

  convertTo12Hour: (time24h: string): string => {
    const [hours24, minutes] = time24h.split(':');
    const hours = parseInt(hours24, 10);
    const modifier = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes} ${modifier}`;
  },

  isTimeWithinRange: (time: string, start: string, end: string): boolean => {
    return time >= start && time < end;
  },
};
