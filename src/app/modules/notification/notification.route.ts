// src/app/modules/notification/notification.route.ts
import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';

const router = express.Router();

// Admin routes
router.get(
  '/admin',
  auth(USER_ROLES.ADMIN),
  NotificationController.getAdminNotifications
);

router.patch(
  '/admin/mark-as-read',
  auth(USER_ROLES.ADMIN),
  NotificationController.markAdminNotificationsAsRead
);

router.delete(
  '/delete-all',
  auth(USER_ROLES.ADMIN),
  NotificationController.deleteAllNotifications
);

// User routes
router.get(
  '/user',
  auth(USER_ROLES.USER),
  NotificationController.getUserNotifications
);

router.patch(
  '/user/mark-as-read',
  auth(USER_ROLES.USER),
  NotificationController.markAsRead
);

// Host routes
router.get(
  '/host',
  auth(USER_ROLES.HOST),
  NotificationController.getHostNotifications
);

router.patch(
  '/host/mark-as-read',
  auth(USER_ROLES.HOST),
  NotificationController.markAsRead
);

export const NotificationRoutes = router;
