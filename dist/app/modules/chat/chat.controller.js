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
exports.ChatController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const chat_service_1 = require("./chat.service");
const accessChat = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Chat access Controller::', req.body.userId, req.user.id);
    const result = yield chat_service_1.ChatService.accessChat(req.body.userId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Chat accessed successfully',
        data: result,
    });
}));
const getAllChats = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield chat_service_1.ChatService.getAllChats(req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Chats retrieved successfully',
        data: result,
    });
}));
const createGroupChat = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, users } = req.body;
    const result = yield chat_service_1.ChatService.createGroupChat(name, users, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Group chat created successfully',
        data: result,
    });
}));
const renameGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId, chatName } = req.body;
    const result = yield chat_service_1.ChatService.renameGroup(chatId, chatName, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Group renamed successfully',
        data: result,
    });
}));
const removeFromGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId, userId } = req.body;
    const result = yield chat_service_1.ChatService.removeFromGroup(chatId, userId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User removed from group successfully',
        data: result,
    });
}));
const addToGroup = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId, userId } = req.body;
    const result = yield chat_service_1.ChatService.addToGroup(chatId, userId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'User added to group successfully',
        data: result,
    });
}));
const updateChatPin = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const result = yield chat_service_1.ChatService.updateChatPin(chatId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Chat pin status updated successfully',
        data: result,
    });
}));
const markChatAsDeleted = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const result = yield chat_service_1.ChatService.markChatAsDeleted(chatId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Chat marked as deleted successfully',
        data: result,
    });
}));
const blockUnblockUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { chatId } = req.params;
    const result = yield chat_service_1.ChatService.blockUnblockUser(chatId, req.user.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Chat block status updated successfully',
        data: result,
    });
}));
exports.ChatController = {
    accessChat,
    getAllChats,
    createGroupChat,
    renameGroup,
    removeFromGroup,
    addToGroup,
    updateChatPin,
    markChatAsDeleted,
    blockUnblockUser,
};
