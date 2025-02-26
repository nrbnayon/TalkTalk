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
exports.UserLogController = void 0;
const http_status_codes_1 = require("http-status-codes");
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const userLog_service_1 = require("./userLog.service");
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const userLog_model_1 = require("./userLog.model");
const getUserLogs = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield userLog_service_1.UserLogService.getUserLogs(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'User logs retrieved successfully',
        data: result,
    });
}));
const getActiveSessions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield userLog_service_1.UserLogService.getActiveSessions(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Active sessions retrieved successfully',
        data: result,
    });
}));
const logoutSession = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const { sessionId } = req.params;
    const currentSessionLog = yield userLog_model_1.UserLog.findOne({
        _id: sessionId,
        userId,
        status: 'active',
    });
    const currentUserAgent = req.headers['user-agent'];
    const isCurrentSession = (_b = currentSessionLog === null || currentSessionLog === void 0 ? void 0 : currentSessionLog.browser) === null || _b === void 0 ? void 0 : _b.includes(currentUserAgent || '');
    yield userLog_service_1.UserLogService.updateLogoutTime(userId, res, isCurrentSession ? sessionId : sessionId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'Session logged out successfully',
        data: null,
    });
}));
const logoutAllSessions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield userLog_service_1.UserLogService.updateLogoutTime(userId, res);
    console.log('result6555', result);
    if (result === null || result === void 0 ? void 0 : result.acknowledged) {
        // Delete all user logs that are active (or based on your needs)
        const deleteResult = yield userLog_model_1.UserLog.deleteMany({ userId: userId });
    }
    else {
        return res.status(500).json({
            success: false,
            message: 'Failed to Logging out all sessions, try again later',
        });
    }
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_codes_1.StatusCodes.OK,
        message: 'All sessions logged out successfully',
        data: null,
    });
}));
exports.UserLogController = {
    getUserLogs,
    getActiveSessions,
    logoutSession,
    logoutAllSessions,
};
