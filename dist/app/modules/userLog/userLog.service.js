"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLogService = void 0;
const axios_1 = __importDefault(require("axios"));
const ua_parser_js_1 = require("ua-parser-js");
const mongoose_1 = require("mongoose");
const userLog_model_1 = require("./userLog.model");
const logger_1 = require("../../../shared/logger");
const createLoginLog = (req, userId, email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userAgent = req.headers['user-agent'] || req.headers['user-agent'] || '';
        const parser = new ua_parser_js_1.UAParser(userAgent);
        const browserInfo = parser.getBrowser();
        const osInfo = parser.getOS();
        const deviceInfo = parser.getDevice();
        const ip = ((_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.toString().split(',')[0]) ||
            ((_b = req.socket.remoteAddress) === null || _b === void 0 ? void 0 : _b.replace('::ffff:', '')) ||
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
        const existingLog = yield userLog_model_1.UserLog.findOne({
            userId,
            status: 'active',
            'location.ip': ip,
            device: deviceString,
        });
        if (existingLog) {
            existingLog.loginTime = new Date();
            yield existingLog.save();
            logger_1.logger.info(`Existing login log updated - UserID: ${userId}, IP: ${ip}, Device: ${deviceString}`);
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
                const geoResponse = yield axios_1.default.get(`http://ip-api.com/json/${ip}`);
                locationData = geoResponse.data;
            }
            catch (error) {
                logger_1.logger.error('Error fetching location data:', error);
            }
        }
        const logData = {
            userId,
            email,
            device: deviceString || 'Unknown Device',
            browser: `${browserInfo.name || 'Unknown'} ${browserInfo.version || ''}`.trim(),
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
        const newLog = yield userLog_model_1.UserLog.create(logData);
        logger_1.logger.info(`New user login logged - UserID: ${userId}, IP: ${ip}, Device: ${deviceString}`);
        return newLog;
    }
    catch (error) {
        logger_1.logger.error('Error creating login log:', error);
        throw error;
    }
});
const updateLogoutTime = (userId, res, logId, deviceInfo) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!userId) {
            throw new Error('userId is required');
        }
        const query = { userId, status: 'active' };
        logger_1.logger.debug('Logout attempt', { userId, logId, deviceInfo });
        if (logId) {
            if (!mongoose_1.Types.ObjectId.isValid(logId)) {
                throw new Error('Invalid logId format');
            }
            query._id = new mongoose_1.Types.ObjectId(logId);
        }
        else if (deviceInfo) {
            const parser = new ua_parser_js_1.UAParser(deviceInfo.userAgent);
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
        const result = yield userLog_model_1.UserLog.updateMany(query, update);
        if (result.modifiedCount > 0) {
            logger_1.logger.info(`User's sessions logged out - Count: ${result.modifiedCount}`);
            if ((logId && userId) || deviceInfo) {
                if (logId) {
                    const deletedLog = yield userLog_model_1.UserLog.findOneAndDelete({
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
                    sameSite: 'strict',
                    path: '/',
                };
                res.clearCookie('accessToken', cookieOptions);
                res.clearCookie('refreshToken', cookieOptions);
            }
        }
        logger_1.logger.info(`User logout logged - UserID: ${userId}${logId
            ? `, LogID: ${logId}`
            : deviceInfo
                ? ', Specific device'
                : ' (all sessions)'}`);
        return result;
    }
    catch (error) {
        logger_1.logger.error('Error updating logout time:', {
            userId,
            logId,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
    }
});
const getUserLogs = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield userLog_model_1.UserLog.find({ userId }).sort({ loginTime: -1 }).lean();
        return logs;
    }
    catch (error) {
        logger_1.logger.error('Error fetching user logs:', error);
        throw error;
    }
});
const getActiveSessions = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const logs = yield userLog_model_1.UserLog.find({
            userId,
            status: 'active',
        })
            .sort({ loginTime: -1 })
            .lean();
        return logs;
    }
    catch (error) {
        logger_1.logger.error('Error fetching active sessions:', error);
        throw error;
    }
});
exports.UserLogService = {
    createLoginLog,
    updateLogoutTime,
    getUserLogs,
    getActiveSessions,
};
