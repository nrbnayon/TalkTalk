// frontend/ context/SocketContext.js
'use client';
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import socketServiceInstance from '../services/socketService';
import {
  addMessage,
  updateMessage,
  markMessageAsRead,
  deleteMessage,
} from '@/redux/features/messages/messageSlice';

const SocketContext = createContext({
  socket: null,
  onlineUsers: [],
  joinChat: () => {},
  leaveChat: () => {},
  sendMessage: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  markMessageRead: () => {},
  initiateCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  sendCallSignal: () => {},
  endCall: () => {},
  sendReaction: () => {},
  typingUsers: new Map(),
  incomingCall: null,
  currentCall: null,
  isUserOnline: () => false,
});

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);

  const { user, token } = useSelector(state => state.auth);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const socketRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      if (!user?._id || !token) {
        console.log('[SocketContext] No user or token available');
        return;
      }

      try {
        console.log(
          '[SocketContext] Initializing socket connection for user:',
          user._id
        );
        const newSocket = await socketServiceInstance.connect(token);

        if (isMounted) {
          setSocket(newSocket);
          socketRef.current = newSocket;
          socketServiceInstance.setUserOnline(user._id);
          console.log(
            '[SocketContext] Socket connected successfully:',
            newSocket?.id
          );

          // Fetch initial online users immediately after connection
          fetchOnlineUsers();
        }
      } catch (error) {
        console.error('[SocketContext] Socket connection error:', error);
      }
    };

    const fetchOnlineUsers = async () => {
      try {
        console.log('[SocketContext] Fetching online users');
        const response = await fetch(`${apiUrl}/api/v1/user/online-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();

        if (data.success) {
          console.log('[SocketContext] Online users fetched:', data.data);
          setOnlineUsers(data.data);
        }
      } catch (error) {
        console.error('[SocketContext] Error fetching online users:', error);
      }
    };

    if (user && token) {
      initializeSocket();

      // Set up periodic online users fetch
      const onlineUsersInterval = setInterval(fetchOnlineUsers, 30000); // Every 30 seconds

      return () => {
        isMounted = false;
        clearInterval(onlineUsersInterval);
        if (socketRef.current) {
          console.log('[SocketContext] Cleaning up socket connection');
          socketServiceInstance.disconnect();
          socketRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [apiUrl, user, token]);

  // Set up event listeners
  useEffect(() => {
    if (!socketRef.current) return;

    const currentSocket = socketRef.current;

    // Online users update
    currentSocket.on('online-users-update', users => {
      console.log('[SocketContext] Online users updated:', users);
      setOnlineUsers(prevUsers => {
        // Only update if the users list has actually changed
        const hasChanged = JSON.stringify(prevUsers) !== JSON.stringify(users);
        return hasChanged ? users : prevUsers;
      });
    });

    // Handle new messages
    const handleNewMessage = message => {
      console.log('[SocketContext] New message received:', message);
      dispatch(addMessage(message));
    };

    // Handle message updates
    const handleMessageUpdate = updatedMessage => {
      console.log('[SocketContext] Message updated:', updatedMessage);
      dispatch(updateMessage(updatedMessage));
    };

    // Handle message deletion
    const handleMessageDelete = ({ messageId, chatId }) => {
      console.log('[SocketContext] Message deleted:', messageId);
      dispatch(deleteMessage({ messageId, chatId }));
    };

    // Handle read status updates
    const handleMessageRead = ({ messageId, userId, chatId }) => {
      console.log('[SocketContext] Message read:', {
        messageId,
        userId,
        chatId,
      });
      dispatch(markMessageAsRead({ messageId, chatId, userId }));
    };

    // Handle typing status with debounce
    const handleTypingUpdate = ({ chatId, userId, isTyping }) => {
      console.log('[SocketContext] Typing update:', {
        chatId,
        userId,
        isTyping,
      });
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        const key = `${chatId}-${userId}`;

        if (isTyping) {
          newMap.set(key, {
            timestamp: Date.now(),
            timeoutId: setTimeout(() => {
              setTypingUsers(current => {
                const updated = new Map(current);
                updated.delete(key);
                return updated;
              });
            }, 3000),
          });
        } else {
          const existing = newMap.get(key);
          if (existing?.timeoutId) {
            clearTimeout(existing.timeoutId);
          }
          newMap.delete(key);
        }

        return newMap;
      });
    };

    // Call-related events
    currentSocket.on('call-incoming', callSession => {
      setIncomingCall(callSession);
    });

    currentSocket.on('call-status-update', updateData => {
      if (updateData.status === 'ongoing') {
        setCurrentCall(prev => ({
          ...prev,
          status: 'ongoing',
          acceptedBy: updateData.acceptedBy,
        }));
        setIncomingCall(null);
      }
    });

    currentSocket.on('call-ended', endData => {
      setCurrentCall(prev => ({
        ...prev,
        status: endData.status,
        endedBy: endData.endedBy || endData.rejectedBy,
        endTime: new Date(),
      }));
      setTimeout(() => setCurrentCall(null), 3000);
    });

    currentSocket.on('call-signal-received', signalData => {
      if (currentCall && currentCall._id === signalData.callId) {
        window.dispatchEvent(
          new CustomEvent('webrtc-signal', {
            detail: signalData,
          })
        );
      }
    });

    // Set up all event listeners
    const events = {
      'online-users-update': users => {
        console.log('[SocketContext] Online users update received:', users);
        setOnlineUsers(users);
      },
      'message-received': handleNewMessage,
      'message-updated': handleMessageUpdate,
      'message-deleted': handleMessageDelete,
      'message-read-update': handleMessageRead,
      'typing-update': handleTypingUpdate,
    };

    // Register all events
    Object.entries(events).forEach(([event, handler]) => {
      currentSocket.on(event, handler);
    });

    // Cleanup function
    return () => {
      // Clear all typing timeouts
      typingUsers.forEach(({ timeoutId }) => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      // Cleanup all events
      Object.entries(events).forEach(([event, handler]) => {
        currentSocket.off(event, handler);
      });
    };
  }, [dispatch, currentCall, typingUsers]);

  const isUserOnline = useCallback(
    userId => {
      return onlineUsers.some(user => user._id === userId);
    },
    [onlineUsers]
  );

  // Socket action methods with improved logging and error handling
  const joinChat = useCallback((chatId, user) => {
    if (!socketRef.current || !chatId || !user) {
      console.warn(
        '[SocketContext] Cannot join chat - invalid parameters or socket not connected'
      );
      return;
    }

    console.log('[SocketContext] Joining chat:', { chatId, userId: user._id });
    socketRef.current.emit('join-chat', { chatId, user });
  }, []);

  const leaveChat = useCallback(chatId => {
    if (!socketRef.current || !chatId) {
      console.warn(
        '[SocketContext] Cannot leave chat - invalid parameters or socket not connected'
      );
      return;
    }

    console.log('[SocketContext] Leaving chat:', chatId);
    socketRef.current.emit('leave-chat', chatId);
  }, []);

  const sendMessage = useCallback(message => {
    if (!socketRef.current || !message) {
      console.warn(
        '[SocketContext] Cannot send message - invalid parameters or socket not connected'
      );
      return;
    }

    console.log('[SocketContext] Sending message:', message);
    socketRef.current.emit('new-message', message);
  }, []);

  const startTyping = useCallback(
    chatId => {
      if (!socketRef.current || !user?._id || !chatId) {
        console.warn(
          '[SocketContext] Cannot start typing - invalid parameters or socket not connected'
        );
        return;
      }

      console.log('[SocketContext] Start typing:', {
        chatId,
        userId: user._id,
      });
      socketRef.current.emit('typing-start', { chatId, userId: user._id });
    },
    [user]
  );

  const stopTyping = useCallback(
    chatId => {
      if (!socketRef.current || !user?._id || !chatId) {
        console.warn(
          '[SocketContext] Cannot stop typing - invalid parameters or socket not connected'
        );
        return;
      }

      console.log('[SocketContext] Stop typing:', { chatId, userId: user._id });
      socketRef.current.emit('typing-stop', { chatId, userId: user._id });
    },
    [user]
  );

  const markMessageRead = useCallback(
    (messageId, chatId) => {
      if (!socketRef.current || !user?._id || !messageId || !chatId) {
        console.warn(
          '[SocketContext] Cannot mark message as read - invalid parameters or socket not connected'
        );
        return;
      }

      console.log('[SocketContext] Marking message as read:', {
        messageId,
        chatId,
        userId: user._id,
      });
      socketRef.current.emit('message-read', {
        messageId,
        chatId,
        userId: user._id,
      });
    },
    [user]
  );

  const initiateCall = useCallback(
    (chatId, callType, participants) => {
      if (socketRef.current) {
        socketRef.current.emit('call-initiate', {
          chatId,
          callType,
          participants,
        });
        setCurrentCall({
          _id: chatId,
          chat: chatId,
          participants,
          callType,
          status: 'initiating',
          initiator: user._id,
          startTime: new Date(),
        });
      }
    },
    [user]
  );

  const acceptCall = useCallback(
    callId => {
      if (socketRef.current) {
        socketRef.current.emit('call-accept', callId);
        setCurrentCall(incomingCall);
        setIncomingCall(null);
      }
    },
    [incomingCall]
  );

  const rejectCall = useCallback(callId => {
    if (socketRef.current) {
      socketRef.current.emit('call-reject', callId);
      setIncomingCall(null);
    }
  }, []);

  const sendCallSignal = useCallback((callId, targetUserId, signal) => {
    if (socketRef.current) {
      socketRef.current.emit('call-signal', { callId, targetUserId, signal });
    }
  }, []);

  const endCall = useCallback(callId => {
    if (socketRef.current) {
      socketRef.current.emit('call-end', callId);
      setCurrentCall(prev => ({
        ...prev,
        status: 'ended',
        endTime: new Date(),
      }));
      setTimeout(() => setCurrentCall(null), 3000);
    }
  }, []);

  const sendReaction = useCallback((messageId, chatId, emoji) => {
    if (socketRef.current) {
      socketRef.current.emit('message-reaction', {
        messageId,
        chatId,
        emoji,
      });
    }
  }, []);

  const contextValue = {
    socket: socketRef.current,
    onlineUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageRead,
    initiateCall,
    acceptCall,
    rejectCall,
    sendCallSignal,
    endCall,
    sendReaction,
    typingUsers,
    incomingCall,
    currentCall,
    isUserOnline,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

// Server (socketHelper)         Client (SocketContext)
// 'user-online'          <-->  'user-online'
// 'join-chat'           <-->  'join-chat'
// 'typing-start/stop'   <-->  'typing-update'
// 'new-message'         <-->  'message-received'
// 'call-initiate'       <-->  'call-incoming'
// 'message-reaction'    <-->  'message-updated'

// Connection State Management:

// Add connection state tracking in SocketContext
// const [connectionState, setConnectionState] = useState('disconnected');

// useEffect(() => {
//   if (socket) {
//     socket.on('connect', () => setConnectionState('connected'));
//     socket.on('disconnect', () => setConnectionState('disconnected'));
//     socket.on('reconnecting', () => setConnectionState('reconnecting'));
//   }
// }, [socket]);
