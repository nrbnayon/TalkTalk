"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.errorLogger = void 0;
const path_1 = __importDefault(require("path"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const myFormat = printf(({ level, message, label, timestamp, }) => {
    const date = new Date(timestamp);
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${date.toDateString()} ${hour}:${minutes}:${seconds} [${label}] ${level}: ${message}`;
});
const logger = createLogger({
    level: 'info',
    format: combine(label({ label: 'BarBar' }), timestamp(), myFormat),
    transports: [
        new transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'winston', 'success', '%DATE%-success.log'),
            datePattern: 'DD-MM-YYYY-HH',
            maxSize: '20m',
            maxFiles: '1d',
        }),
    ],
});
exports.logger = logger;
const errorLogger = createLogger({
    level: 'error',
    format: combine(label({ label: 'BarBar' }), timestamp(), myFormat),
    transports: [
        new transports.Console(),
        new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(process.cwd(), 'winston', 'error', '%DATE%-error.log'),
            datePattern: 'DD-MM-YYYY-HH',
            maxSize: '20m',
            maxFiles: '1d',
        }),
    ],
});
exports.errorLogger = errorLogger;
