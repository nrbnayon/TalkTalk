// hooks/useChatMessages.js
'use client';
import { useState, useEffect, useCallback } from 'react';
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

  // Join chat room when component mounts
  useEffect(() => {
    if (socket && chatId && user) {
      joinChat(chatId, user);

      const handleNewMessage = message => {
        console.log('New message received in hook:', message);
        // Ensure we compare the correct chat ID properties
        if (message.chat._id.toString() === chatId.toString()) {
          setMessages(prev => [...prev, message]);
        }
      };

      // Listen for message updates (edits, pins, reactions)
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

      // Listen for message deletions
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

      // Listen for typing status
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

      socket.on('message-received', handleNewMessage);
      socket.on('message-updated', handleMessageUpdate);
      socket.on('message-deleted', handleMessageDelete);
      socket.on('typing-update', handleTypingUpdate);

      return () => {
        leaveChat(chatId);
        socket.off('message-received', handleNewMessage);
        socket.off('message-updated', handleMessageUpdate);
        socket.off('message-deleted', handleMessageDelete);
        socket.off('typing-update', handleTypingUpdate);
      };
    }
  }, [chatId, socket, joinChat, leaveChat, dispatch, user]);

  const sendMessage = useCallback(
    (content, replyToId = null) => {
      const messageData = {
        content,
        chatId,
        replyToId,
      };
      socketSendMessage(messageData);
    },
    [chatId, socketSendMessage]
  );

  const deleteMsg = useCallback(
    messageId => {
      if (socket) {
        socket.emit('delete-message', { messageId, chatId });
      }
    },
    [socket, chatId]
  );

  const pinMessage = useCallback(
    messageId => {
      if (socket) {
        socket.emit('pin-message', { messageId, chatId });
      }
    },
    [socket, chatId]
  );

  const addReaction = useCallback(
    (messageId, emoji) => {
      if (socket) {
        socket.emit('add-reaction', { messageId, chatId, emoji });
      }
    },
    [socket, chatId]
  );

  const startTyping = useCallback(
    userId => {
      if (socket) {
        socket.emit('typing-start', { chatId, userId });
      }
    },
    [socket, chatId]
  );

  const stopTyping = useCallback(
    userId => {
      if (socket) {
        socket.emit('typing-stop', { chatId, userId });
      }
    },
    [socket, chatId]
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
