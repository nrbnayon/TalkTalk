import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import { UserLogService } from './userLog.service';
import sendResponse from '../../../shared/sendResponse';
import { UserLog } from './userLog.model';

const getUserLogs = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await UserLogService.getUserLogs(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'User logs retrieved successfully',
    data: result,
  });
});

const getActiveSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const result = await UserLogService.getActiveSessions(userId);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Active sessions retrieved successfully',
    data: result,
  });
});

const logoutSession = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { sessionId } = req.params;

  const currentSessionLog = await UserLog.findOne({
    _id: sessionId,
    userId,
    status: 'active',
  });

  const currentUserAgent = req.headers['user-agent'];
  const isCurrentSession = currentSessionLog?.browser?.includes(
    currentUserAgent || ''
  );

  await UserLogService.updateLogoutTime(
    userId,
    res,
    isCurrentSession ? sessionId : sessionId
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Session logged out successfully',
    data: null,
  });
});

const logoutAllSessions = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await UserLogService.updateLogoutTime(userId, res);
  console.log('result6555', result);

  if (result?.acknowledged) {
    // Delete all user logs that are active (or based on your needs)
    const deleteResult = await UserLog.deleteMany({ userId: userId });
  } else {
    return res.status(500).json({
      success: false,
      message: 'Failed to Logging out all sessions, try again later',
    });
  }

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'All sessions logged out successfully',
    data: null,
  });
});

export const UserLogController = {
  getUserLogs,
  getActiveSessions,
  logoutSession,
  logoutAllSessions,
};
