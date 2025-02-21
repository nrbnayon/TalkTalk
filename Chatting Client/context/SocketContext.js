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
    if (user && token) {
      const initializeSocket = async () => {
        try {
          const newSocket = await socketServiceInstance.connect(token);
          if (isMounted) {
            setSocket(newSocket);
            socketRef.current = newSocket;
            socketServiceInstance.setUserOnline(user._id);
            console.log('[SocketContext] Socket connected:', newSocket?.id);
          }
        } catch (error) {
          console.error('[SocketContext] Failed to connect socket:', error);
        }
      };

      initializeSocket();

      // Fetch initial online users
      const fetchOnlineUsers = async () => {
        try {
          const response = await fetch(`${apiUrl}/api/v1/user/online-users`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            setOnlineUsers(data.data);
          }
        } catch (error) {
          console.error('[SocketContext] Error fetching online users:', error);
        }
      };

      fetchOnlineUsers();

      return () => {
        isMounted = false;
        socketServiceInstance.disconnect();
        socketRef.current = null;
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
      setOnlineUsers(users);
    });

    // Handle new messages
    const handleNewMessage = message => {
      console.log('[SocketContext] Received new message:', message);
      dispatch(addMessage(message));
    };

    // Handle message updates
    const handleMessageUpdate = updatedMessage => {
      console.log('[SocketContext] Message updated:', updatedMessage);
      dispatch(updateMessage(updatedMessage));
    };

    // Handle read status updates
    const handleMessageRead = ({ messageId, userId, chatId }) => {
      console.log(
        '[SocketContext] Message read:',
        messageId,
        'by user:',
        userId
      );
      dispatch(markMessageAsRead({ messageId, chatId, userId }));
    };

    // Handle typing status
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
          newMap.set(key, true);
        } else {
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

    return () => {
      currentSocket.off('online-users-update');
      currentSocket.off('message-received', handleNewMessage);
      currentSocket.off('message-updated', handleMessageUpdate);
      currentSocket.off('message-read-update', handleMessageRead);
      currentSocket.off('typing-update', handleTypingUpdate);
      currentSocket.off('call-incoming');
      currentSocket.off('call-status-update');
      currentSocket.off('call-ended');
      currentSocket.off('call-signal-received');
    };
  }, [dispatch, currentCall]);

  // Socket action methods
  const joinChat = useCallback(
    (chatId, user) => {
      if (socketRef.current && chatId && user) {
        console.log('[SocketContext] User Joining chat Room::', chatId, user);
        socketRef.current.emit('join-chat', { chatId, user });
      }
    },
    []
  );

  const leaveChat = useCallback(
    chatId => {
      if (socketRef.current && chatId) {
        console.log('[SocketContext] Leaving chat room:', chatId);
        socketRef.current.emit('leave-chat', chatId);
      }
    },
    []
  );

  const sendMessage = useCallback(
    message => {
      if (socketRef.current) {
        console.log('[SocketContext] Sending message:', message);
        socketRef.current.emit('new-message', message);
      }
    },
    []
  );

  const startTyping = useCallback(
    chatId => {
      if (socketRef.current && user?._id) {
        console.log('[SocketContext] Start typing in chat:', chatId);
        socketRef.current.emit('typing-start', { chatId, userId: user._id });
      }
    },
    [user]
  );

  const stopTyping = useCallback(
    chatId => {
      if (socketRef.current && user?._id) {
        console.log('[SocketContext] Stop typing in chat:', chatId);
        socketRef.current.emit('typing-stop', { chatId, userId: user._id });
      }
    },
    [user]
  );

  const markMessageRead = useCallback(
    (messageId, chatId) => {
      if (socketRef.current && user?._id) {
        console.log('[SocketContext] Marking message as read:', messageId);
        socketRef.current.emit('message-read', {
          messageId,
          chatId,
          userId: user._id,
        });
      }
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

  const rejectCall = useCallback(
    callId => {
      if (socketRef.current) {
        socketRef.current.emit('call-reject', callId);
        setIncomingCall(null);
      }
    },
    []
  );

  const sendCallSignal = useCallback(
    (callId, targetUserId, signal) => {
      if (socketRef.current) {
        socketRef.current.emit('call-signal', { callId, targetUserId, signal });
      }
    },
    []
  );

  const endCall = useCallback(
    callId => {
      if (socketRef.current) {
        socketRef.current.emit('call-end', callId);
        setCurrentCall(prev => ({
          ...prev,
          status: 'ended',
          endTime: new Date(),
        }));
        setTimeout(() => setCurrentCall(null), 3000);
      }
    },
    []
  );

  const sendReaction = useCallback(
    (messageId, chatId, emoji) => {
      if (socketRef.current) {
        socketRef.current.emit('message-reaction', {
          messageId,
          chatId,
          emoji,
        });
      }
    },
    []
  );

  const isUserOnline = useCallback(
    userId => {
      return onlineUsers.some(user => user._id === userId);
    },
    [onlineUsers]
  );

  const contextValue = {
    socket,
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
  return useContext(SocketContext);
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
