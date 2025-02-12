// src\app\modules\user\user.controller.ts
import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const value = { ...req.body };
      const result = await UserService.createUserFromDb(value);
      sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message:
          'Please check your email to verify your account. We have sent you an OTP to complete the registration process.',
        data: result.email,
      });
    } catch (error) {
      if (error instanceof Error) {
        next(error);
      } else {
        next(new Error('An unknown error occurred'));
      }
    }
  }
);

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.setPassword(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Password set successfully. Now your account is fully activated',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const updateData = req.body;

    const result = await UserService.updateProfileToDB(user, updateData);

    console.log('User updated', result);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Profile updated successfully',
      data: result,
    });
  }
);

const getAllUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers(req.query);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User retrieved successfully',
    data: result,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getSingleUser(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User retrived successfully',
    data: result,
  });
});

const getOnlineUsers = catchAsync(async (req: Request, res: Response) => {
  // Replace console.log with a logging library in production
  console.log('Controller: Retrieving online users');

  const onlineUsers = await UserService.getOnlineUsers();

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `Online users retrieved successfully. Total: ${onlineUsers.length}`,
    data: onlineUsers,
  });
});

const updateOnlineStatus = catchAsync(async (req: Request, res: Response) => {
  // console.log('first update', req.user);
  // console.log('user updated line 112', req.body);
  const { userId, status } = req.body;
  // Input validation
  if (!userId || typeof status !== 'boolean') {
    return sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid userId or status. Please provide valid inputs.',
    });
  }

  // Replace console.log with a logging library in production
  console.log(`Controller: Updating user ${userId} online status to ${status}`);

  const updatedUser = await UserService.updateUserOnlineStatus(userId, status);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: `User online status updated successfully to ${
      status ? 'online' : 'offline'
    }`,
    data: updatedUser,
  });
});

export const UserController = {
  createUser,
  setPassword,
  getUserProfile,
  updateProfile,
  getAllUser,
  getSingleUser,
  getOnlineUsers,
  updateOnlineStatus,
};
