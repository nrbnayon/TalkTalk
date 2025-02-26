"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeUtils = void 0;
// src/utils/timeConverter.ts
exports.timeUtils = {
    convertTo24Hour: (time12h) => {
        const [time, modifier] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        let hours24 = parseInt(hours, 10);
        if (hours24 === 12) {
            hours24 = modifier === 'PM' ? 12 : 0;
        }
        else if (modifier === 'PM') {
            hours24 = hours24 + 12;
        }
        return `${hours24.toString().padStart(2, '0')}:${minutes}`;
    },
    convertTo12Hour: (time24h) => {
        const [hours24, minutes] = time24h.split(':');
        const hours = parseInt(hours24, 10);
        const modifier = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes} ${modifier}`;
    },
    isTimeWithinRange: (time, start, end) => {
        return time >= start && time < end;
    },
};
