// src\helpers\socketHelper.ts
import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../shared/logger';
import { UserService } from '../app/modules/user/user.service';
import {
  ICallSession,
  IMessage,
} from '../app/modules/messages/messages.interface';
import { Types } from 'mongoose';

interface ICallSignal {
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
}

class SocketHelper {
  private static connectedSockets = new Map<string, string>();
  private static typingUsers = new Map<string, NodeJS.Timeout>();
  private static activeCalls = new Map<string, ICallSession>();

  static socket(io: Server) {
    io.on('connection', (socket: Socket) => {
      logger.info(colors.blue(`[SocketHelper] User connected: ${socket.id}`));

      // Handle user coming online
      socket.on('user-online', async (userId: string) => {
        try {
          // Store socket-to-user mapping
          this.connectedSockets.set(socket.id, userId);

          logger.info(
            colors.green(`[SocketHelper] User ${userId} is now online`)
          );

          // Update user online status
          await UserService.updateUserOnlineStatus(userId, true);

          // Fetch and broadcast online users
          const onlineUsers = await UserService.getOnlineUsers();
          io.emit('online-users-update', onlineUsers);

          logger.info(
            colors.green(
              `[SocketHelper] Online users found: ${onlineUsers.length}`
            )
          );
        } catch (error) {
          logger.error(
            colors.red(`[SocketHelper] Error setting user ${userId} online: `),
            error
          );
        }
      });

      // Handle joining chat rooms
      socket.on('join-chat', (chatId: string) => {
        socket.join(chatId);
        logger.info(colors.cyan(`[SocketHelper] User joined chat: ${chatId}`));
      });

      // Handle leaving chat rooms
      socket.on('leave-chat', (chatId: string) => {
        socket.leave(chatId);
        logger.info(colors.cyan(`[SocketHelper] User left chat: ${chatId}`));
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { chatId: string; userId: string }) => {
        const { chatId, userId } = data;

        // Clear existing timeout if any
        if (this.typingUsers.has(`${chatId}-${userId}`)) {
          clearTimeout(this.typingUsers.get(`${chatId}-${userId}`));
        }

        // Broadcast typing status to chat room
        socket.to(chatId).emit('typing-update', {
          chatId,
          userId,
          isTyping: true,
        });

        // Set timeout to automatically stop typing after 3 seconds
        const timeout = setTimeout(() => {
          socket.to(chatId).emit('typing-update', {
            chatId,
            userId,
            isTyping: false,
          });
          this.typingUsers.delete(`${chatId}-${userId}`);
        }, 3000);

        this.typingUsers.set(`${chatId}-${userId}`, timeout);
      });

      socket.on('typing-stop', (data: { chatId: string; userId: string }) => {
        const { chatId, userId } = data;

        // Clear typing timeout
        if (this.typingUsers.has(`${chatId}-${userId}`)) {
          clearTimeout(this.typingUsers.get(`${chatId}-${userId}`));
          this.typingUsers.delete(`${chatId}-${userId}`);
        }

        // Broadcast typing stopped
        socket.to(chatId).emit('typing-update', {
          chatId,
          userId,
          isTyping: false,
        });
      });

      // Handle new messages
      socket.on('new-message', (message: IMessage) => {
        if (!message.chat || !message.sender) {
          logger.error(colors.red('[SocketHelper] Invalid message format'));
          return;
        }

        // Broadcast to all users in the chat except sender
        socket.to(message.chat.toString()).emit('message-received', message);

        logger.info(
          colors.green(
            `[SocketHelper] New message broadcast in chat: ${message.chat}`
          )
        );
      });

      // Handle message read status
      socket.on(
        'message-read',
        (data: { messageId: string; chatId: string; userId: string }) => {
          const { messageId, chatId, userId } = data;

          // Broadcast read status to chat room
          socket.to(chatId).emit('message-read-update', {
            messageId,
            userId,
            chatId,
          });
        }
      );

      // Handle call signaling
      socket.on(
        'call-initiate',
        async (data: {
          chatId: string;
          callType: 'audio' | 'video';
          participants: Types.ObjectId[];
        }) => {
          const { chatId, callType, participants } = data;
          const userId = this.connectedSockets.get(socket.id);

          if (!userId) return;

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

          // Notify all participants
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
      );

      socket.on('call-accept', (callId: string) => {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId) return;

        const call = this.activeCalls.get(callId);
        if (call) {
          call.status = 'ongoing';
          this.activeCalls.set(callId, call);

          // Notify all participants
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
      });

      socket.on('call-reject', (callId: string) => {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId) return;

        const call = this.activeCalls.get(callId);
        if (call) {
          call.status = 'rejected';
          call.endTime = new Date();
          this.activeCalls.delete(callId);

          // Notify all participants
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
      });

      socket.on(
        'call-signal',
        (data: {
          callId: string;
          targetUserId: string;
          signal: ICallSignal;
        }) => {
          const { callId, targetUserId, signal } = data;
          const userId = this.connectedSockets.get(socket.id);

          if (!userId) return;

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
          }
        }
      );

      socket.on('call-end', (callId: string) => {
        const userId = this.connectedSockets.get(socket.id);
        if (!userId) return;

        const call = this.activeCalls.get(callId);
        if (call) {
          call.status = 'ended';
          call.endTime = new Date();
          this.activeCalls.delete(callId);

          // Notify all participants
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
      });

      // Handle reactions
      socket.on(
        'message-reaction',
        (data: { messageId: string; chatId: string; emoji: string }) => {
          const { messageId, chatId, emoji } = data;
          const userId = this.connectedSockets.get(socket.id);

          if (userId) {
            socket.to(chatId).emit('reaction-update', {
              messageId,
              userId,
              emoji,
            });
          }
        }
      );

      socket.on('disconnect', async () => {
        const userId = this.connectedSockets.get(socket.id);

        if (userId) {
          try {
            // Check if user has any other active connections
            const userSocketCount = Array.from(
              this.connectedSockets.entries()
            ).filter(([, id]) => id === userId).length;

            // If no other connections, set user offline
            if (userSocketCount <= 1) {
              await UserService.updateUserOnlineStatus(userId, false);

              const onlineUsers = await UserService.getOnlineUsers();
              io.emit('online-users-update', onlineUsers);

              logger.info(
                colors.red(`[SocketHelper] User ${userId} set offline`)
              );
            }

            // Remove the socket from tracking
            this.connectedSockets.delete(socket.id);
          } catch (error) {
            logger.error(
              colors.red(`[SocketHelper] Error handling user disconnect: `),
              error
            );
          }
        }

        logger.info(
          colors.red(`[SocketHelper] User disconnected: ${socket.id}`)
        );
      });
    });
  }
  private static getSocketsByUserId(userId: string): string[] {
    return Array.from(this.connectedSockets.entries())
      .filter(([, id]) => id === userId)
      .map(([socketId]) => socketId);
  }

  // Helper method to get all connected users
  static getConnectedUsers(): string[] {
    return Array.from(new Set(this.connectedSockets.values()));
  }

  // Helper method to check if a user is online
  static isUserOnline(userId: string): boolean {
    return Array.from(this.connectedSockets.values()).includes(userId);
  }
}

export const socketHelper = SocketHelper;
