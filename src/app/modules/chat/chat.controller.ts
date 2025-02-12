// src\app\modules\chat\chat.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ChatService } from './chat.service';

const accessChat = catchAsync(async (req: Request, res: Response) => {
  console.log('Chat access Controller::', req.body.userId, req.user.id)
  const result = await ChatService.accessChat(req.body.userId, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat accessed successfully',
    data: result,
  });
});

const getAllChats = catchAsync(async (req: Request, res: Response) => {
  const result = await ChatService.getAllChats(req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chats retrieved successfully',
    data: result,
  });
});

const createGroupChat = catchAsync(async (req: Request, res: Response) => {
  const { name, users } = req.body;
  const result = await ChatService.createGroupChat(name, users, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Group chat created successfully',
    data: result,
  });
});

const renameGroup = catchAsync(async (req: Request, res: Response) => {
  const { chatId, chatName } = req.body;
  const result = await ChatService.renameGroup(chatId, chatName, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Group renamed successfully',
    data: result,
  });
});

const removeFromGroup = catchAsync(async (req: Request, res: Response) => {
  const { chatId, userId } = req.body;
  const result = await ChatService.removeFromGroup(chatId, userId, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User removed from group successfully',
    data: result,
  });
});

const addToGroup = catchAsync(async (req: Request, res: Response) => {
  const { chatId, userId } = req.body;
  const result = await ChatService.addToGroup(chatId, userId, req.user.id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User added to group successfully',
    data: result,
  });
});

export const ChatController = {
  accessChat,
  getAllChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
};