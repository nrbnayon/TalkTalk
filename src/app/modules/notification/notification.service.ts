// // src\app\modules\notification\notification.service.ts
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Notification } from './notification.model';
import { INotification, INotificationFilters } from './notification.interface';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';

const getUserNotifications = async (
  user: JwtPayload,
  paginationOptions: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const result = await Notification.find({ receiver: user.id })
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Notification.countDocuments({ receiver: user.id });
  const unreadCount = await Notification.countDocuments({
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
};

const markAsRead = async (
  user: JwtPayload
): Promise<{ modifiedCount: number }> => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { read: true }
  );

  return { modifiedCount: result.modifiedCount };
};

const getHostNotifications = async (
  userId: string,
  filters: INotificationFilters,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, read, startDate, endDate } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  // Define query: Match receiver to userId and type to "HOST"
  const query: Record<string, any> = { receiver: userId, type: 'HOST' };

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
  const result = await Notification.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  // Count total and unread notifications
  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    ...query,
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
};


const getAdminNotifications = async (
  filters: INotificationFilters,
  paginationOptions: IPaginationOptions
) => {
  const { searchTerm, type, read, startDate, endDate } = filters;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  const query: Record<string, any> = { type: 'ADMIN' };

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

  const result = await Notification.find(query)
    .sort({ [sortBy]: sortOrder })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({
    ...query,
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
};

const markAdminNotificationsAsRead = async (): Promise<{
  modifiedCount: number;
}> => {
  const result = await Notification.updateMany(
    { type: 'ADMIN', read: false },
    { read: true }
  );

  return { modifiedCount: result.modifiedCount };
};

const deleteAllNotifications = async (): Promise<{ deletedCount: number }> => {
  const result = await Notification.deleteMany({ type: 'ADMIN' });
  return { deletedCount: result.deletedCount };
};

const createNotification = async (
  payload: Partial<INotification>
): Promise<INotification> => {
  if (!payload.receiver || !payload.message || !payload.type) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Receiver, message and type are required'
    );
  }

  const result = await Notification.create(payload);
  return result;
};

const getNotificationById = async (
  id: string
): Promise<INotification | null> => {
  const notification = await Notification.findById(id).lean();
  return notification;
};

export const NotificationService = {
  getUserNotifications,
  markAsRead,
  getAdminNotifications,
  markAdminNotificationsAsRead,
  deleteAllNotifications,
  createNotification,
  getNotificationById,
  getHostNotifications,
};

