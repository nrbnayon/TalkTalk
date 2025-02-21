// hooks/useChatMessages.js
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateMessage,
  deleteMessage,
} from '../redux/features/messages/messageSlice';

export const useChatMessages = (chatId, initialMessages = []) => {
  const [messages, setMessages] = useState(initialMessages);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);

  const {
    socket,
    joinChat,
    leaveChat,
    sendMessage: socketSendMessage,
    markMessageRead: socketMarkRead,
  } = useSocket();

  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = socket;

    if (socketRef.current && chatId && user) {
      joinChat(chatId, user);

      const handleNewMessage = message => {
        console.log('New message received in hook:', message);
        if (message.chat._id.toString() === chatId.toString()) {
          setMessages(prev => [...prev, message]);
        }
      };

      const handleMessageUpdate = updatedMessage => {
        if (updatedMessage.chat.toString() === chatId.toString()) {
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
                ? {
                    ...msg,
                    isDeleted: true,
                    content: 'This message was deleted',
                  }
                : msg
            )
          );
          dispatch(deleteMessage({ chatId, messageId: data.messageId }));
        }
      };

      const handleTypingUpdate = ({ userId, isTyping }) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (isTyping) {
            newSet.add(userId);
          } else {
            newSet.delete(userId);
          }
          return newSet;
        });
      };

      socketRef.current.on('message-received', handleNewMessage);
      socketRef.current.on('message-updated', handleMessageUpdate);
      socketRef.current.on('message-deleted', handleMessageDelete);
      socketRef.current.on('typing-update', handleTypingUpdate);

      return () => {
        if (socketRef.current) {
          socketRef.current.off('message-received', handleNewMessage);
          socketRef.current.off('message-updated', handleMessageUpdate);
          socketRef.current.off('message-deleted', handleMessageDelete);
          socketRef.current.off('typing-update', handleTypingUpdate);
        }
        leaveChat(chatId);
      };
    }
  }, [chatId, socket, joinChat, leaveChat, dispatch, user]);

  const sendMessage = useCallback(
    (content, replyToId = null) => {
      if (socketRef.current) {
        const messageData = {
          content,
          chatId,
          replyToId,
        };
        socketRef.current.emit('new-message', messageData);
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

  const pinMessage = useCallback(
    messageId => {
      if (socketRef.current) {
        socketRef.current.emit('pin-message', { messageId, chatId });
      }
    },
    [chatId]
  );

  const addReaction = useCallback(
    (messageId, emoji) => {
      if (socketRef.current) {
        socketRef.current.emit('add-reaction', { messageId, chatId, emoji });
      }
    },
    [chatId]
  );

  const startTyping = useCallback(
    userId => {
      if (socketRef.current) {
        socketRef.current.emit('typing-start', { chatId, userId });
      }
    },
    [chatId]
  );

  const stopTyping = useCallback(
    userId => {
      if (socketRef.current) {
        socketRef.current.emit('typing-stop', { chatId, userId });
      }
    },
    [chatId]
  );

  return {
    messages,
    sendMessage,
    deleteMessage: deleteMsg,
    pinMessage,
    addReaction,
    startTyping,
    stopTyping,
    typingUsers: Array.from(typingUsers),
  };
};
