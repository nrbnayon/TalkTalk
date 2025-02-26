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
exports.ChatService = void 0;
// src\app\modules\chat\chat.service.ts
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const user_model_1 = require("../user/user.model");
const chat_model_1 = require("./chat.model");
const accessChat = (userId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!userId) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'UserId param not sent with request');
    }
    const users = yield user_model_1.User.find({
        _id: { $in: [userId, currentUserId] },
        status: 'active',
    });
    if (users.length !== 2) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'One or both users not found');
    }
    const existingChat = yield chat_model_1.Chat.findOne({
        isGroupChat: false,
        $and: [
            { users: { $elemMatch: { $eq: currentUserId } } },
            { users: { $elemMatch: { $eq: userId } } },
        ],
    })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'latestMessage',
        populate: {
            path: 'sender',
            select: 'name email image onlineStatus',
        },
    });
    if (existingChat) {
        return existingChat.toObject();
    }
    const chatData = {
        chatName: 'sender',
        isGroupChat: false,
        users: [currentUserId, userId],
    };
    const createdChat = yield chat_model_1.Chat.create(chatData);
    const fullChat = yield chat_model_1.Chat.findById(createdChat._id).populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    });
    if (!fullChat) {
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create chat');
    }
    return fullChat.toObject();
});
const getAllChats = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chats = yield chat_model_1.Chat.find({
        users: { $elemMatch: { $eq: userId } },
        deletedBy: { $ne: userId },
    })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    })
        .populate({
        path: 'latestMessage',
        populate: {
            path: 'sender',
            select: 'name email image onlineStatus',
        },
    })
        .sort({ updatedAt: -1 });
    return chats.map(chat => chat.toObject());
});
const createGroupChat = (name, users, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    if (!users || !name) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Please fill all fields');
    }
    if (users.length < 2) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'More than 2 users are required to create a group chat');
    }
    const validUsers = yield user_model_1.User.find({
        _id: { $in: [...users, currentUserId] },
        status: 'active',
    });
    if (validUsers.length !== users.length + 1) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'One or more users not found or inactive');
    }
    const groupChat = yield chat_model_1.Chat.create({
        chatName: name,
        users: [...users, currentUserId],
        isGroupChat: true,
        groupAdmin: currentUserId,
    });
    const fullGroupChat = yield chat_model_1.Chat.findById(groupChat._id)
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    });
    if (!fullGroupChat) {
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create group chat');
    }
    return fullGroupChat.toObject();
});
const renameGroup = (chatId, chatName, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    if (((_a = chat.groupAdmin) === null || _a === void 0 ? void 0 : _a.toString()) !== currentUserId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Only group admin can rename the group');
    }
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, { chatName }, { new: true })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    return updatedChat.toObject();
});
const removeFromGroup = (chatId, userId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    if (((_a = chat.groupAdmin) === null || _a === void 0 ? void 0 : _a.toString()) !== currentUserId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Only group admin can remove members');
    }
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, { $pull: { users: userId } }, { new: true })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    return updatedChat.toObject();
});
const addToGroup = (chatId, userId, currentUserId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    if (((_a = chat.groupAdmin) === null || _a === void 0 ? void 0 : _a.toString()) !== currentUserId) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, 'Only group admin can add members');
    }
    const user = yield user_model_1.User.findOne({ _id: userId, status: 'active' });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'User not found or inactive');
    }
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, { $addToSet: { users: userId } }, { new: true })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    return updatedChat.toObject();
});
const updateChatPin = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    // Toggle the isPinned field
    // const updatedChat = await Chat.findByIdAndUpdate(
    //   chatId,
    //   { isPinned: !chat.isPinned },
    //   { new: true }
    // )
    // Check if user is already blocked
    const isPinned = chat.pinnedBy && chat.pinnedBy.some(id => id.toString() === userId);
    // Update operation - add or remove from blockedBy array
    const updateOperation = isPinned
        ? { $pull: { pinnedBy: userId } }
        : { $addToSet: { pinnedBy: userId } };
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, updateOperation, {
        new: true,
    })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    })
        .populate({
        path: 'latestMessage',
        populate: {
            path: 'sender',
            select: 'name email image onlineStatus',
        },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Failed to update chat');
    }
    return updatedChat.toObject();
});
const markChatAsDeleted = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    // Add user to deletedBy array if not already there
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, { $addToSet: { deletedBy: userId } }, { new: true })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    })
        .populate({
        path: 'latestMessage',
        populate: {
            path: 'sender',
            select: 'name email image onlineStatus',
        },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Failed to mark chat as deleted');
    }
    return updatedChat.toObject();
});
const blockUnblockUser = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const chat = yield chat_model_1.Chat.findById(chatId);
    if (!chat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Chat not found');
    }
    // Check if user is already blocked
    const isBlocked = chat.blockedBy && chat.blockedBy.some(id => id.toString() === userId);
    // Update operation - add or remove from blockedBy array
    const updateOperation = isBlocked
        ? { $pull: { blockedBy: userId } }
        : { $addToSet: { blockedBy: userId } };
    const updatedChat = yield chat_model_1.Chat.findByIdAndUpdate(chatId, updateOperation, {
        new: true,
    })
        .populate({
        path: 'users',
        select: 'name email image onlineStatus lastActiveAt status verified',
        match: { status: 'active' },
    })
        .populate({
        path: 'groupAdmin',
        select: 'name email image onlineStatus',
        match: { status: 'active' },
    })
        .populate({
        path: 'latestMessage',
        populate: {
            path: 'sender',
            select: 'name email image onlineStatus',
        },
    });
    if (!updatedChat) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Failed to update block status');
    }
    return updatedChat.toObject();
});
// Add these to the export
exports.ChatService = {
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
