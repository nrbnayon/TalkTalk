"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const notification_model_1 = require("./notification.model");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const getUserNotifications = (user, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const result = yield notification_model_1.Notification.find({ receiver: user.id })
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = yield notification_model_1.Notification.countDocuments({ receiver: user.id });
    const unreadCount = yield notification_model_1.Notification.countDocuments({
        receiver: user.id,
        read: false,
    });
    return {
        meta: {
            page,
            limit,
            total,
            unreadCount,
        },
        data: result,
    };
});
const markAsRead = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ receiver: user.id, read: false }, { read: true });
    return { modifiedCount: result.modifiedCount };
});
const getHostNotifications = (userId, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, read, startDate, endDate } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    // Define query: Match receiver to userId and type to "HOST"
    const query = { receiver: userId, type: 'HOST' };
    if (searchTerm) {
        query.message = { $regex: searchTerm, $options: 'i' };
    }
    if (typeof read === 'boolean') {
        query.read = read;
    }
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }
    // Retrieve matching notifications
    const result = yield notification_model_1.Notification.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    // Count total and unread notifications
    const total = yield notification_model_1.Notification.countDocuments(query);
    const unreadCount = yield notification_model_1.Notification.countDocuments(Object.assign(Object.assign({}, query), { read: false }));
    return {
        meta: {
            page,
            limit,
            total,
            unreadCount,
        },
        data: result,
    };
});
const getAdminNotifications = (filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, type, read, startDate, endDate } = filters;
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    const query = { type: 'ADMIN' };
    if (searchTerm) {
        query.message = { $regex: searchTerm, $options: 'i' };
    }
    if (type) {
        query.type = type;
    }
    if (typeof read === 'boolean') {
        query.read = read;
    }
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }
    const result = yield notification_model_1.Notification.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean();
    const total = yield notification_model_1.Notification.countDocuments(query);
    const unreadCount = yield notification_model_1.Notification.countDocuments(Object.assign(Object.assign({}, query), { read: false }));
    return {
        meta: {
            page,
            limit,
            total,
            unreadCount,
        },
        data: result,
    };
});
const markAdminNotificationsAsRead = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.updateMany({ type: 'ADMIN', read: false }, { read: true });
    return { modifiedCount: result.modifiedCount };
});
const deleteAllNotifications = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.deleteMany({ type: 'ADMIN' });
    return { deletedCount: result.deletedCount };
});
const createNotification = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.receiver || !payload.message || !payload.type) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Receiver, message and type are required');
    }
    const result = yield notification_model_1.Notification.create(payload);
    return result;
});
const getNotificationById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield notification_model_1.Notification.findById(id).lean();
    return notification;
});
exports.NotificationService = {
    getUserNotifications,
    markAsRead,
    getAdminNotifications,
    markAdminNotificationsAsRead,
    deleteAllNotifications,
    createNotification,
    getNotificationById,
    getHostNotifications,
};
