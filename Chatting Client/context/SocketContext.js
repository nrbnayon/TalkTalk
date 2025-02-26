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
  updateMessageReadStatus,
} from '@/redux/features/messages/messageSlice';

// Constants
const TYPING_TIMEOUT = 3000;
const CALL_END_CLEANUP_TIMEOUT = 3000;
const SOCKET_HEALTH_CHECK_INTERVAL = 10000;

// Initial context state
const initialContextState = {
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
  connectionState: 'disconnected',
};

const SocketContext = createContext(initialContextState);

// Custom hook for managing typing state
const useTypingState = () => {
  const [typingUsers, setTypingUsers] = useState(new Map());

  const updateTypingState = useCallback(({ chatId, userId, isTyping }) => {
    console.log(
      '[SocketContext] Typing update',
      'isTyping: ',
      isTyping,
      'chatId: ',
      chatId,
      'userId: ',
      userId
    );
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      const key = `${chatId}-${userId}`;

      if (isTyping) {
        const timeoutId = setTimeout(() => {
          setTypingUsers(current => {
            const updated = new Map(current);
            updated.delete(key);
            return updated;
          });
        }, TYPING_TIMEOUT);

        newMap.set(key, {
          timestamp: Date.now(),
          timeoutId,
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
  }, []);

  return [typingUsers, updateTypingState];
};

// Custom hook for managing call state
const useCallState = (socket, user) => {
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentCall, setCurrentCall] = useState(null);

  const handleCallActions = {
    initiateCall: useCallback(
      (chatId, callType, participants) => {
        if (socket) {
          socket.emit('call-initiate', { chatId, callType, participants });
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
      [socket, user]
    ),

    acceptCall: useCallback(() => {
      if (socket) {
        socket.emit('call-accept', incomingCall._id);
        setCurrentCall(incomingCall);
        setIncomingCall(null);
      }
    }, [socket, incomingCall]),

    rejectCall: useCallback(
      callId => {
        if (socket) {
          socket.emit('call-reject', callId);
          setIncomingCall(null);
        }
      },
      [socket]
    ),

    endCall: useCallback(
      callId => {
        if (socket) {
          socket.emit('call-end', callId);
          setCurrentCall(prev => ({
            ...prev,
            status: 'ended',
            endTime: new Date(),
          }));
          setTimeout(() => setCurrentCall(null), CALL_END_CLEANUP_TIMEOUT);
        }
      },
      [socket]
    ),

    sendCallSignal: useCallback(
      (callId, targetUserId, signal) => {
        if (socket) {
          socket.emit('call-signal', { callId, targetUserId, signal });
        }
      },
      [socket]
    ),
  };

  return {
    incomingCall,
    setIncomingCall,
    currentCall,
    setCurrentCall,
    ...handleCallActions,
  };
};

// Custom hook for managing online users with socket as the primary source
const useOnlineUsers = () => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [lastSocketUpdate, setLastSocketUpdate] = useState(0);

  const updateOnlineUsersViaSocket = useCallback(users => {
    if (users) {
      // Handle both array of user objects or array of user IDs
      const processedUsers = Array.isArray(users)
        ? users.map(user => {
            if (typeof user === 'string') {
              return { _id: user }; // Convert ID strings to objects
            }
            return user;
          })
        : [];

      console.log('[SocketContext] Processed online users:', processedUsers);
      setOnlineUsers(processedUsers);
      setLastSocketUpdate(Date.now());
    }
  }, []);

  const isUserOnline = useCallback(
    userId => onlineUsers.some(user => user._id === userId),
    [onlineUsers]
  );

  return {
    onlineUsers,
    setOnlineUsers,
    updateOnlineUsersViaSocket,
    isUserOnline,
    lastSocketUpdate,
  };
};

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { user, token } = useSelector(state => state.auth);
  const [typingUsers, updateTypingState] = useTypingState();
  const [connectionState, setConnectionState] = useState('disconnected');
  const isConnectedRef = useRef(false);
  const healthCheckTimerRef = useRef(null);

  const {
    onlineUsers,
    updateOnlineUsersViaSocket,
    isUserOnline,
    lastSocketUpdate,
  } = useOnlineUsers();

  const {
    incomingCall,
    setIncomingCall,
    currentCall,
    setCurrentCall,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    sendCallSignal,
  } = useCallState(socketRef.current, user);

  // Helper to check socket health
  const checkSocketHealth = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) return false;

    // Check if socket is actually connected
    const isConnected = socket.connected;

    // Update connected state if it changed
    if (isConnectedRef.current !== isConnected) {
      isConnectedRef.current = isConnected;
      setConnectionState(isConnected ? 'connected' : 'disconnected');
      console.log(
        `[SocketContext] Socket connection status changed to: ${
          isConnected ? 'connected' : 'disconnected'
        }`
      );
    }

    return isConnected;
  }, []);

  // Initialize socket connection
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      if (!user?._id || !token) return;

      try {
        console.log('[SocketContext] Initializing socket connection');
        const newSocket = await socketServiceInstance.connect(token);

        if (isMounted) {
          socketRef.current = newSocket;
          isConnectedRef.current = newSocket.connected;

          // Setup connection state listeners
          newSocket.on('connect', () => {
            console.log('[SocketContext] Socket connected');
            setConnectionState('connected');
            isConnectedRef.current = true;
            socketServiceInstance.setUserOnline(user._id);

            // Request initial online users after connection
            newSocket.emit('request-online-users');
          });

          newSocket.on('disconnect', () => {
            console.log('[SocketContext] Socket disconnected');
            setConnectionState('disconnected');
            isConnectedRef.current = false;
          });

          newSocket.on('reconnecting', () => {
            console.log('[SocketContext] Socket reconnecting');
            setConnectionState('reconnecting');
          });

          if (newSocket.connected) {
            socketServiceInstance.setUserOnline(user._id);

            newSocket.on('online-users-update', data => {
              console.log('[SocketContext] Initial online users update:', data);
              updateOnlineUsersViaSocket(data);
            });

            newSocket.emit('request-online-users');
          }
        }
      } catch (error) {
        console.error('[SocketContext] Socket connection error:', error);
        isConnectedRef.current = false;
        setConnectionState('error');
      }
    };

    if (user && token) {
      initializeSocket();

      // Setup socket health check interval
      healthCheckTimerRef.current = setInterval(() => {
        const isConnected = checkSocketHealth();

        // If socket lost connection, try to reconnect
        if (!isConnected && socketRef.current) {
          console.log(
            '[SocketContext] Socket health check: Connection lost, reconnecting...'
          );
          socketServiceInstance
            .ensureConnection()
            .then(socket => {
              if (socket && socket.connected) {
                socketRef.current = socket;
                isConnectedRef.current = true;
                setConnectionState('connected');
                socket.emit('user-online', user._id);
                socket.emit('request-online-users');
              }
            })
            .catch(err => {
              console.error('[SocketContext] Reconnection failed:', err);
            });
        }
      }, SOCKET_HEALTH_CHECK_INTERVAL);

      return () => {
        isMounted = false;
        if (healthCheckTimerRef.current) {
          clearInterval(healthCheckTimerRef.current);
        }
        if (socketRef.current) {
          socketServiceInstance.disconnect();
          socketRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (healthCheckTimerRef.current) {
        clearInterval(healthCheckTimerRef.current);
      }
    };
  }, [user, token, checkSocketHealth, updateOnlineUsersViaSocket]);

  // Socket event handlers for messages
  useEffect(() => {
    if (!socketRef.current) return;

    const handleDelete = data => {
      console.log('[SocketContext] Message deleted event received:', data);
      dispatch(deleteMessage(data));
    };

    socketRef.current.on('message-deleted', handleDelete);

    return () => {
      socketRef.current?.off('message-deleted', handleDelete);
    };
  }, [dispatch]);

  // Main socket event handlers
  useEffect(() => {
    if (!socketRef.current) return;

    const currentSocket = socketRef.current;

   const socketEventHandlers = {
     connect: () => {
       console.log('[SocketContext] Socket connected event received');
     },
     'online-users-update': users => {
       console.log(
         '[SocketContext] Received online users update:',
         'Type:',
         typeof users,
         'Is Array:',
         Array.isArray(users),
         'Length:',
         users?.length,
         'Data:',
         JSON.stringify(users).substring(0, 100)
       );
       updateOnlineUsersViaSocket(users);
     },
     // other handlers...
   };

   // After setting up all event handlers
   console.log('[SocketContext] Event handlers setup complete');

    // Register all event handlers
    Object.entries(socketEventHandlers).forEach(([event, handler]) => {
      currentSocket.on(event, handler);
    });

    // Cleanup function
    return () => {
      typingUsers.forEach(({ timeoutId }) => {
        if (timeoutId) clearTimeout(timeoutId);
      });

      Object.keys(socketEventHandlers).forEach(event => {
        currentSocket.off(event, socketEventHandlers[event]);
      });
    };
  }, [
    dispatch,
    currentCall,
    typingUsers,
    updateOnlineUsersViaSocket,
    updateTypingState,
    setIncomingCall,
    setCurrentCall,
  ]);

  // Socket action methods
  const socketActions = {
    joinChat: useCallback((chatId, user) => {
      if (!socketRef.current || !chatId || !user) return;
      socketRef.current.emit('join-chat', { chatId, user });
    }, []),

    leaveChat: useCallback(chatId => {
      if (!socketRef.current || !chatId) return;
      socketRef.current.emit('leave-chat', chatId);
    }, []),

    sendMessage: useCallback(message => {
      if (!socketRef.current || !message) return;
      socketRef.current.emit('new-message', message);
    }, []),

    startTyping: useCallback(
      (chatId, typingData) => {
        if (!socketRef.current || !user?._id || !chatId) return;
        socketRef.current.emit('typing-start', {
          chatId,
          userId: user._id,
          name: user.name,
          content: typingData?.content || '',
        });
      },
      [user]
    ),

    stopTyping: useCallback(
      chatId => {
        if (!socketRef.current || !user?._id || !chatId) return;
        socketRef.current.emit('typing-stop', { chatId, userId: user._id });
      },
      [user]
    ),

    markMessageRead: useCallback(
      (messageId, chatId) => {
        if (!socketRef.current || !user?._id || !messageId || !chatId) return;
        socketRef.current.emit('message-read', {
          messageId,
          chatId,
          userId: user._id,
        });
      },
      [user]
    ),

    sendReaction: useCallback((messageId, chatId, emoji) => {
      if (!socketRef.current) return;
      socketRef.current.emit('message-reaction', {
        messageId,
        chatId,
        emoji,
      });
    }, []),

    refreshOnlineUsers: useCallback(() => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('request-online-users');
        return true;
      }
      return false;
    }, []),
  };

  const contextValue = {
    socket: socketRef.current,
    onlineUsers,
    typingUsers,
    incomingCall,
    currentCall,
    isUserOnline,
    connectionState,
    isConnected: isConnectedRef.current,
    ...socketActions,
    initiateCall,
    acceptCall,
    rejectCall,
    sendCallSignal,
    endCall,
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
