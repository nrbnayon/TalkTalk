//backend // src\helpers\socketHelper.ts
import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { UserService } from '../app/modules/user/user.service';
import {
  ICallSession,
  IMessage,
} from '../app/modules/messages/messages.interface';
import { Types } from 'mongoose';
import { MessageService } from '../app/modules/messages/messages.service';
import { logger } from '../shared/logger';
import { Chat } from '../app/modules/chat/chat.model';
import { Message } from '../app/modules/messages/messages.model';

interface ICallSignal {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
}

interface ITypingData {
  chatId: string;
  userId: string;
  name: string;
  isTyping: boolean;
  content: string;
}

interface IMessageReadData {
  messageId: string;
  chatId: string;
  userId: string;
}

interface ICallInitiateData {
  chatId: string;
  callType: 'audio' | 'video';
  participants: Types.ObjectId[];
}

interface ICallSignalData {
  callId: string;
  targetUserId: string;
  signal: ICallSignal;
}

interface IMessageReactionData {
  messageId: string;
  chatId: string;
  emoji: string;
}

class SocketHelper {
  private static connectedSockets = new Map<string, string>();
  private static typingUsers = new Map<string, NodeJS.Timeout>();
  private static activeCalls = new Map<string, ICallSession>();

  private static logInfo(message: string, data?: any) {
    if (data) {
      logger.info(colors.blue(`[SocketHelper] ${message}`), data);
    } else {
      logger.info(colors.blue(`[SocketHelper] ${message}`));
    }
  }

  private static logError(message: string, error?: any) {
    if (error) {
      logger.error(colors.red(`[SocketHelper] ${message}`), error);
    } else {
      logger.error(colors.red(`[SocketHelper] ${message}`));
    }
  }

  private static async handleUserOnline(
    socket: Socket,
    io: Server,
    userId: string
  ) {
    try {
      // Save the mapping immediately
      this.connectedSockets.set(socket.id, userId);
      this.logInfo(`User ${userId} is now online`);

      // Optimistically update online users based on in-memory connectedSockets
      const onlineUsersOptimistic = Array.from(
        new Set(this.connectedSockets.values())
      );
      io.emit('online-users-update', onlineUsersOptimistic);

      // Then update the DB asynchronously and emit the updated list
      await UserService.updateUserOnlineStatus(userId, true);
      const onlineUsers = await UserService.getOnlineUsers();
      io.emit('online-users-update', onlineUsers);

      this.logInfo(`Online users found: ${onlineUsers.length}`);
    } catch (error) {
      this.logError(`Error setting user ${userId} online:`, error);
    }
  }

  private static handleJoinChat(
    socket: Socket,
    data: { chatId: string; user: any }
  ) {
    const { chatId, user } = data;
    if (!chatId) {
      this.logError('Invalid chatId provided for joining chat room');
      return;
    }

    // Leave any other rooms first to prevent memory leaks
    socket.rooms.forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });

    socket.join(chatId);
    this.logInfo(
      `User ${user?._id} (${user?.name}) joined chat room: ${chatId}`
    );
  }

  private static handleMessageRead(socket: Socket, data: IMessageReadData) {
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

  private static handleNewMessage(socket: Socket, message: IMessage) {
    if (!message.chat) {
      this.logError('Invalid message format');
      return;
    }

    const chatId =
      typeof message.chat === 'string'
        ? message.chat
        : typeof message.chat === 'object' && message.chat._id
        ? message.chat._id.toString()
        : message.chat.toString();

    // Log for debugging
    console.log('[SocketHelper] Broadcasting new message:', {
      messageId: message._id,
      chatId,
      senderId: message.sender?._id,
    });

    // Broadcast to all users in chat room
    socket.to(chatId).emit('message-received', message);
  }

  private static handleTypingStart(socket: Socket, data: ITypingData) {
    const { chatId, userId, name, content } = data;
    const typingKey = `${chatId}-${userId}`;

    this.logInfo(
      `User ${name} started typing in chat ${chatId}, Content: ${content}...`
    );

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

  private static handleTypingStop(data: ITypingData) {
    const { chatId, userId } = data;
    this.typingUsers.delete(`${chatId}-${userId}`);
  }

  private static async handleCallInitiate(
    socket: Socket,
    io: Server,
    data: ICallInitiateData
  ) {
    const { chatId, callType, participants } = data;
    const userId = this.connectedSockets.get(socket.id);

    if (!userId) {
      this.logError('User not found for call initiation');
      return;
    }

    const callSession: ICallSession = {
      _id: new Types.ObjectId(),
      participants: participants.map(id => new Types.ObjectId(id)),
      chat: new Types.ObjectId(chatId),
      initiator: new Types.ObjectId(userId),
      startTime: new Date(),
      callType,
      status: 'ringing',
    };

    this.activeCalls.set(chatId, callSession);
    this.logInfo(`Call initiated in chat ${chatId}`, callSession);

    participants.forEach(participantId => {
      if (participantId.toString() !== userId) {
        const participantSockets = this.getSocketsByUserId(
          participantId.toString()
        );
        participantSockets.forEach(socketId => {
          io.to(socketId).emit('call-incoming', callSession);
        });
      }
    });
  }

  private static handleCallAccept(io: Server, callId: string, socket: Socket) {
    const userId = this.connectedSockets.get(socket.id);
    if (!userId) return;

    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'ongoing';
      this.activeCalls.set(callId, call);
      this.logInfo(`Call ${callId} accepted by user ${userId}`);

      call.participants.forEach(participantId => {
        const participantSockets = this.getSocketsByUserId(
          participantId.toString()
        );
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

  private static handleCallReject(io: Server, callId: string, socket: Socket) {
    const userId = this.connectedSockets.get(socket.id);
    if (!userId) return;

    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'rejected';
      call.endTime = new Date();
      this.activeCalls.delete(callId);
      this.logInfo(`Call ${callId} rejected by user ${userId}`);

      call.participants.forEach(participantId => {
        const participantSockets = this.getSocketsByUserId(
          participantId.toString()
        );
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

  private static handleCallSignal(
    io: Server,
    data: ICallSignalData,
    socket: Socket
  ) {
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

  private static handleCallEnd(io: Server, callId: string, socket: Socket) {
    const userId = this.connectedSockets.get(socket.id);
    if (!userId) return;

    const call = this.activeCalls.get(callId);
    if (call) {
      call.status = 'ended';
      call.endTime = new Date();
      this.activeCalls.delete(callId);
      this.logInfo(`Call ${callId} ended by user ${userId}`);

      call.participants.forEach(participantId => {
        const participantSockets = this.getSocketsByUserId(
          participantId.toString()
        );
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

  private static async handleMessageReaction(
    socket: Socket,
    io: Server,
    data: IMessageReactionData
  ) {
    const { messageId, chatId, emoji } = data;
    const userId = this.connectedSockets.get(socket.id);

    if (userId) {
      try {
        const updatedMessage = await MessageService.toggleReaction(
          messageId,
          userId,
          emoji
        );
        // socket.to(chatId).emit('message-updated', updatedMessage);
        io.to(chatId).emit('message-updated', updatedMessage);
        this.logInfo(
          `Reaction ${emoji} toggled on message ${messageId} by user ${userId}`
        );
      } catch (error) {
        this.logError('Error handling reaction:', error);
      }
    }
  }

  private static handleLeaveChat(socket: Socket, chatId: string) {
    if (!chatId) {
      this.logError('Invalid chatId provided for leaving chat room');
      return;
    }

    socket.leave(chatId);
    const userId = this.connectedSockets.get(socket.id);
    this.logInfo(`User ${userId} left chat room: ${chatId}`);
  }

  private static async handleDeleteMessage(
    socket: Socket,
    io: Server,
    data: { messageId: string; chatId: string }
  ) {
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

      console.log(
        `[SocketHelper] Emitted 'message-deleted' event to chat ${chatId}`
      );

      this.logInfo(`Message ${messageId} deleted in chat ${chatId}`);
    } catch (error) {
      console.error('[SocketHelper] Error deleting message:', error);
    }
  }

  private static handleMessagePin(io: Server, updatedMessage: IMessage) {
    if (!updatedMessage) {
      logger.error('[Socket] Received empty updated message');
      return;
    }

    // Extract chat ID safely
    const chatId =
      typeof updatedMessage.chat === 'string'
        ? updatedMessage.chat
        : updatedMessage.chat && updatedMessage.chat._id
        ? updatedMessage.chat._id.toString()
        : '';

    if (!chatId) {
      logger.error(
        '[Socket] Invalid chat id in message-updated event',
        updatedMessage
      );
      return;
    }

    logger.info(
      `[Socket] Broadcasting 'message-updated' event to chat room: ${chatId}`,
      updatedMessage
    );

    // Debugging: Check active rooms before emitting
    const connectedRooms = io.sockets.adapter.rooms;
    logger.info(`[Socket] Active rooms:`, Array.from(connectedRooms.keys()));

    // Ensure room exists before emitting
    if (!connectedRooms.has(chatId)) {
      logger.warn(
        `[Socket] Chat room ${chatId} does not exist! Clients may not have joined it.`
      );
    }

    // Emit event to all users in the chat room
    io.to(chatId).emit('message-updated', updatedMessage);

    logger.info(
      `[Socket] Successfully emitted 'message-updated' to chat room: ${chatId}`
    );
  }

  private static async handleBlockUnblock(
    io: Server,
    chatId: string,
    userId: any
  ) {
    const chat = await Chat.findById(chatId);
    if (!chat) return;

    io.to(chatId).emit('chat-block-status-updated', {
      chatId,
      isBlocked: chat.blockedBy.includes(userId),
    });
  }

  

  private static async handleDisconnect(socket: Socket, io: Server) {
    const userId = this.connectedSockets.get(socket.id);

    if (userId) {
      try {
        const userSocketCount = Array.from(
          this.connectedSockets.entries()
        ).filter(([, id]) => id === userId).length;

        if (userSocketCount <= 1) {
          await UserService.updateUserOnlineStatus(userId, false);
          const onlineUsers = await UserService.getOnlineUsers();
          io.emit('online-users-update', onlineUsers);
          this.logInfo(`User ${userId} set offline`);
        }

        // Clear typing timeouts
        Array.from(this.typingUsers.entries())
          .filter(([key]) => key.includes(userId))
          .forEach(([key]) => {
            clearTimeout(this.typingUsers.get(key));
            this.typingUsers.delete(key);
          });

        this.connectedSockets.delete(socket.id);
      } catch (error) {
        this.logError('Error handling user disconnect:', error);
      }
    }

    this.logInfo(`User disconnected: ${socket.id}`);
  }

  static socket(io: Server) {
    io.on('connection', (socket: Socket) => {
      this.logInfo(`User connected: ${socket.id}`);

      socket.on('user-online', (userId: string) =>
        this.handleUserOnline(socket, io, userId)
      );
      socket.on('join-chat', (data: { chatId: string; user: any }) =>
        this.handleJoinChat(socket, data)
      );
      socket.on('new-message', (message: IMessage) =>
        this.handleNewMessage(socket, message)
      );
      socket.on('message-read', (data: IMessageReadData) =>
        this.handleMessageRead(socket, data)
      );

      socket.on('message-updated', updatedMessage => {
        logger.info(
          `[Socket] Received 'message-updated' event`,
          updatedMessage
        );
        SocketHelper.handleMessagePin(io, updatedMessage);
      });

      socket.on('typing-start', (data: ITypingData) =>
        this.handleTypingStart(socket, data)
      );
      socket.on('typing-stop', (data: ITypingData) =>
        this.handleTypingStop(data)
      );
      socket.on('call-initiate', (data: ICallInitiateData) =>
        this.handleCallInitiate(socket, io, data)
      );
      socket.on('call-accept', (callId: string) =>
        this.handleCallAccept(io, callId, socket)
      );
      socket.on('call-reject', (callId: string) =>
        this.handleCallReject(io, callId, socket)
      );
      socket.on('call-signal', (data: ICallSignalData) =>
        this.handleCallSignal(io, data, socket)
      );
      socket.on('call-end', (callId: string) =>
        this.handleCallEnd(io, callId, socket)
      );
      socket.on('message-reaction', (data: IMessageReactionData) =>
        this.handleMessageReaction(socket, io, data)
      );
      socket.on('messageRead', async ({ chatId, userId }) => {
        await Message.updateMany(
          { chat: chatId, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        // Emit updated chat to clients
        const updatedChat = await Chat.findById(chatId)
          .populate('users', 'name email image onlineStatus')
          .populate('latestMessage');

        io.to(chatId).emit('updateChat', updatedChat);
      });


      socket.on(
        'delete-message',
        (data: { messageId: string; chatId: string }) => {
          SocketHelper.handleDeleteMessage(socket, io, data);
        }
      );

      socket.on('leave-chat', (chatId: string) =>
        this.handleLeaveChat(socket, chatId)
      );

      socket.on('disconnect', () => this.handleDisconnect(socket, io));
    });
  }

  private static getSocketsByUserId(userId: string): string[] {
    return Array.from(this.connectedSockets.entries())
      .filter(([, id]) => id === userId)
      .map(([socketId]) => socketId);
  }

  static getConnectedUsers(): string[] {
    return Array.from(new Set(this.connectedSockets.values()));
  }

  static isUserOnline(userId: string): boolean {
    return Array.from(this.connectedSockets.values()).includes(userId);
  }
}

export const socketHelper = SocketHelper;
