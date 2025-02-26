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
exports.NotificationController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const notification_service_1 = require("./notification.service");
const notification_constant_1 = require("./notification.constant");
const pick_1 = __importDefault(require("../../../shared/pick"));
const getUserNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const paginationOptions = (0, pick_1.default)(req.query, notification_constant_1.paginationFields);
    const result = yield notification_service_1.NotificationService.getUserNotifications(user, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'User notifications retrieved successfully',
        data: result,
    });
}));
const getHostNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const filters = (0, pick_1.default)(req.query, notification_constant_1.notificationFilterableFields);
    const paginationOptions = (0, pick_1.default)(req.query, notification_constant_1.paginationFields);
    const result = yield notification_service_1.NotificationService.getHostNotifications(userId, filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Host notifications retrieved successfully',
        data: result,
    });
}));
const getAdminNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = (0, pick_1.default)(req.query, notification_constant_1.notificationFilterableFields);
    const paginationOptions = (0, pick_1.default)(req.query, notification_constant_1.paginationFields);
    const result = yield notification_service_1.NotificationService.getAdminNotifications(filters, paginationOptions);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Admin notifications retrieved successfully',
        data: result,
    });
}));
const markAsRead = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const result = yield notification_service_1.NotificationService.markAsRead(user);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Notifications marked as read successfully',
        data: result,
    });
}));
const markAdminNotificationsAsRead = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_service_1.NotificationService.markAdminNotificationsAsRead();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'Admin notifications marked as read successfully',
        data: result,
    });
}));
const deleteAllNotifications = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_service_1.NotificationService.deleteAllNotifications();
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: 'All notifications deleted successfully',
        data: result,
    });
}));
exports.NotificationController = {
    getUserNotifications,
    getHostNotifications,
    getAdminNotifications,
    markAsRead,
    markAdminNotificationsAsRead,
    deleteAllNotifications,
};
