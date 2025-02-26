"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLogRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const userLog_controller_1 = require("./userLog.controller");
const user_1 = require("../../../enums/user");
const router = express_1.default.Router();
router.get('/logs', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), userLog_controller_1.UserLogController.getUserLogs);
router.get('/active-sessions', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), userLog_controller_1.UserLogController.getActiveSessions);
router.post('/logout/:sessionId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), userLog_controller_1.UserLogController.logoutSession);
router.post('/logout-all', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), userLog_controller_1.UserLogController.logoutAllSessions);
exports.UserLogRoutes = router;
