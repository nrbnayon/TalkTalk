"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRoutes = void 0;
// src\app\modules\messages\messages.route.ts
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const messages_controller_1 = require("./messages.controller");
const messages_validation_1 = require("./messages.validation");
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const router = express_1.default.Router();
router.post('/', (0, fileUploadHandler_1.default)(), (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), 
// validateRequest(MessageValidation.sendMessageZodSchema),
messages_controller_1.MessageController.sendMessage);
router.get('/:chatId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.getChatMessagesZodSchema), messages_controller_1.MessageController.getAllMessages);
router.patch('/:messageId/edit', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.editMessageZodSchema), messages_controller_1.MessageController.editMessage);
router.delete('/:messageId', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.messageIdParamSchema), messages_controller_1.MessageController.deleteMessage);
router.patch('/:messageId/read', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.messageIdParamSchema), messages_controller_1.MessageController.markMessageAsRead);
router.get('/search', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.searchMessagesZodSchema), messages_controller_1.MessageController.searchMessages);
router.get('/:chatId/unseen', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.getChatMessagesZodSchema), messages_controller_1.MessageController.getUnseenMessageCount);
router.patch('/:messageId/pin', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.messageIdPinSchema), messages_controller_1.MessageController.togglePinMessage);
router.post('/:messageId/react', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), (0, validateRequest_1.default)(messages_validation_1.MessageValidation.reactionZodSchema), messages_controller_1.MessageController.toggleReaction);
exports.MessageRoutes = router;
