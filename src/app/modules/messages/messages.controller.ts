// src\app\modules\messages\messages.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { MessageService } from './messages.service';
import { IMessageFilters } from './messages.interface';

const getAllMessages = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const result = await MessageService.getAllMessages(chatId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: result,
  });
});

const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { content, chatId, replyToId } = req.body;
  console.log('Get message from chat::', req.body);
  const files = req.files as Express.Multer.File[];

  const result = await MessageService.sendMessage(
    req.user.id,
    content,
    chatId,
    files || [], // Pass files array
    undefined, // Default messageType
    replyToId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message sent successfully',
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
  const { messageId } = req.params;
  const { chatId } = req.body;

  const result = await MessageService.togglePinMessage(
    messageId,
    req.user.id,
    chatId
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Message pin status toggled successfully',
    data: result,
  });
});

const toggleReaction = catchAsync(async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  console.log('Getting reaction:::', emoji, messageId);

  const result = await MessageService.toggleReaction(
    messageId,
    req.user.id,
    emoji
  );

  console.log('Getting reaction result:::', result);

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
