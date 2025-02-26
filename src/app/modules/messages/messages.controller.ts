// src\app\modules\messages\messages.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { MessageService } from './messages.service';
import { IMessageFilters } from './messages.interface';
import { logger } from '../../../shared/logger';
import { paginationFields } from '../notification/notification.constant';
import pick from '../../../shared/pick';
import { console } from 'inspector/promises';

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  try {
    logger.info(`[MessageController] Sending message. Request data:`, {
      body: req.body,
      files: req.files ? Object.keys(req.files) : [],
      userId: req.user?.id,
    });

    const { content, chatId, replyToId } = req.body;
    const files = req.files as Record<string, Express.Multer.File[]>;

    const result = await MessageService.sendMessage({
      content,
      chatId,
      userId: req.user.id,
      replyToId,
      files,
    });

    logger.info(
      `[MessageController] Message created successfully. ID: ${result._id}`
    );

    // Get the io instance from app
    const io = req.app.get('io');
    if (io) {
      // Remove the chatId check since we already have it
      console.log(
        `[MessageController] Emitting socket event to chat: ${chatId}`
      );
      io.to(chatId).emit('message-received', result);
    } else {
      console.log(
        `[MessageController] Socket not available for real-time update`
      );
    }
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Message sent successfully',
      data: result,
    });
  } catch (error) {
    logger.error(`[MessageController] Error in sendMessage:`, error);
    throw error;
  }
});

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const userId = req.user.id;
  const paginationOptions = pick(req.query, paginationFields);

  logger.info(`[MessageController] Fetching messages for chat: ${chatId}`);

  const result = await MessageService.getAllMessagesFromDB(
    chatId,
    userId,
    paginationOptions
  );

  logger.info(
    `[MessageController] Retrieved ${result.messages?.length} messages`
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const editMessage = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { content } = req.body;

  const result = await MessageService.editMessage(
    messageId,
    req.user.id,
    content
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message edited successfully',
    data: result,
  });
});

const deleteMessage = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;

  const result = await MessageService.deleteMessage(messageId, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message deleted successfully',
    data: result,
  });
});

const togglePinMessage = catchAsync(async (req: Request, res: Response) => {
  try {
    logger.info('CONTROLLER STARTED - THIS SHOULD APPEAR');
    const { messageId } = req.params;
    const { chatId } = req.body;

    if (!chatId) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: 'Chat ID is required',
        data: null,
      });
    }

    logger.info(
      `[Controller] Toggling pin for message: ${messageId} in chat: ${chatId}`
    );

    // Toggle pin status via the service
    const result = await MessageService.togglePinMessage(
      messageId,
      req.user.id,
      chatId
    );

    // Detailed logging of the result
    logger.info(`[Controller] Service result: ${JSON.stringify(result)}`);

    // Emit a real-time update to all clients in the chat room
    const io = req.app.get('io');
    if (io) {
      logger.info(`[Controller] Got IO instance, emitting to chat: ${chatId}`);

      // Ensure pinnedBy is properly formatted
      const messageToEmit = {
        ...result,
        pinnedBy: result.pinnedBy
          ? {
              _id: result.pinnedBy._id || result.pinnedBy,
              name: result.pinnedBy.name || '',
              image: result.pinnedBy.image || '',
            }
          : null,
        pinnedAt: result.pinnedAt || new Date(),
      };

      logger.info('[Controller] Emitting message:', messageToEmit.pinnedBy);

      // Try direct emission to the room
      io.to(chatId).emit('message-updated', messageToEmit);
      logger.info('[Controller] Emission completed');
    } else {
      console.error('[Controller] IO instance not available!');
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Message pin status toggled successfully',
      data: result,
    });
  } catch (error) {
    console.error('[Controller] Error in togglePinMessage:', error);
    throw error; // Let catchAsync handle the error
  }
});

const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  console.log('Toggle reaction:', emoji, messageId);
  const result = await MessageService.toggleReaction(
    messageId,
    req.user.id,
    emoji
  );

  // Emit real-time update to all clients in the chat room
  const io = req.app.get('io');
  if (io && result.chat) {
    // Ensure chatId is a string even if populated
    const chatId =
      typeof result.chat === 'string'
        ? result.chat
        : result.chat._id?.toString() || result.chat.toString();
    io.to(chatId).emit('message-updated', result);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reaction toggled successfully',
    data: result,
  });
});

const markMessageAsRead = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;

  const result = await MessageService.markMessageAsRead(messageId, req.user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message marked as read successfully',
    data: result,
  });
});

const searchMessages = catchAsync(async (req: Request, res: Response) => {
  const filters: IMessageFilters = req.query;

  const result = await MessageService.searchMessages(filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const getUnseenMessageCount = catchAsync(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;

    const result = await MessageService.getUnseenMessageCount(
      chatId,
      req.user.id
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Unseen message count retrieved successfully',
      data: result,
    });
  }
);

export const MessageController = {
  getAllMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
  markMessageAsRead,
  searchMessages,
  getUnseenMessageCount,
};
