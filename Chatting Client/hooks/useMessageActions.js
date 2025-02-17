// hooks/useMessageActions.js
import { useSocket } from '@/context/SocketContext';
import {
  markMessageAsRead,
  pinMessage,
  unpinMessage,
} from '@/redux/features/messages/messageSlice';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

export const useMessageActions = chatId => {
  const dispatch = useDispatch();
  const { socket } = useSocket();

  // Mark message as read
  const markAsRead = useCallback(
    async (messageId, userId) => {
      try {
        const result = await dispatch(
          markMessageAsRead({ messageId, chatId, userId })
        ).unwrap();

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('message-read', {
            messageId,
            chatId,
            userId,
            readBy: result.readData.readBy,
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    },
    [dispatch, chatId, socket]
  );

  // Pin message
  const handlePinMessage = useCallback(
    async messageId => {
      try {
        const result = await dispatch(
          pinMessage({ messageId, chatId })
        ).unwrap();

        // Emit socket event for real-time updates
        if (socket && result.pinnedData) {
          socket.emit('message-updated', {
            messageId,
            chatId,
            updates: {
              isPinned: true,
              pinnedAt: result.pinnedData.pinnedAt,
            },
          });
        }
        return result;
      } catch (error) {
        console.error('Error pinning message:', error);
        throw error; // Propagate error for handling in UI
      }
    },
    [dispatch, chatId, socket]
  );

  // Unpin message
  const handleUnpinMessage = useCallback(
    async messageId => {
      try {
        const result = await dispatch(
          unpinMessage({ messageId, chatId })
        ).unwrap();

        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('message-updated', {
            messageId,
            chatId,
            updates: {
              isPinned: false,
              pinnedAt: null,
            },
          });
        }
        return result;
      } catch (error) {
        console.error('Error unpinning message:', error);
        throw error; // Propagate error for handling in UI
      }
    },
    [dispatch, chatId, socket]
  );

  // Get pinned messages sorted by pinnedAt
  const getPinnedMessages = useCallback(messages => {
    return messages
      .filter(msg => msg.isPinned)
      .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt));
  }, []);

  return {
    markAsRead,
    handlePinMessage,
    handleUnpinMessage,
    getPinnedMessages,
  };
};
