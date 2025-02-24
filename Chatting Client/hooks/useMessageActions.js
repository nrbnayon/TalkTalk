// hooks/useMessageActions.js
import { useSocket } from '@/context/SocketContext';
import {
  markMessageAsRead,
  pinMessage,
  unpinMessage,
  updateMessage,
} from '@/redux/features/messages/messageSlice';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

export const useMessageActions = chatId => {
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const socketRef = useRef(socket);

  // Sync socket reference
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  const markAsRead = useCallback(
    async (messageId, userId) => {
      try {
        const result = await dispatch(
          markMessageAsRead({ messageId, chatId, userId })
        ).unwrap();

        if (socketRef.current) {
          socketRef.current.emit('message-read', {
            messageId,
            chatId,
            userId,
            readBy: result.readData.readBy,
          });
        }
        return result;
      } catch (error) {
        console.error('Error marking message as read:', error);
        throw error;
      }
    },
    [dispatch, chatId]
  );

  const handlePinToggle = useCallback(
    async (messageId, isPinned) => {
      try {
        const action = isPinned ? unpinMessage : pinMessage;
        const result = await dispatch(action({ messageId, chatId })).unwrap();

        if (socketRef.current) {
          socketRef.current.emit('message-updated', {
            messageId,
            chatId,
            updates: {
              isPinned: !isPinned,
              pinnedAt: !isPinned ? new Date().toISOString() : null,
            },
          });
        }
        return result;
      } catch (error) {
        console.error('Error toggling pin status:', error);
        throw error;
      }
    },
    [dispatch, chatId]
  );

  const handleReaction = useCallback(
    async (messageId, emoji) => {
      try {
        const response = await fetch(`/api/messages/${messageId}/react`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });

        if (!response.ok) {
          throw new Error('Failed to toggle reaction');
        }

        const { data } = await response.json();
        dispatch(updateMessage(data));

        if (socketRef.current) {
          socketRef.current.emit('message-reaction', {
            messageId,
            chatId,
            emoji,
          });
        }

        return data;
      } catch (error) {
        console.error('Error handling reaction:', error);
        throw error;
      }
    },
    [dispatch, chatId]
  );

  const getPinnedMessages = useCallback(messages => {
    return messages
      .filter(msg => msg.isPinned)
      .sort((a, b) => new Date(b.pinnedAt) - new Date(a.pinnedAt));
  }, []);

  return {
    markAsRead,
    handlePinToggle,
    handleReaction,
    getPinnedMessages,
  };
};
