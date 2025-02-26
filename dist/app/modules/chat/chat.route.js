"use strict";
// src\app\modules\chat\chat.model.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const chat_controller_1 = require("./chat.controller");
const chat_validation_1 = require("./chat.validation");
const router = express_1.default.Router();
router.post('/new', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.accessChatZodSchema), chat_controller_1.ChatController.accessChat);
router.get('/', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), chat_controller_1.ChatController.getAllChats);
router.post('/group', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.createGroupChatZodSchema), chat_controller_1.ChatController.createGroupChat);
router.patch('/rename', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.renameGroupZodSchema), chat_controller_1.ChatController.renameGroup);
router.patch('/groupremove', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.groupActionZodSchema), chat_controller_1.ChatController.removeFromGroup);
router.patch('/groupadd', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.groupActionZodSchema), chat_controller_1.ChatController.addToGroup);
router.patch('/:chatId/pin', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.chatActionZodSchema), chat_controller_1.ChatController.updateChatPin);
router.patch('/:chatId/delete', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.chatActionZodSchema), chat_controller_1.ChatController.markChatAsDeleted);
router.patch('/:chatId/block', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(chat_validation_1.ChatValidation.chatActionZodSchema), chat_controller_1.ChatController.blockUnblockUser);
exports.ChatRoutes = router;
