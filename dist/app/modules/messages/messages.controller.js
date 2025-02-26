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
exports.MessageController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const messages_service_1 = require("./messages.service");
const logger_1 = require("../../../shared/logger");
const notification_constant_1 = require("../notification/notification.constant");
const pick_1 = __importDefault(require("../../../shared/pick"));
const promises_1 = require("inspector/promises");
const sendMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        logger_1.logger.info(`[MessageController] Sending message. Request data:`, {
            body: req.body,
            files: req.files ? Object.keys(req.files) : [],
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        });
        const { content, chatId, replyToId } = req.body;
        const files = req.files;
        const result = yield messages_service_1.MessageService.sendMessage({
            content,
            chatId,
            userId: req.user.id,
            replyToId,
            files,
        });
        logger_1.logger.info(`[MessageController] Message created successfully. ID: ${result._id}`);
        // Get the io instance from app
        const io = req.app.get('io');
        if (io) {
            // Remove the chatId check since we already have it
            promises_1.console.log(`[MessageController] Emitting socket event to chat: ${chatId}`);
            io.to(chatId).emit('message-received', result);
        }
        else {
            promises_1.console.log(`[MessageController] Socket not available for real-time update`);
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Message sent successfully',
            data: result,
        });
    }
    catch (error) {
        logger_1.logger.error(`[MessageController] Error in sendMessage:`, error);
        throw error;
    }
}));
const getAllMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { chatId } = req.params;
    const userId = req.user.id;
    const paginationOptions = (0, pick_1.default)(req.query, notification_constant_1.paginationFields);
    logger_1.logger.info(`[MessageController] Fetching messages for chat: ${chatId}`);
    const result = yield messages_service_1.MessageService.getAllMessagesFromDB(chatId, userId, paginationOptions);
    logger_1.logger.info(`[MessageController] Retrieved ${(_a = result.messages) === null || _a === void 0 ? void 0 : _a.length} messages`);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Messages retrieved successfully',
        data: result,
    });
}));
const editMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const { content } = req.body;
    const result = yield messages_service_1.MessageService.editMessage(messageId, req.user.id, content);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Message edited successfully',
        data: result,
    });
}));
const deleteMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const result = yield messages_service_1.MessageService.deleteMessage(messageId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Message deleted successfully',
        data: result,
    });
}));
const togglePinMessage = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logger_1.logger.info('CONTROLLER STARTED - THIS SHOULD APPEAR');
        const { messageId } = req.params;
        const { chatId } = req.body;
        if (!chatId) {
            return (0, sendResponse_1.default)(res, {
                statusCode: http_status_1.default.BAD_REQUEST,
                success: false,
                message: 'Chat ID is required',
                data: null,
            });
        }
        logger_1.logger.info(`[Controller] Toggling pin for message: ${messageId} in chat: ${chatId}`);
        // Toggle pin status via the service
        const result = yield messages_service_1.MessageService.togglePinMessage(messageId, req.user.id, chatId);
        // Detailed logging of the result
        logger_1.logger.info(`[Controller] Service result: ${JSON.stringify(result)}`);
        // Emit a real-time update to all clients in the chat room
        const io = req.app.get('io');
        if (io) {
            logger_1.logger.info(`[Controller] Got IO instance, emitting to chat: ${chatId}`);
            // Ensure pinnedBy is properly formatted
            const messageToEmit = Object.assign(Object.assign({}, result), { pinnedBy: result.pinnedBy
                    ? {
                        _id: result.pinnedBy._id || result.pinnedBy,
                        name: result.pinnedBy.name || '',
                        image: result.pinnedBy.image || '',
                    }
                    : null, pinnedAt: result.pinnedAt || new Date() });
            logger_1.logger.info('[Controller] Emitting message:', messageToEmit.pinnedBy);
            // Try direct emission to the room
            io.to(chatId).emit('message-updated', messageToEmit);
            logger_1.logger.info('[Controller] Emission completed');
        }
        else {
            promises_1.console.error('[Controller] IO instance not available!');
        }
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Message pin status toggled successfully',
            data: result,
        });
    }
    catch (error) {
        promises_1.console.error('[Controller] Error in togglePinMessage:', error);
        throw error; // Let catchAsync handle the error
    }
}));
const toggleReaction = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { messageId } = req.params;
    const { emoji } = req.body;
    promises_1.console.log('Toggle reaction:', emoji, messageId);
    const result = yield messages_service_1.MessageService.toggleReaction(messageId, req.user.id, emoji);
    // Emit real-time update to all clients in the chat room
    const io = req.app.get('io');
    if (io && result.chat) {
        // Ensure chatId is a string even if populated
        const chatId = typeof result.chat === 'string'
            ? result.chat
            : ((_a = result.chat._id) === null || _a === void 0 ? void 0 : _a.toString()) || result.chat.toString();
        io.to(chatId).emit('message-updated', result);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Reaction toggled successfully',
        data: result,
    });
}));
const markMessageAsRead = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const result = yield messages_service_1.MessageService.markMessageAsRead(messageId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Message marked as read successfully',
        data: result,
    });
}));
const searchMessages = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = req.query;
    const result = yield messages_service_1.MessageService.searchMessages(filters);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Messages retrieved successfully',
        data: result,
    });
}));
const getUnseenMessageCount = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const result = yield messages_service_1.MessageService.getUnseenMessageCount(chatId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Unseen message count retrieved successfully',
        data: result,
    });
}));
exports.MessageController = {
    getAllMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    toggleReaction,
    markMessageAsRead,
    searchMessages,
    getUnseenMessageCount,
};
