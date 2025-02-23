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

// Constants
const TYPING_TIMEOUT = 3000;
const CALL_END_CLEANUP_TIMEOUT = 3000;
const ONLINE_USERS_FETCH_INTERVAL = 30000;

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
};

const SocketContext = createContext(initialContextState);

// Custom hook for managing typing state
const useTypingState = () => {
  const [typingUsers, setTypingUsers] = useState(new Map());

  const updateTypingState = useCallback(({ chatId, userId, isTyping }) => {
    console.log(
      'Find updateTypingState',
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

// Custom hook for managing online users
const useOnlineUsers = (apiUrl, token) => {
  const [onlineUsers, setOnlineUsers] = useState([]);

  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/v1/user/online-users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (data.success) {
        setOnlineUsers(data.data);
      }
    } catch (error) {
      console.error('[SocketContext] Error fetching online users:', error);
    }
  }, [apiUrl, token]);

  const isUserOnline = useCallback(
    userId => onlineUsers.some(user => user._id === userId),
    [onlineUsers]
  );

  return { onlineUsers, setOnlineUsers, fetchOnlineUsers, isUserOnline };
};

export const SocketProvider = ({ children }) => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { user, token } = useSelector(state => state.auth);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const [typingUsers, updateTypingState] = useTypingState();
  const { onlineUsers, setOnlineUsers, fetchOnlineUsers, isUserOnline } =
    useOnlineUsers(apiUrl, token);
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

  // Socket initialization
  useEffect(() => {
    let isMounted = true;

    const initializeSocket = async () => {
      if (!user?._id || !token) return;

      try {
        const newSocket = await socketServiceInstance.connect(token);

        if (isMounted) {
          socketRef.current = newSocket;
          socketServiceInstance.setUserOnline(user._id);
          fetchOnlineUsers();
        }
      } catch (error) {
        console.error('[SocketContext] Socket connection error:', error);
      }
    };

    if (user && token) {
      initializeSocket();
      const onlineUsersInterval = setInterval(
        fetchOnlineUsers,
        ONLINE_USERS_FETCH_INTERVAL
      );

      return () => {
        isMounted = false;
        clearInterval(onlineUsersInterval);
        if (socketRef.current) {
          socketServiceInstance.disconnect();
          socketRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
    };
  }, [apiUrl, user, token, fetchOnlineUsers]);

  // Socket event handlers
  useEffect(() => {
    if (!socketRef.current) return;

    const currentSocket = socketRef.current;

    const socketEventHandlers = {
      'online-users-update': users => {
        setOnlineUsers(prevUsers => {
          const hasChanged =
            JSON.stringify(prevUsers) !== JSON.stringify(users);
          return hasChanged ? users : prevUsers;
        });
      },
      'message-received': message => {
        dispatch(addMessage(message));
      },
      'message-updated': updatedMessage => {
        dispatch(updateMessage(updatedMessage));
      },
      'message-deleted': data => {
        dispatch(deleteMessage(data));
      },
      'message-read-update': data => {
        dispatch(markMessageAsRead(data));
      },
      'typing-update': updateTypingState,
      'call-incoming': callSession => {
        setIncomingCall(callSession);
      },
      'call-status-update': updateData => {
        if (updateData.status === 'ongoing') {
          setCurrentCall(prev => ({
            ...prev,
            status: 'ongoing',
            acceptedBy: updateData.acceptedBy,
          }));
          setIncomingCall(null);
        }
      },
      'call-ended': endData => {
        setCurrentCall(prev => ({
          ...prev,
          status: endData.status,
          endedBy: endData.endedBy || endData.rejectedBy,
          endTime: new Date(),
        }));
        setTimeout(() => setCurrentCall(null), CALL_END_CLEANUP_TIMEOUT);
      },
      'call-signal-received': signalData => {
        if (currentCall && currentCall._id === signalData.callId) {
          window.dispatchEvent(
            new CustomEvent('webrtc-signal', {
              detail: signalData,
            })
          );
        }
      },
    };

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
    setOnlineUsers,
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
          content: typingData.content,
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
  };

  const contextValue = {
    socket: socketRef.current,
    onlineUsers,
    typingUsers,
    incomingCall,
    currentCall,
    isUserOnline,
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
