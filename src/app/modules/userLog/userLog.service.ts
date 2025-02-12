import { Request, Response } from 'express';
import axios from 'axios';
import { UAParser } from 'ua-parser-js';
import { Types } from 'mongoose';
import { IUserLog } from './userLog.interface';
import { UserLog } from './userLog.model';
import { logger } from '../../../shared/logger';

interface DeviceInfo {
  userAgent: string;
  ip: string;
}

const createLoginLog = async (req: Request, userId: string, email: string) => {
  try {
    const userAgent =
      req.headers['user-agent'] || req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);

    const browserInfo = parser.getBrowser();
    const osInfo = parser.getOS();
    const deviceInfo = parser.getDevice();

    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress?.replace('::ffff:', '') ||
      'unknown';

    const deviceString = [
      deviceInfo.vendor,
      deviceInfo.model,
      deviceInfo.type || req.headers['user-agent'] || 'Desktop',
      osInfo.name,
      osInfo.version,
    ]
      .filter(Boolean)
      .join(' ');

    // Check for an existing active log for the same device and IP
    const existingLog = await UserLog.findOne({
      userId,
      status: 'active',
      'location.ip': ip,
      device: deviceString,
    });

    if (existingLog) {
      existingLog.loginTime = new Date();
      await existingLog.save();
      logger.info(
        `Existing login log updated - UserID: ${userId}, IP: ${ip}, Device: ${deviceString}`
      );
      return existingLog;
    }

    let locationData = {
      city: 'Unknown',
      country: 'Unknown',
      zip: 'Unknown',
      region: 'Unknown',
      regionName: 'Unknown',
      lat: 0,
      lon: 0,
    };
    if (ip !== 'localhost' && ip !== '127.0.0.1') {
      try {
        const geoResponse = await axios.get(`http://ip-api.com/json/${ip}`);
        locationData = geoResponse.data;
      } catch (error) {
        logger.error('Error fetching location data:', error);
      }
    }

    const logData: Partial<IUserLog> = {
      userId,
      email,
      device: deviceString || 'Unknown Device',
      browser: `${browserInfo.name || 'Unknown'} ${
        browserInfo.version || ''
      }`.trim(),
      location: {
        ip,
        zip: locationData.zip,
        region: locationData.region,
        regionName: locationData.regionName,
        city: locationData.city,
        country: locationData.country,
        latitude: locationData.lat,
        longitude: locationData.lon,
      },
      loginTime: new Date(),
      status: 'active',
    };

    const newLog = await UserLog.create(logData);
    logger.info(
      `New user login logged - UserID: ${userId}, IP: ${ip}, Device: ${deviceString}`
    );
    return newLog;
  } catch (error) {
    logger.error('Error creating login log:', error);
    throw error;
  }
};

const updateLogoutTime = async (
  userId: string,
  res: Response,
  logId?: string,
  deviceInfo?: DeviceInfo
) => {
  try {
    if (!userId) {
      throw new Error('userId is required');
    }

    const query: Record<string, any> = { userId, status: 'active' };
    logger.debug('Logout attempt', { userId, logId, deviceInfo });

    if (logId) {
      if (!Types.ObjectId.isValid(logId)) {
        throw new Error('Invalid logId format');
      }
      query._id = new Types.ObjectId(logId);
    } else if (deviceInfo) {
      const parser = new UAParser(deviceInfo.userAgent);
      const osInfo = parser.getOS();
      const deviceInfoParsed = parser.getDevice();

      const deviceString = [
        deviceInfoParsed.vendor,
        deviceInfoParsed.model,
        deviceInfoParsed.type || 'Desktop',
        osInfo.name,
        osInfo.version,
      ]
        .filter(Boolean)
        .join(' ');

      query['location.ip'] = deviceInfo.ip;
      query.device = deviceString;
    }

    const update = {
      $set: {
        logoutTime: new Date(),
        status: 'logged_out',
      },
    };

    const result = await UserLog.updateMany(query, update);

    if (result.modifiedCount > 0) {
      logger.info(
        `User's sessions logged out - Count: ${result.modifiedCount}`
      );

      if ((logId && userId) || deviceInfo) {
        if (logId) {
          const deletedLog = await UserLog.findOneAndDelete({
            _id: logId,
            userId,
            status: 'logged_out',
          });

          if (!deletedLog) {
            throw new Error('User not authorized to logout this session');
          }
        }

        const cookieOptions = {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict' as const,
          path: '/',
        };

        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
      }
    }

    logger.info(
      `User logout logged - UserID: ${userId}${
        logId
          ? `, LogID: ${logId}`
          : deviceInfo
          ? ', Specific device'
          : ' (all sessions)'
      }`
    );
    return result;
  } catch (error) {
    logger.error('Error updating logout time:', {
      userId,
      logId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

const getUserLogs = async (userId: string) => {
  try {
    const logs = await UserLog.find({ userId }).sort({ loginTime: -1 }).lean();
    return logs;
  } catch (error) {
    logger.error('Error fetching user logs:', error);
    throw error;
  }
};

const getActiveSessions = async (userId: string) => {
  try {
    const logs = await UserLog.find({
      userId,
      status: 'active',
    })
      .sort({ loginTime: -1 })
      .lean();
    return logs;
  } catch (error) {
    logger.error('Error fetching active sessions:', error);
    throw error;
  }
};

export const UserLogService = {
  createLoginLog,
  updateLogoutTime,
  getUserLogs,
  getActiveSessions,
};
