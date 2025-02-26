"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_route_1 = require("../app/modules/auth/auth.route");
const user_route_1 = require("../app/modules/user/user.route");
const userLog_route_1 = require("../app/modules/userLog/userLog.route");
const messages_route_1 = require("../app/modules/messages/messages.route");
const chat_route_1 = require("../app/modules/chat/chat.route");
const router = express_1.default.Router();
const apiRoutes = [
    { path: '/user', route: user_route_1.UserRoutes },
    { path: '/auth', route: auth_route_1.AuthRoutes },
    { path: '/device', route: userLog_route_1.UserLogRoutes },
    { path: '/messages', route: messages_route_1.MessageRoutes },
    { path: '/chat', route: chat_route_1.ChatRoutes },
];
apiRoutes.forEach(route => router.use(route.path, route.route));
exports.default = router;
