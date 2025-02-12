// src\helpers\notificationHelper.ts
import { INotification } from '../app/modules/notification/notification.interface';
import { Notification } from '../app/modules/notification/notification.model';
import { logger } from '../shared/logger';

enum NotificationType {
  ADMIN = 'ADMIN',
  HOST = 'HOST',
  USER = 'USER',
  PAYMENT = 'PAYMENT',
}


export const sendNotifications = async (data: any): Promise<INotification> => {
  try {
    const result = await Notification.create(data);

    const socketIo = (global as any).io;
    if (!socketIo) {
      logger.error('Socket.io instance not found');
      return result;
    }

    const channel =
      data.type in NotificationType
        ? `get-notification::${data.type}`
        : `get-notification::${data.receiver}`;

    socketIo.emit(channel, result);
    logger.info(`Notification sent: ${JSON.stringify(result)}`);

    return result;
  } catch (error) {
    logger.error(`Failed to send notification: ${error}`);
    throw error;
  }
};

// export const sendNotifications = async (data: any): Promise<INotification> => {
//   const result = await Notification.create(data);

//   //@ts-ignore
//   const socketIo = global.io;

//   if (
//     data?.type === 'ADMIN' ||
//     data?.type === 'HOST' ||
//     data?.type === 'USER' ||
//     data?.type === 'PAYMENT'
//   ) {
//     socketIo.emit(`get-notification::${data?.type}`, result);
//   } else {
//     socketIo.emit(`get-notification::${data?.receiver}`, result);
//   }

//   logger.info(`Notification sent: ${JSON.stringify(result)}`);

//   return result;
// };