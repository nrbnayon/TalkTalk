// src\app\modules\notification\notification.interface.ts
import { Model, Types } from 'mongoose';

export type NotificationType =
  | 'ADMIN'
  | 'HOST'
  | 'USER'
  | 'PAYMENT'
  | 'REFUND'
  | 'SERVICE_REQUEST'
  | 'SERVICE_ACCEPTED'
  | 'SERVICE_REJECTED'
  | 'SERVICE_COMPLETED'
  | 'SERVICE_CANCELED'
  | 'REVIEW'
  | 'ORDER';

export interface INotification {
  message: string;
  receiver?: Types.ObjectId;
  read: boolean;
  type: NotificationType;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationFilters {
  searchTerm?: string;
  type?: NotificationType;
  read?: boolean;
  startDate?: Date;
  endDate?: Date;
  receiver?: string;
}

export type NotificationModel = Model<INotification>;
