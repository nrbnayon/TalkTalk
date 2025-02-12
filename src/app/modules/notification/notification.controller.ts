
// src/app/modules/notification/notification.controller.ts
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { NotificationService } from './notification.service';
import {
  notificationFilterableFields,
  paginationFields,
} from './notification.constant';
import pick from '../../../shared/pick';

const getUserNotifications = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const paginationOptions = pick(req.query, paginationFields);

  const result = await NotificationService.getUserNotifications(
    user,
    paginationOptions
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'User notifications retrieved successfully',
    data: result,
  });
});

const getHostNotifications = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const filters = pick(req.query, notificationFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await NotificationService.getHostNotifications(
    userId,
    filters,
    paginationOptions
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Host notifications retrieved successfully',
    data: result,
  });
});

const getAdminNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const filters = pick(req.query, notificationFilterableFields);
    const paginationOptions = pick(req.query, paginationFields);

    const result = await NotificationService.getAdminNotifications(
      filters,
      paginationOptions
    );

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin notifications retrieved successfully',
      data: result,
    });
  }
);

const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await NotificationService.markAsRead(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Notifications marked as read successfully',
    data: result,
  });
});

const markAdminNotificationsAsRead = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.markAdminNotificationsAsRead();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Admin notifications marked as read successfully',
      data: result,
    });
  }
);

const deleteAllNotifications = catchAsync(
  async (req: Request, res: Response) => {
    const result = await NotificationService.deleteAllNotifications();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'All notifications deleted successfully',
      data: result,
    });
  }
);

export const NotificationController = {
  getUserNotifications,
  getHostNotifications,
  getAdminNotifications,
  markAsRead,
  markAdminNotificationsAsRead,
  deleteAllNotifications,
};

