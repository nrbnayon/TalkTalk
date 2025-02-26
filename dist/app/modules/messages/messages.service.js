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
exports.MessageService = void 0;
// src\app\modules\messages\messages.service.ts
const mongoose_1 = require("mongoose");
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const chat_model_1 = require("../chat/chat.model");
const messages_model_1 = require("./messages.model");
const messages_interface_1 = require("./messages.interface");
const logger_1 = require("../../../shared/logger");
const paginationHelper_1 = require("../../../helpers/paginationHelper");
const user_model_1 = require("../user/user.model");
const getAllMessagesFromDB = (chatId, userId, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sortBy, sortOrder } = paginationHelper_1.paginationHelper.calculatePagination(paginationOptions);
    try {
        // Validate chatId
        if (!mongoose_1.Types.ObjectId.isValid(chatId)) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid chatId');
        }
        // Fetch messages with pagination
        const messages = yield messages_model_1.Message.find({ chat: chatId })
            .populate('sender', 'name email image')
            .populate({
            path: 'replyTo',
            populate: {
                path: 'sender',
                select: 'name image',
            },
        })
            .populate('chat')
            .populate('readBy', 'name image')
            .sort({ [sortBy]: sortOrder })
            .skip(skip)
            .limit(limit)
            .lean();
        // Calculate total number of messages in the chat
        const total = yield messages_model_1.Message.countDocuments({ chat: chatId });
        // Calculate unread count (assuming `user.id` is available)
        const unreadCount = yield messages_model_1.Message.countDocuments({
            chat: chatId,
            readBy: { $ne: new mongoose_1.Types.ObjectId(userId) },
        });
        return {
            meta: {
                page,
                limit,
                total,
                unreadCount,
            },
            messages: messages,
        };
    }
    catch (error) {
        logger_1.logger.error('Error fetching messages:', error);
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to fetch messages');
    }
});
const sendMessage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ content, chatId, userId, replyToId, files, }) {
    logger_1.logger.info(`[MessageService] Creating new message for chat: ${chatId}`);
    logger_1.logger.debug(`[MessageService] Message data:`, {
        content: content === null || content === void 0 ? void 0 : content.substring(0, 50),
        chatId,
        userId,
        replyToId,
        filesCount: files ? Object.keys(files).length : 0,
    });
    // Validation
    if ((!(content === null || content === void 0 ? void 0 : content.trim()) && (!files || !Object.keys(files).length)) || !chatId) {
        logger_1.logger.error('[MessageService] Invalid message data');
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, 'Message content or files required');
    }
    const messageData = {
        sender: userId,
        content: (content === null || content === void 0 ? void 0 : content.trim()) || '',
        chat: chatId,
        readBy: [userId],
    };
    if (replyToId) {
        messageData.replyTo = replyToId;
    }
    // Process attachments
    if (files && Object.keys(files).length > 0) {
        logger_1.logger.info(`[MessageService] Processing ${Object.keys(files).length} files`);
        messageData.attachments = [];
        for (const [fieldName, fileArray] of Object.entries(files)) {
            fileArray.forEach((file) => {
                console.log(`[MessageService] Processing file: ${file.originalname}`, {
                    file: file,
                });
                const attachment = {
                    url: `/${fieldName}/${file.filename}`,
                    type: getMessageType(fieldName, file.mimetype),
                    filename: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                };
                messageData.attachments.push(attachment);
            });
        }
        messageData.messageType =
            messageData.attachments.length > 1
                ? messages_interface_1.MessageType.MIXED
                : messageData.attachments[0].type;
    }
    else {
        messageData.messageType = messages_interface_1.MessageType.TEXT;
    }
    logger_1.logger.debug(`[MessageService] Final message data:`, messageData);
    const newMessage = yield messages_model_1.Message.create(messageData);
    logger_1.logger.info(`[MessageService] Message created with ID: ${newMessage._id}`);
    const message = yield messages_model_1.Message.findById(newMessage._id)
        .populate('sender', 'name image')
        .populate({
        path: 'replyTo',
        populate: {
            path: 'sender',
            select: 'name image',
        },
    })
        .populate('chat')
        .populate('readBy', 'name image');
    if (!message) {
        logger_1.logger.error('[MessageService] Failed to retrieve created message');
        throw new ApiError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create message');
    }
    // Update chat's latest message
    yield chat_model_1.Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
    logger_1.logger.info(`[MessageService] Updated latest message for chat: ${chatId}`);
    return message;
});
const getMessageType = (fieldName, mimeType) => {
    logger_1.logger.debug(`[MessageService] Determining message type for: ${fieldName}, ${mimeType}`);
    if (fieldName === 'images')
        return messages_interface_1.MessageType.IMAGE;
    if (mimeType.startsWith('video/'))
        return messages_interface_1.MessageType.VIDEO;
    if (mimeType.startsWith('audio/'))
        return messages_interface_1.MessageType.AUDIO;
    return messages_interface_1.MessageType.DOCUMENT;
};
const editMessage = (messageId, userId, newContent) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findOne({
        _id: messageId,
        sender: userId,
        isDeleted: false,
    });
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found or cannot be edited');
    }
    const editHistoryEntry = {
        content: message.content,
        editedAt: new Date(),
    };
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        content: newContent,
        isEdited: true,
        $push: { editHistory: editHistoryEntry },
    }, { new: true })
        .populate('sender', 'name image')
        .populate({
        path: 'replyTo',
        populate: {
            path: 'sender',
            select: 'name image',
        },
    })
        .populate('chat')
        .populate('readBy', 'name image');
    if (!updatedMessage) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found after update');
    }
    return updatedMessage.toObject();
});
const deleteMessage = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findOne({
        _id: messageId,
        sender: userId,
        isDeleted: false,
    });
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found or cannot be deleted');
    }
    const updatedMessage = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'This message has been deleted',
    }, { new: true })
        .populate('sender', 'name image')
        .populate('chat')
        .populate('readBy', 'name image');
    if (!updatedMessage) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found after update');
    }
    return updatedMessage.toObject();
});
const togglePinMessage = (messageId, userId, chatId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findOne({ _id: messageId, chat: chatId });
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found');
    }
    const newPinStatus = !message.isPinned;
    message.isPinned = newPinStatus;
    if (newPinStatus) {
        const user = yield user_model_1.User.findById(userId).select('name image');
        message.pinnedBy = user;
    }
    else {
        message.pinnedBy = null;
    }
    message.pinnedAt = newPinStatus ? new Date() : null;
    yield message.save();
    const pinnedMessage = yield messages_model_1.Message.findById(messageId)
        .populate('sender', 'name image')
        .populate('pinnedBy', 'name image')
        .populate('readBy', 'name image')
        .populate('chat')
        .lean();
    if (!pinnedMessage) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found after update');
    }
    console.log('Get pinned message in backend::', pinnedMessage);
    return pinnedMessage;
});
const toggleReaction = (messageId, userId, emoji) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findById(messageId);
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found');
    }
    // Ensure reactions array exists
    if (!message.reactions) {
        message.reactions = [];
    }
    // Find if the user has already reacted with any emoji
    const existingReactionIndex = message.reactions.findIndex(reaction => reaction.users.some(user => user.toString() === userId));
    if (existingReactionIndex !== -1) {
        const existingReaction = message.reactions[existingReactionIndex];
        if (existingReaction.emoji === emoji) {
            // User clicked the same emoji: remove their reaction (toggle off)
            existingReaction.users = existingReaction.users.filter(user => user.toString() !== userId);
            if (existingReaction.users.length === 0) {
                // Remove the reaction entry if no user left
                message.reactions.splice(existingReactionIndex, 1);
            }
        }
        else {
            // User had a different reaction: remove it first
            message.reactions[existingReactionIndex].users =
                existingReaction.users.filter(user => user.toString() !== userId);
            if (message.reactions[existingReactionIndex].users.length === 0) {
                message.reactions.splice(existingReactionIndex, 1);
            }
            // Then add the new reaction
            const newReactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
            if (newReactionIndex !== -1) {
                message.reactions[newReactionIndex].users.push(new mongoose_1.Types.ObjectId(userId));
            }
            else {
                message.reactions.push({
                    emoji,
                    users: [new mongoose_1.Types.ObjectId(userId)],
                });
            }
        }
    }
    else {
        // No existing reaction by the user: add reaction normally
        const existingEmojiIndex = message.reactions.findIndex(r => r.emoji === emoji);
        if (existingEmojiIndex !== -1) {
            message.reactions[existingEmojiIndex].users.push(new mongoose_1.Types.ObjectId(userId));
        }
        else {
            message.reactions.push({
                emoji,
                users: [new mongoose_1.Types.ObjectId(userId)],
            });
        }
    }
    yield message.save();
    const updatedMessage = yield messages_model_1.Message.findById(messageId)
        .populate('sender', 'name image')
        .populate({
        path: 'replyTo',
        populate: { path: 'sender', select: 'name image' },
    })
        .populate('chat')
        .populate('readBy', 'name image')
        .populate({ path: 'reactions.users', select: 'name image' });
    if (!updatedMessage) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found after update');
    }
    return updatedMessage.toObject();
});
const markMessageAsRead = (messageId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const message = yield messages_model_1.Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: userId },
    }, { new: true })
        .populate('sender', 'name image')
        .populate('readBy', 'name image')
        .populate('chat');
    if (!message) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, 'Message not found');
    }
    return message.toObject();
});
const searchMessages = (filters) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, chatId, isPinned, startDate, endDate } = filters;
    const query = { isDeleted: false };
    if (searchTerm) {
        query.$text = { $search: searchTerm };
    }
    if (chatId) {
        query.chat = chatId;
    }
    if (isPinned !== undefined) {
        query.isPinned = isPinned;
    }
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate)
            query.createdAt.$gte = startDate;
        if (endDate)
            query.createdAt.$lte = endDate;
    }
    const messages = yield messages_model_1.Message.find(query)
        .populate('sender', 'name email image')
        .populate({
        path: 'replyTo',
        populate: {
            path: 'sender',
            select: 'name image',
        },
    })
        .populate('chat')
        .populate('readBy', 'name image')
        .sort({ createdAt: -1 });
    return messages.map(msg => msg.toObject());
});
const getUnseenMessageCount = (chatId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return messages_model_1.Message.countDocuments({
        chat: chatId,
        readBy: { $ne: userId },
        sender: { $ne: userId },
        isDeleted: false,
    });
});
exports.MessageService = {
    getAllMessagesFromDB,
    sendMessage,
    editMessage,
    deleteMessage,
    togglePinMessage,
    toggleReaction,
    markMessageAsRead,
    searchMessages,
    getUnseenMessageCount,
};
