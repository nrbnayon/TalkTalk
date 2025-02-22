// hooks/useChatMessages.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useDispatch } from 'react-redux';
import {
  updateMessage,
  deleteMessage,
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

// // hooks/useChatMessages.js
// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useSocket } from '../context/SocketContext';
// import { useDispatch } from 'react-redux';
// import {
//   updateMessage,
//   deleteMessage,
// } from '../redux/features/messages/messageSlice';

// export const useChatMessages = (chatId, initialMessages = []) => {
//   const [messages, setMessages] = useState(initialMessages);
//   const [typingUsers, setTypingUsers] = useState(new Set());
//   const dispatch = useDispatch();
//   const {
//     socket,
//     joinChat,
//     leaveChat,
//     sendMessage: socketSendMessage,
//     markMessageRead: socketMarkRead,
//   } = useSocket();

//   const socketRef = useRef(null);
//   const typingTimeoutRef = useRef({});
//   const messageQueueRef = useRef([]);
//   const processingQueueRef = useRef(false);

//   // Process message queue to ensure ordered delivery
//   const processMessageQueue = useCallback(() => {
//     if (processingQueueRef.current || messageQueueRef.current.length === 0)
//       return;

//     processingQueueRef.current = true;
//     const message = messageQueueRef.current.shift();

//     setMessages(prev => {
//       console.log('[useChatMessages] Processing message queue:', {
//         currentMessages: prev.length,
//         newMessage: message._id,
//       });

//       const newMessages = [...prev];
//       const existingIndex = newMessages.findIndex(
//         msg => msg._id === message._id
//       );

//       if (existingIndex === -1) {
//         newMessages.push(message);
//       } else {
//         newMessages[existingIndex] = message;
//       }

//       return newMessages.sort(
//         (a, b) =>
//           new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//       );
//     });

//     processingQueueRef.current = false;
//     if (messageQueueRef.current.length > 0) {
//       processMessageQueue();
//     }
//   }, []);

//   // Add message to queue
//   const queueMessage = useCallback(
//     message => {
//       console.log('[useChatMessages] Queueing new message:', message._id);
//       messageQueueRef.current.push(message);
//       processMessageQueue();
//     },
//     [processMessageQueue]
//   );

//   // Update messages when initialMessages changes
//   useEffect(() => {
//     console.log(
//       '[useChatMessages] Initial messages updated:',
//       initialMessages.length
//     );
//     setMessages(initialMessages);
//   }, [initialMessages]);

//   useEffect(() => {
//     socketRef.current = socket;

//     if (socketRef.current && chatId) {
//       console.log(
//         '[useChatMessages] Setting up socket listeners for chat:',
//         chatId
//       );

//       const handleNewMessage = message => {
//         console.log('[useChatMessages] New message received:', message);
//         if (message.chat._id === chatId || message.chat === chatId) {
//           queueMessage(message);
//         }
//       };

//       const handleMessageUpdate = updatedMessage => {
//         console.log('[useChatMessages] Message updated:', updatedMessage);
//         if (updatedMessage.chat.toString() === chatId) {
//           setMessages(prev =>
//             prev.map(msg =>
//               msg._id === updatedMessage._id ? updatedMessage : msg
//             )
//           );
//           dispatch(updateMessage(updatedMessage));
//         }
//       };

//       const handleMessageDelete = data => {
//         console.log('[useChatMessages] Message deleted:', data);
//         if (data.chatId === chatId) {
//           setMessages(prev =>
//             prev.map(msg =>
//               msg._id === data.messageId
//                 ? {
//                     ...msg,
//                     isDeleted: true,
//                     content: 'This message was deleted',
//                   }
//                 : msg
//             )
//           );
//           dispatch(deleteMessage({ chatId, messageId: data.messageId }));
//         }
//       };

//       const handleTypingUpdate = ({ userId, isTyping, name }) => {
//         console.log('[useChatMessages] Typing update:', {
//           userId,
//           isTyping,
//           name,
//         });

//         // Clear existing timeout for this user
//         if (typingTimeoutRef.current[userId]) {
//           clearTimeout(typingTimeoutRef.current[userId]);
//         }

//         setTypingUsers(prev => {
//           const newSet = new Set(prev);
//           if (isTyping) {
//             newSet.add({ userId, name });
//             // Set timeout to remove typing indicator after 3 seconds
//             typingTimeoutRef.current[userId] = setTimeout(() => {
//               setTypingUsers(current => {
//                 const updated = new Set(
//                   Array.from(current).filter(user => user.userId !== userId)
//                 );
//                 return updated;
//               });
//             }, 3000);
//           } else {
//             newSet.delete(
//               Array.from(newSet).find(user => user.userId === userId)
//             );
//           }
//           return newSet;
//         });
//       };

//       // Register event listeners
//       socketRef.current.on('message-received', handleNewMessage);
//       socketRef.current.on('message-updated', handleMessageUpdate);
//       socketRef.current.on('message-deleted', handleMessageDelete);
//       socketRef.current.on('typing-update', handleTypingUpdate);

//       return () => {
//         console.log('[useChatMessages] Cleaning up socket listeners');
//         if (socketRef.current) {
//           socketRef.current.off('message-received', handleNewMessage);
//           socketRef.current.off('message-updated', handleMessageUpdate);
//           socketRef.current.off('message-deleted', handleMessageDelete);
//           socketRef.current.off('typing-update', handleTypingUpdate);
//         }

//         // Clear all typing timeouts
//         Object.values(typingTimeoutRef.current).forEach(timeout => {
//           clearTimeout(timeout);
//         });
//         typingTimeoutRef.current = {};
//       };
//     }
//   }, [chatId, socket, dispatch, queueMessage]);

//   const sendMessage = useCallback(
//     (content, replyToId = null) => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Sending message:', {
//           content,
//           chatId,
//           replyToId,
//         });
//         socketRef.current.emit('new-message', { content, chatId, replyToId });
//       }
//     },
//     [chatId]
//   );

//   const deleteMsg = useCallback(
//     messageId => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Deleting message:', messageId);
//         socketRef.current.emit('delete-message', { messageId, chatId });
//       }
//     },
//     [chatId]
//   );

//   const startTyping = useCallback(
//     (userId, name) => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Start typing:', {
//           chatId,
//           userId,
//           name,
//         });
//         socketRef.current.emit('typing-start', { chatId, userId, name });
//       }
//     },
//     [chatId]
//   );

//   const stopTyping = useCallback(
//     userId => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Stop typing:', { chatId, userId });
//         socketRef.current.emit('typing-stop', { chatId, userId });
//       }
//     },
//     [chatId]
//   );

//   return {
//     messages,
//     sendMessage,
//     deleteMessage: deleteMsg,
//     startTyping,
//     stopTyping,
//     typingUsers: Array.from(typingUsers),
//   };
// };

// 'use client';
// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useSocket } from '../context/SocketContext';
// import { useDispatch } from 'react-redux';
// import {
//   updateMessage,
//   deleteMessage,
// } from '../redux/features/messages/messageSlice';

// export const useChatMessages = (chatId, initialMessages = []) => {
//   const [messages, setMessages] = useState(initialMessages);
//   const [typingUsers, setTypingUsers] = useState(new Set());
//   const dispatch = useDispatch();
//   const {
//     socket,
//     joinChat,
//     leaveChat,
//     sendMessage: socketSendMessage,
//     markMessageRead: socketMarkRead,
//   } = useSocket();

//   const socketRef = useRef(null);
//   const typingTimeoutRef = useRef({});
//   const messageQueueRef = useRef([]);
//   const processingQueueRef = useRef(false);

//   // Process message queue to ensure ordered delivery
//   const processMessageQueue = useCallback(() => {
//     if (processingQueueRef.current || messageQueueRef.current.length === 0)
//       return;

//     processingQueueRef.current = true;
//     const message = messageQueueRef.current.shift();

//     setMessages(prev => {
//       const newMessages = [...prev];
//       const existingIndex = newMessages.findIndex(
//         msg => msg._id === message._id
//       );

//       if (existingIndex === -1) {
//         newMessages.push(message);
//       } else {
//         newMessages[existingIndex] = message;
//       }

//       return newMessages.sort(
//         (a, b) =>
//           new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
//       );
//     });

//     processingQueueRef.current = false;
//     if (messageQueueRef.current.length > 0) {
//       processMessageQueue();
//     }
//   }, []);

//   // Add message to queue
//   const queueMessage = useCallback(
//     message => {
//       messageQueueRef.current.push(message);
//       processMessageQueue();
//     },
//     [processMessageQueue]
//   );

//   useEffect(() => {
//     socketRef.current = socket;

//     if (socketRef.current && chatId) {
//       console.log(
//         '[useChatMessages] Setting up socket listeners for chat:',
//         chatId
//       );

//       const handleNewMessage = message => {
//         console.log('[useChatMessages] New message received:', message);
//         if (message.chat._id === chatId) {
//           queueMessage(message);
//         }
//       };

//       const handleMessageUpdate = updatedMessage => {
//         console.log('[useChatMessages] Message updated:', updatedMessage);
//         if (updatedMessage.chat.toString() === chatId) {
//           setMessages(prev =>
//             prev.map(msg =>
//               msg._id === updatedMessage._id ? updatedMessage : msg
//             )
//           );
//           dispatch(updateMessage(updatedMessage));
//         }
//       };

//       const handleMessageDelete = data => {
//         console.log('[useChatMessages] Message deleted:', data);
//         if (data.chatId === chatId) {
//           setMessages(prev =>
//             prev.map(msg =>
//               msg._id === data.messageId
//                 ? {
//                     ...msg,
//                     isDeleted: true,
//                     content: 'This message was deleted',
//                   }
//                 : msg
//             )
//           );
//           dispatch(deleteMessage({ chatId, messageId: data.messageId }));
//         }
//       };

//       const handleTypingUpdate = ({ userId, isTyping }) => {
//         console.log('[useChatMessages] Typing update:', { userId, isTyping });

//         // Clear existing timeout for this user
//         if (typingTimeoutRef.current[userId]) {
//           clearTimeout(typingTimeoutRef.current[userId]);
//         }

//         setTypingUsers(prev => {
//           const newSet = new Set(prev);
//           if (isTyping) {
//             newSet.add(userId);
//             // Set timeout to remove typing indicator after 3 seconds
//             typingTimeoutRef.current[userId] = setTimeout(() => {
//               setTypingUsers(current => {
//                 const updated = new Set(current);
//                 updated.delete(userId);
//                 return updated;
//               });
//             }, 3000);
//           } else {
//             newSet.delete(userId);
//           }
//           return newSet;
//         });
//       };

//       // Register event listeners
//       socketRef.current.on('message-received', handleNewMessage);
//       socketRef.current.on('message-updated', handleMessageUpdate);
//       socketRef.current.on('message-deleted', handleMessageDelete);
//       socketRef.current.on('typing-update', handleTypingUpdate);

//       // Join chat room
//       joinChat(chatId);

//       return () => {
//         console.log('[useChatMessages] Cleaning up socket listeners');
//         if (socketRef.current) {
//           socketRef.current.off('message-received', handleNewMessage);
//           socketRef.current.off('message-updated', handleMessageUpdate);
//           socketRef.current.off('message-deleted', handleMessageDelete);
//           socketRef.current.off('typing-update', handleTypingUpdate);
//         }

//         // Clear all typing timeouts
//         Object.values(typingTimeoutRef.current).forEach(timeout => {
//           clearTimeout(timeout);
//         });
//         typingTimeoutRef.current = {};

//         // Leave chat room
//         leaveChat(chatId);
//       };
//     }
//   }, [chatId, socket, dispatch, joinChat, leaveChat, queueMessage]);

//   const sendMessage = useCallback(
//     (content, replyToId = null) => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Sending message:', {
//           content,
//           chatId,
//           replyToId,
//         });
//         socketRef.current.emit('new-message', { content, chatId, replyToId });
//       }
//     },
//     [chatId]
//   );

//   const deleteMsg = useCallback(
//     messageId => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Deleting message:', messageId);
//         socketRef.current.emit('delete-message', { messageId, chatId });
//       }
//     },
//     [chatId]
//   );

//   const startTyping = useCallback(
//     userId => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Start typing:', { chatId, userId });
//         socketRef.current.emit('typing-start', { chatId, userId });
//       }
//     },
//     [chatId]
//   );

//   const stopTyping = useCallback(
//     userId => {
//       if (socketRef.current) {
//         console.log('[useChatMessages] Stop typing:', { chatId, userId });
//         socketRef.current.emit('typing-stop', { chatId, userId });
//       }
//     },
//     [chatId]
//   );

//   return {
//     messages,
//     sendMessage,
//     deleteMessage: deleteMsg,
//     startTyping,
//     stopTyping,
//     typingUsers: Array.from(typingUsers),
//   };
// };
