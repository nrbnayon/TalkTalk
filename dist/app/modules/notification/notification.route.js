"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRoutes = void 0;
// src/app/modules/notification/notification.route.ts
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const user_1 = require("../../../enums/user");
const notification_controller_1 = require("./notification.controller");
const router = express_1.default.Router();
// Admin routes
router.get('/admin', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), notification_controller_1.NotificationController.getAdminNotifications);
router.patch('/admin/mark-as-read', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), notification_controller_1.NotificationController.markAdminNotificationsAsRead);
router.delete('/delete-all', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), notification_controller_1.NotificationController.deleteAllNotifications);
// User routes
router.get('/user', (0, auth_1.default)(user_1.USER_ROLES.USER), notification_controller_1.NotificationController.getUserNotifications);
router.patch('/user/mark-as-read', (0, auth_1.default)(user_1.USER_ROLES.USER), notification_controller_1.NotificationController.markAsRead);
// Host routes
router.get('/host', (0, auth_1.default)(user_1.USER_ROLES.HOST), notification_controller_1.NotificationController.getHostNotifications);
router.patch('/host/mark-as-read', (0, auth_1.default)(user_1.USER_ROLES.HOST), notification_controller_1.NotificationController.markAsRead);
exports.NotificationRoutes = router;
