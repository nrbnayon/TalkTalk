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
exports.socketHelper = void 0;
//backend // src\helpers\socketHelper.ts
const colors_1 = __importDefault(require("colors"));
const user_service_1 = require("../app/modules/user/user.service");
const mongoose_1 = require("mongoose");
const messages_service_1 = require("../app/modules/messages/messages.service");
const logger_1 = require("../shared/logger");
class SocketHelper {
    static logInfo(message, data) {
        if (data) {
            logger_1.logger.info(colors_1.default.blue(`[SocketHelper] ${message}`), data);
        }
        else {
            logger_1.logger.info(colors_1.default.blue(`[SocketHelper] ${message}`));
        }
    }
    static logError(message, error) {
        if (error) {
            logger_1.logger.error(colors_1.default.red(`[SocketHelper] ${message}`), error);
        }
        else {
            logger_1.logger.error(colors_1.default.red(`[SocketHelper] ${message}`));
        }
    }
    static handleUserOnline(socket, io, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.connectedSockets.set(socket.id, userId);
                const wasOffline = !Array.from(this.connectedSockets.values()).includes(userId);
                if (wasOffline) {
                    yield user_service_1.UserService.updateUserOnlineStatus(userId, true);
                    const onlineUsers = yield user_service_1.UserService.getOnlineUsers();
                    io.emit('online-users-update', onlineUsers);
                }
                logger_1.logger.info(`[SocketHelper] User ${userId} is online.`);
            }
            catch (error) {
                logger_1.logger.error(`[SocketHelper] Error setting user ${userId} online:`, error);
            }
        });
    }
    static handleJoinChat(socket, { chatId, user }) {
        if (!chatId) {
            logger_1.logger.error('[SocketHelper] Invalid chatId provided for joining chat room');
            return;
        }
        socket.join(chatId);
        logger_1.logger.info(`[SocketHelper] User ${user._id} joined chat: ${chatId}`);
    }
    static handleMessageRead(socket, data) {
        const { messageId, chatId, userId } = data;
        // Log for debugging
        console.log('[SocketHelper] Message read event:', {
            messageId,
            chatId,
            userId,
            socketId: socket.id,
        });
        // Broadcast to all users in the chat room
        socket.to(chatId).emit('message-read-update', {
            messageId,
            userId,
            chatId,
            timestamp: new Date(),
        });
        this.logInfo(`Message ${messageId} marked as read by user ${userId}`);
    }
    static handleNewMessage(socket, message) {
        var _a;
        if (!message.chat) {
            this.logError('Invalid message format');
            return;
        }
        const chatId = typeof message.chat === 'string'
            ? message.chat
            : typeof message.chat === 'object' && message.chat._id
                ? message.chat._id.toString()
                : message.chat.toString();
        // Log for debugging
        console.log('[SocketHelper] Broadcasting new message:', {
            messageId: message._id,
            chatId,
            senderId: (_a = message.sender) === null || _a === void 0 ? void 0 : _a._id,
        });
        // Broadcast to all users in chat room
        socket.to(chatId).emit('message-received', message);
    }
    static handleTypingStart(socket, data) {
        const { chatId, userId, name, content } = data;
        const typingKey = `${chatId}-${userId}`;
        this.logInfo(`User ${name} started typing in chat ${chatId}, Content: ${content}...`);
        if (this.typingUsers.has(typingKey)) {
            clearTimeout(this.typingUsers.get(typingKey));
        }
        socket.to(chatId).emit('typing-update', {
            chatId,
            userId,
            name,
            content,
            isTyping: true,
        });
        const timeout = setTimeout(() => {
            socket.to(chatId).emit('typing-update', {
                chatId,
                userId,
                name,
                isTyping: false,
            });
            this.typingUsers.delete(typingKey);
        }, 3000);
        this.typingUsers.set(typingKey, timeout);
    }
    static handleTypingStop(data) {
        const { chatId, userId } = data;
        this.typingUsers.delete(`${chatId}-${userId}`);
    }
    static handleCallInitiate(socket, io, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { chatId, callType, participants } = data;
            const userId = this.connectedSockets.get(socket.id);
            if (!userId) {
                this.logError('User not found for call initiation');
                return;
            }
            const callSession = {
                _id: new mongoose_1.Types.ObjectId(),
                participants: participants.map(id => new mongoose_1.Types.ObjectId(id)),
                chat: new mongoose_1.Types.ObjectId(chatId),
                initiator: new mongoose_1.Types.ObjectId(userId),
                startTime: new Date(),
                callType,
                status: 'ringing',
            };
            this.activeCalls.set(chatId, callSession);
            this.logInfo(`Call initiated in chat ${chatId}`, callSession);
            participants.forEach(participantId => {
                if (participantId.toString() !== userId) {
                    const participantSockets = this.getSocketsByUserId(participantId.toString());
                    participantSockets.forEach(socketId => {
                        io.to(socketId).emit('call-incoming', callSession);
                    });
                }
            });
        });
    }
    static handleCallAccept(io, callId, socket) {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId)
            return;
        const call = this.activeCalls.get(callId);
        if (call) {
            call.status = 'ongoing';
            this.activeCalls.set(callId, call);
            this.logInfo(`Call ${callId} accepted by user ${userId}`);
            call.participants.forEach(participantId => {
                const participantSockets = this.getSocketsByUserId(participantId.toString());
                participantSockets.forEach(socketId => {
                    io.to(socketId).emit('call-status-update', {
                        callId,
                        status: 'ongoing',
                        acceptedBy: userId,
                    });
                });
            });
        }
    }
    static handleCallReject(io, callId, socket) {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId)
            return;
        const call = this.activeCalls.get(callId);
        if (call) {
            call.status = 'rejected';
            call.endTime = new Date();
            this.activeCalls.delete(callId);
            this.logInfo(`Call ${callId} rejected by user ${userId}`);
            call.participants.forEach(participantId => {
                const participantSockets = this.getSocketsByUserId(participantId.toString());
                participantSockets.forEach(socketId => {
                    io.to(socketId).emit('call-ended', {
                        callId,
                        status: 'rejected',
                        rejectedBy: userId,
                    });
                });
            });
        }
    }
    static handleCallSignal(io, data, socket) {
        const { callId, targetUserId, signal } = data;
        const userId = this.connectedSockets.get(socket.id);
        if (!userId) {
            this.logError('User not found for call signal');
            return;
        }
        const call = this.activeCalls.get(callId);
        if (call && call.status === 'ongoing') {
            const targetSockets = this.getSocketsByUserId(targetUserId);
            targetSockets.forEach(socketId => {
                io.to(socketId).emit('call-signal-received', {
                    callId,
                    fromUserId: userId,
                    signal,
                });
            });
            this.logInfo(`Call signal sent from ${userId} to ${targetUserId}`);
        }
    }
    static handleCallEnd(io, callId, socket) {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId)
            return;
        const call = this.activeCalls.get(callId);
        if (call) {
            call.status = 'ended';
            call.endTime = new Date();
            this.activeCalls.delete(callId);
            this.logInfo(`Call ${callId} ended by user ${userId}`);
            call.participants.forEach(participantId => {
                const participantSockets = this.getSocketsByUserId(participantId.toString());
                participantSockets.forEach(socketId => {
                    io.to(socketId).emit('call-ended', {
                        callId,
                        status: 'ended',
                        endedBy: userId,
                    });
                });
            });
        }
    }
    static handleMessageReaction(socket, io, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messageId, chatId, emoji } = data;
            const userId = this.connectedSockets.get(socket.id);
            if (userId) {
                try {
                    const updatedMessage = yield messages_service_1.MessageService.toggleReaction(messageId, userId, emoji);
                    // socket.to(chatId).emit('message-updated', updatedMessage);
                    io.to(chatId).emit('message-updated', updatedMessage);
                    this.logInfo(`Reaction ${emoji} toggled on message ${messageId} by user ${userId}`);
                }
                catch (error) {
                    this.logError('Error handling reaction:', error);
                }
            }
        });
    }
    static handleLeaveChat(socket, chatId) {
        if (!chatId) {
            this.logError('Invalid chatId provided for leaving chat room');
            return;
        }
        socket.leave(chatId);
        const userId = this.connectedSockets.get(socket.id);
        this.logInfo(`User ${userId} left chat room: ${chatId}`);
    }
    static handleDeleteMessage(socket, io, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messageId, chatId } = data;
            try {
                console.log('[SocketHelper] Processing delete message request:', {
                    messageId,
                    chatId,
                    socketId: socket.id,
                });
                // Broadcast delete event to all users in the chat
                io.to(chatId).emit('message-deleted', {
                    messageId,
                    chatId,
                    timestamp: new Date(),
                });
                console.log(`[SocketHelper] Emitted 'message-deleted' event to chat ${chatId}`);
                this.logInfo(`Message ${messageId} deleted in chat ${chatId}`);
            }
            catch (error) {
                console.error('[SocketHelper] Error deleting message:', error);
            }
        });
    }
    static handleMessagePin(io, updatedMessage) {
        if (!updatedMessage) {
            logger_1.logger.error('[Socket] Received empty updated message');
            return;
        }
        // Extract chat ID safely
        const chatId = typeof updatedMessage.chat === 'string'
            ? updatedMessage.chat
            : updatedMessage.chat && updatedMessage.chat._id
                ? updatedMessage.chat._id.toString()
                : '';
        if (!chatId) {
            logger_1.logger.error('[Socket] Invalid chat id in message-updated event', updatedMessage);
            return;
        }
        logger_1.logger.info(`[Socket] Broadcasting 'message-updated' event to chat room: ${chatId}`, updatedMessage);
        // Debugging: Check active rooms before emitting
        const connectedRooms = io.sockets.adapter.rooms;
        logger_1.logger.info(`[Socket] Active rooms:`, Array.from(connectedRooms.keys()));
        // Ensure room exists before emitting
        if (!connectedRooms.has(chatId)) {
            logger_1.logger.warn(`[Socket] Chat room ${chatId} does not exist! Clients may not have joined it.`);
        }
        // Emit event to all users in the chat room
        io.to(chatId).emit('message-updated', updatedMessage);
        logger_1.logger.info(`[Socket] Successfully emitted 'message-updated' to chat room: ${chatId}`);
    }
    static handleDisconnect(socket, io) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = this.connectedSockets.get(socket.id);
            if (!userId)
                return;
            this.connectedSockets.delete(socket.id);
            const stillConnected = Array.from(this.connectedSockets.values()).includes(userId);
            if (!stillConnected) {
                yield user_service_1.UserService.updateUserOnlineStatus(userId, false);
                const onlineUsers = yield user_service_1.UserService.getOnlineUsers();
                io.emit('online-users-update', onlineUsers);
            }
        });
    }
    static socket(io) {
        io.on('connection', (socket) => {
            this.logInfo(`User connected: ${socket.id}`);
            socket.on('user-online', (userId) => this.handleUserOnline(socket, io, userId));
            socket.on('join-chat', (data) => this.handleJoinChat(socket, data));
            socket.on('new-message', (message) => this.handleNewMessage(socket, message));
            socket.on('message-read', (data) => this.handleMessageRead(socket, data));
            socket.on('message-updated', updatedMessage => {
                logger_1.logger.info(`[Socket] Received 'message-updated' event`, updatedMessage);
                SocketHelper.handleMessagePin(io, updatedMessage);
            });
            socket.on('typing-start', (data) => this.handleTypingStart(socket, data));
            socket.on('typing-stop', (data) => this.handleTypingStop(data));
            socket.on('call-initiate', (data) => this.handleCallInitiate(socket, io, data));
            socket.on('call-accept', (callId) => this.handleCallAccept(io, callId, socket));
            socket.on('call-reject', (callId) => this.handleCallReject(io, callId, socket));
            socket.on('call-signal', (data) => this.handleCallSignal(io, data, socket));
            socket.on('call-end', (callId) => this.handleCallEnd(io, callId, socket));
            socket.on('message-reaction', (data) => this.handleMessageReaction(socket, io, data));
            socket.on('delete-message', (data) => {
                SocketHelper.handleDeleteMessage(socket, io, data);
            });
            socket.on('leave-chat', (chatId) => this.handleLeaveChat(socket, chatId));
            socket.on('disconnect', () => this.handleDisconnect(socket, io));
        });
    }
    static getSocketsByUserId(userId) {
        return Array.from(this.connectedSockets.entries())
            .filter(([, id]) => id === userId)
            .map(([socketId]) => socketId);
    }
    static getConnectedUsers() {
        return Array.from(new Set(this.connectedSockets.values()));
    }
    static isUserOnline(userId) {
        return Array.from(this.connectedSockets.values()).includes(userId);
    }
}
SocketHelper.connectedSockets = new Map();
SocketHelper.typingUsers = new Map();
SocketHelper.activeCalls = new Map();
exports.socketHelper = SocketHelper;
