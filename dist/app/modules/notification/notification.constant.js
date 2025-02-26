"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationFields = exports.notificationSearchableFields = exports.notificationFilterableFields = void 0;
// src\app\modules\notification\notification.constant.ts
exports.notificationFilterableFields = [
    'searchTerm',
    'type',
    'read',
    'startDate',
    'endDate',
    'receiver',
];
exports.notificationSearchableFields = ['message'];
exports.paginationFields = ['page', 'limit', 'sortBy', 'sortOrder'];
