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
        // No need to emit here—the backend already sends a 'message-updated' event.
        return result;
      } catch (error) {
        console.error('Error toggling pin status:', error);
        throw error;
      }
    },
    [dispatch, chatId]
  );

  const handleReaction = useCallback(
    (messageId, emoji) => {
      if (socketRef.current) {
        // Emit reaction event to the server.
        socketRef.current.emit('message-reaction', {
          messageId,
          chatId,
          emoji,
        });
      } else {
        console.warn('Socket not connected. Cannot send reaction.');
      }
    },
    [chatId]
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
