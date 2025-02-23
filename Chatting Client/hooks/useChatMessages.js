// hooks/useChatMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useDispatch } from 'react-redux';
import {
  updateMessage,
  deleteMessage,
  addMessage,
} from '../redux/features/messages/messageSlice';

const TYPING_TIMEOUT = 3000;

export const useChatMessages = (chatId, initialMessages = []) => {
  const [messages, setMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const dispatch = useDispatch();
  const {
    socket,
    joinChat,
    leaveChat,
    startTyping: contextStartTyping,
    stopTyping: contextStopTyping,
  } = useSocket();

  const socketRef = useRef(socket);
  const typingTimeoutRef = useRef({});
  const messageQueueRef = useRef([]);
  const processingQueueRef = useRef(false);

  // Sync socket reference
  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Process message queue with improved error handling
  const processMessageQueue = useCallback(() => {
    if (processingQueueRef.current || messageQueueRef.current.length === 0)
      return;

    try {
      processingQueueRef.current = true;
      const message = messageQueueRef.current.shift();

      setMessages(prev => {
        const newMessages = [...prev];
        const existingIndex = newMessages.findIndex(
          msg => msg._id === message._id
        );

        if (existingIndex === -1) {
          newMessages.push(message);
        } else {
          newMessages[existingIndex] = message;
        }

        return newMessages.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
    } catch (error) {
      console.error('[useChatMessages] Error processing message queue:', error);
    } finally {
      processingQueueRef.current = false;
      if (messageQueueRef.current.length > 0) {
        processMessageQueue();
      }
    }
  }, []);

  const queueMessage = useCallback(
    message => {
      messageQueueRef.current.push(message);
      processMessageQueue();
    },
    [processMessageQueue]
  );

  // Initialize chat and handle cleanup
  useEffect(() => {
    if (socket && chatId) {
      joinChat(chatId);
      return () => leaveChat(chatId);
    }
  }, [socket, chatId, joinChat, leaveChat]);

  // Update messages when initialMessages changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Socket event handlers
  useEffect(() => {
    if (!socketRef.current || !chatId) return;

    const handleNewMessage = message => {
      if (message.chat._id === chatId || message.chat === chatId) {
        dispatch(addMessage({ message }));
      } else {
        queueMessage(message);
      }
    };

    const handleMessageUpdate = updatedMessage => {
      if (updatedMessage.chat.toString() === chatId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === updatedMessage._id ? updatedMessage : msg
          )
        );
        dispatch(updateMessage(updatedMessage));
      }
    };

    const handleMessageDelete = data => {
      if (data.chatId === chatId) {
        setMessages(prev =>
          prev.map(msg =>
            msg._id === data.messageId
              ? { ...msg, isDeleted: true, content: 'This message was deleted' }
              : msg
          )
        );
        dispatch(deleteMessage({ chatId, messageId: data.messageId }));
      }
    };

    const handleTypingUpdate = ({ userId, isTyping, name }) => {
      console.log(' handleTypingUpdate', userId, isTyping, name);
      clearTimeout(typingTimeoutRef.current[userId]);

      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add({ userId, name });
          typingTimeoutRef.current[userId] = setTimeout(() => {
            setTypingUsers(
              current =>
                new Set(
                  Array.from(current).filter(user => user.userId !== userId)
                )
            );
          }, TYPING_TIMEOUT);
        } else {
          newSet.delete(
            Array.from(newSet).find(user => user.userId === userId)
          );
        }
        return newSet;
      });
    };

    const events = {
      'message-received': handleNewMessage,
      'message-updated': handleMessageUpdate,
      'message-deleted': handleMessageDelete,
      'typing-update': handleTypingUpdate,
    };

    // Register event listeners
    Object.entries(events).forEach(([event, handler]) => {
      socketRef.current.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socketRef.current?.off(event, handler);
      });

      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
      typingTimeoutRef.current = {};
    };
  }, [chatId, dispatch, queueMessage]);

  // Message actions
  const sendMessage = useCallback(
    (content, replyToId = null) => {
      if (socketRef.current) {
        socketRef.current.emit('new-message', { content, chatId, replyToId });
      }
    },
    [chatId]
  );

  const deleteMsg = useCallback(
    messageId => {
      if (socketRef.current) {
        socketRef.current.emit('delete-message', { messageId, chatId });
      }
    },
    [chatId]
  );

  const startTyping = useCallback(
    (userId, name) => {
      contextStartTyping(chatId);
    },
    [chatId, contextStartTyping]
  );

  const stopTyping = useCallback(
    userId => {
      contextStopTyping(chatId);
    },
    [chatId, contextStopTyping]
  );

  return {
    messages,
    sendMessage,
    deleteMessage: deleteMsg,
    startTyping,
    stopTyping,
    typingUsers: Array.from(typingUsers),
  };
};
