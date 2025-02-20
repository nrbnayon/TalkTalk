// // components/chat/MessageArea.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMessagesLoading,
  updateMessage,
  deleteMessage,
  fetchMessages,
  selectMessagesMeta,
} from '@/redux/features/messages/messageSlice';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useMessageScroll } from '@/hooks/useMessageScroll';
import MessageList from './MessageList';
import PinnedMessage from './PinnedMessage';
import Lottie from 'react-lottie';
import loadingAnimation from '@/assets/lottie/loadinglottie.json';
import { Loader2 } from 'lucide-react';

const MessagesArea = ({ messages = [], currentUser, chatId }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingRef = useRef(null);
  const lastScrollPositionRef = useRef(0);
  const isLoadingMoreRef = useRef(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const loading = useSelector(selectMessagesLoading);
  const [page, setPage] = useState(1);
  const [hasMoreOlder, setHasMoreOlder] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const { markAsRead, handlePinToggle, getPinnedMessages, handleReaction } =
    useMessageActions(chatId);
  const { messageRefs, initializeMessageRefs, scrollToMessage } =
    useMessageScroll();
  const meta = useSelector(state => selectMessagesMeta(state, chatId));

  // Initialize messages
  useEffect(() => {
    if (chatId && chatId !== 'undefined') {
      setIsInitialLoad(true);
      setPage(1);
      setHasMoreOlder(true);
      dispatch(fetchMessages({ chatId, page: 1, limit: 40 })).then(() =>
        setIsInitialLoad(false)
      );
    }
  }, [chatId, dispatch]);

  // Handle scroll
  const handleScroll = useCallback(async () => {
    if (
      !messagesContainerRef.current ||
      isLoadingMoreRef.current ||
      !hasMoreOlder
    )
      return;

    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    const scrollPosition = scrollTop;
    const isScrollingUp = scrollPosition < lastScrollPositionRef.current;
    lastScrollPositionRef.current = scrollPosition;

    // Load more messages when scrolling up and near top
    if (isScrollingUp && scrollTop < 200) {
      const currentScrollHeight = scrollHeight;
      isLoadingMoreRef.current = true;

      try {
        const result = await dispatch(
          fetchMessages({
            chatId,
            page: page + 1,
            limit: 30,
          })
        ).unwrap();

        if (result.messages.length < 20) {
          setHasMoreOlder(false);
        }

        setPage(prev => prev + 1);

        // Maintain scroll position after loading more messages
        requestAnimationFrame(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop =
              newScrollHeight - currentScrollHeight + scrollTop;
          }
        });
      } catch (error) {
        console.error('Error loading more messages:', error);
      } finally {
        isLoadingMoreRef.current = false;
      }
    }
  }, [chatId, dispatch, page, hasMoreOlder]);

  // Setup scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (messages.length > 0 && isInitialLoad) {
      messagesEndRef.current?.scrollIntoView();
      setIsInitialLoad(false);
    } else if (messages.length > 0 && page === 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, page, isInitialLoad]);

  useEffect(() => {
    if (!socket || !currentUser) return;

    const markUnreadMessages = async () => {
      if (messages.length > 0 && currentUser?._id && chatId) {
        const unreadMessages = messages.filter(
          msg =>
            msg.sender._id !== currentUser._id &&
            !msg.readBy?.some(reader => reader._id === currentUser._id)
        );

        for (const msg of unreadMessages) {
          await markAsRead(msg._id, currentUser._id);
        }
      }
    };

    markUnreadMessages();

    const handleMessageUpdate = updatedMessage => {
      dispatch(updateMessage(updatedMessage));
    };

    const handleMessageDelete = data => {
      dispatch(deleteMessage({ messageId: data.messageId, chatId }));
    };

    const handleMessageRead = data => {
      const { messageId, userId, readBy } = data;
      const message = messages.find(msg => msg._id === messageId);

      if (message) {
        if (readBy) {
          dispatch(updateMessage({ ...message, readBy }));
        } else {
          const updatedReadBy = [...(message.readBy || [])];
          if (!updatedReadBy.some(reader => reader._id === userId)) {
            updatedReadBy.push({ _id: userId });
            dispatch(updateMessage({ ...message, readBy: updatedReadBy }));
          }
        }
      }
    };

    const events = {
      'message-updated': handleMessageUpdate,
      'message-deleted': handleMessageDelete,
      'message-reaction': handleMessageUpdate,
      'message-read': handleMessageRead,
    };

    Object.entries(events).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      Object.entries(events).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }, [socket, dispatch, chatId, messages, currentUser, markAsRead]);

  const handleDeleteMessage = async messageId => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        dispatch(deleteMessage({ messageId, chatId }));
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleEditMessage = message => {
    window.dispatchEvent(
      new CustomEvent('editMessage', {
        detail: {
          id: message._id,
          content: message.content,
          chatId: message.chat,
        },
      })
    );
  };

  const openEmojiPicker = (message, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const isOwnMessage = message.sender._id === currentUser._id;

    setEmojiPickerPosition({
      top: rect.top + window.scrollY,
      left: isOwnMessage ? rect.left : rect.right,
      isOwnMessage,
    });
    setSelectedMessage(message);
    setShowEmojiPicker(true);
  };

  useEffect(() => {
    initializeMessageRefs(messages);
  }, [messages, initializeMessageRefs]);

  const pinnedMessages = getPinnedMessages(messages);
  const latestPinnedMessage = pinnedMessages[0];

  // Loading states
  if (loading && isInitialLoad) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Lottie
          options={{
            loop: true,
            autoplay: true,
            animationData: loadingAnimation,
          }}
          height={150}
          width={150}
        />
      </div>
    );
  }

  if (!loading && !messages?.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500 text-lg">No messages yet</p>
          <p className="text-gray-400 text-sm">Start a conversation!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {latestPinnedMessage && (
        <PinnedMessage
          message={latestPinnedMessage}
          onUnpin={() => handlePinToggle(latestPinnedMessage._id, true)}
          onScrollTo={() => scrollToMessage(latestPinnedMessage._id)}
        />
      )}

      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2"
      >
        {/* Loading indicator for older messages */}
        {loading && !isInitialLoad && (
          <div className="h-8 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        )}

        <MessageList
          messages={messages}
          currentUser={currentUser}
          messageRefs={messageRefs}
          messagesEndRef={messagesEndRef}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          onPinMessage={messageId => handlePinToggle(messageId, false)}
          onUnpinMessage={messageId => handlePinToggle(messageId, true)}
          onReaction={handleReaction}
          onOpenEmojiPicker={openEmojiPicker}
          onScrollToMessage={scrollToMessage}
          showEmojiPicker={showEmojiPicker}
          selectedMessage={selectedMessage}
          emojiPickerPosition={emojiPickerPosition}
          onCloseEmojiPicker={() => {
            setShowEmojiPicker(false);
            setSelectedMessage(null);
          }}
        />
      </div>
    </div>
  );
};

export default MessagesArea;

// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import { useSocket } from '@/context/SocketContext';
// import { useSelector, useDispatch } from 'react-redux';
// import {
//   selectMessagesLoading,
//   updateMessage,
//   deleteMessage,
//   fetchMessages,
//   selectMessagesMeta,
// } from '@/redux/features/messages/messageSlice';
// import { useMessageActions } from '@/hooks/useMessageActions';
// import { useMessageScroll } from '@/hooks/useMessageScroll';
// import MessageList from './MessageList';
// import PinnedMessage from './PinnedMessage';
// import Lottie from 'react-lottie';
// import loadingAnimation from '@/assets/lottie/loadinglottie.json';
// import { Loader2 } from 'lucide-react';
// const MessagesArea = ({ messages = [], currentUser, chatId }) => {
//   const messagesEndRef = useRef(null);
//   const observerRef = useRef(null);
//   const loadingRef = useRef(null);
//   const dispatch = useDispatch();
//   const { socket } = useSocket();
//   const loading = useSelector(selectMessagesLoading);
//   const [page, setPage] = useState(1);
//   const { markAsRead, handlePinToggle, getPinnedMessages, handleReaction } =
//     useMessageActions(chatId);

//   const { messageRefs, initializeMessageRefs, scrollToMessage } =
//     useMessageScroll();

//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [emojiPickerPosition, setEmojiPickerPosition] = useState({
//     top: 0,
//     left: 0,
//   });

//   const meta = useSelector(state => selectMessagesMeta(state, chatId));

//   const hasMore = meta ? page * 10 < meta.total : false;

//   useEffect(() => {
//     if (chatId) {
//       dispatch(fetchMessages({ chatId, page: 1, limit: 10 }));
//     }
//   }, [chatId, dispatch]);

//   const handleObserver = useCallback(
//     entries => {
//       const target = entries[0];
//       if (target.isIntersecting && hasMore && !loading) {
//         setPage(prev => prev + 1);
//       }
//     },
//     [hasMore, loading]
//   );

//   useEffect(() => {
//     if (page > 1) {
//       dispatch(fetchMessages({ chatId, page, limit: 10 }));
//     }
//   }, [page, chatId, dispatch]);

//   useEffect(() => {
//     const options = {
//       root: null,
//       rootMargin: '20px',
//       threshold: 0.1,
//     };

//     observerRef.current = new IntersectionObserver(handleObserver, options);

//     if (loadingRef.current) {
//       observerRef.current.observe(loadingRef.current);
//     }

//     return () => {
//       if (observerRef.current) {
//         observerRef.current.disconnect();
//       }
//     };
//   }, [handleObserver]);

//   useEffect(() => {
//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     if (messages.length > 0 && page === 1) {
//       scrollToBottom();
//     } else if (messages.length > 0) {
//       scrollToBottom();
//     }
//   }, [messages, page]);

//   useEffect(() => {
//     if (!socket || !currentUser) return;

//     const markUnreadMessages = async () => {
//       if (messages.length > 0 && currentUser?._id && chatId) {
//         const unreadMessages = messages.filter(
//           msg =>
//             msg.sender._id !== currentUser._id &&
//             !msg.readBy?.some(reader => reader._id === currentUser._id)
//         );

//         for (const msg of unreadMessages) {
//           await markAsRead(msg._id, currentUser._id);
//         }
//       }
//     };

//     markUnreadMessages();

//     const handleMessageUpdate = updatedMessage => {
//       dispatch(updateMessage(updatedMessage));
//     };

//     const handleMessageDelete = data => {
//       dispatch(deleteMessage({ messageId: data.messageId, chatId }));
//     };

//     const handleMessageRead = data => {
//       const { messageId, userId, readBy } = data;
//       const message = messages.find(msg => msg._id === messageId);

//       if (message) {
//         if (readBy) {
//           dispatch(updateMessage({ ...message, readBy }));
//         } else {
//           const updatedReadBy = [...(message.readBy || [])];
//           if (!updatedReadBy.some(reader => reader._id === userId)) {
//             updatedReadBy.push({ _id: userId });
//             dispatch(updateMessage({ ...message, readBy: updatedReadBy }));
//           }
//         }
//       }
//     };

//     const events = {
//       'message-updated': handleMessageUpdate,
//       'message-deleted': handleMessageDelete,
//       'message-reaction': handleMessageUpdate,
//       'message-read': handleMessageRead,
//     };

//     Object.entries(events).forEach(([event, handler]) => {
//       socket.on(event, handler);
//     });

//     return () => {
//       Object.entries(events).forEach(([event, handler]) => {
//         socket.off(event, handler);
//       });
//     };
//   }, [socket, dispatch, chatId, messages, currentUser, markAsRead]);

//   const handleDeleteMessage = async messageId => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}`, {
//         method: 'DELETE',
//       });

//       if (response.ok) {
//         dispatch(deleteMessage({ messageId, chatId }));
//       }
//     } catch (error) {
//       console.error('Error deleting message:', error);
//     }
//   };

//   const handleEditMessage = message => {
//     window.dispatchEvent(
//       new CustomEvent('editMessage', {
//         detail: {
//           id: message._id,
//           content: message.content,
//           chatId: message.chat,
//         },
//       })
//     );
//   };

//   const openEmojiPicker = (message, event) => {
//     const rect = event.currentTarget.getBoundingClientRect();
//     const isOwnMessage = message.sender._id === currentUser._id;

//     setEmojiPickerPosition({
//       top: rect.top + window.scrollY,
//       left: isOwnMessage ? rect.left : rect.right,
//       isOwnMessage,
//     });
//     setSelectedMessage(message);
//     setShowEmojiPicker(true);
//   };

//   useEffect(() => {
//     initializeMessageRefs(messages);
//   }, [messages, initializeMessageRefs]);

//   const pinnedMessages = getPinnedMessages(messages);
//   const latestPinnedMessage = pinnedMessages[0];

//   if (loading) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <Lottie
//           options={{
//             loop: true,
//             autoplay: true,
//             animationData: loadingAnimation,
//           }}
//           height={150}
//           width={150}
//         />
//       </div>
//     );
//   }

//   if (!loading && !messages?.length) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <div className="text-center space-y-3">
//           <p className="text-gray-500 text-lg">No messages yet</p>
//           <p className="text-gray-400 text-sm">Start a conversation!</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 flex flex-col h-full overflow-hidden">
//       {latestPinnedMessage && (
//         <PinnedMessage
//           message={latestPinnedMessage}
//           onUnpin={() => handlePinToggle(latestPinnedMessage._id, true)}
//           onScrollTo={() => scrollToMessage(latestPinnedMessage._id)}
//         />
//       )}

//       {/* Loading indicator for old messages */}
//       <div ref={loadingRef} className="h-8 flex items-center justify-center">
//         {loading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
//       </div>

//       <MessageList
//         messages={messages}
//         currentUser={currentUser}
//         messageRefs={messageRefs}
//         messagesEndRef={messagesEndRef}
//         onDeleteMessage={handleDeleteMessage}
//         onEditMessage={handleEditMessage}
//         onPinMessage={messageId => handlePinToggle(messageId, false)}
//         onUnpinMessage={messageId => handlePinToggle(messageId, true)}
//         onReaction={handleReaction}
//         onOpenEmojiPicker={openEmojiPicker}
//         onScrollToMessage={scrollToMessage}
//         showEmojiPicker={showEmojiPicker}
//         selectedMessage={selectedMessage}
//         emojiPickerPosition={emojiPickerPosition}
//         onCloseEmojiPicker={() => {
//           setShowEmojiPicker(false);
//           setSelectedMessage(null);
//         }}
//       />
//     </div>
//   );
// };

// export default MessagesArea;

// import React, { useRef, useEffect, useState } from 'react';
// import { useSocket } from '@/context/SocketContext';
// import { useSelector, useDispatch } from 'react-redux';
// import {
//   selectMessagesLoading,
//   updateMessage,
//   deleteMessage,
// } from '@/redux/features/messages/messageSlice';
// import { useMessageActions } from '@/hooks/useMessageActions';
// import { useMessageScroll } from '@/hooks/useMessageScroll';
// import MessageList from './MessageList';
// import PinnedMessage from './PinnedMessage';

// const MessagesArea = ({ messages = [], currentUser, chatId }) => {
//   const messagesEndRef = useRef(null);
//   const dispatch = useDispatch();
//   const { socket } = useSocket();
//   const loading = useSelector(selectMessagesLoading);

//   const { markAsRead, handlePinToggle, getPinnedMessages, handleReaction } =
//     useMessageActions(chatId);

//   const { messageRefs, initializeMessageRefs, scrollToMessage } =
//     useMessageScroll();

//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [emojiPickerPosition, setEmojiPickerPosition] = useState({
//     top: 0,
//     left: 0,
//   });

//   useEffect(() => {
//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };
//     if (messages.length > 0) {
//       scrollToBottom();
//     }
//   }, [messages]);

//   useEffect(() => {
//     if (!socket || !currentUser) return;

//     const markUnreadMessages = async () => {
//       if (messages.length > 0 && currentUser?._id && chatId) {
//         const unreadMessages = messages.filter(
//           msg =>
//             msg.sender._id !== currentUser._id &&
//             !msg.readBy?.some(reader => reader._id === currentUser._id)
//         );

//         for (const msg of unreadMessages) {
//           await markAsRead(msg._id, currentUser._id);
//         }
//       }
//     };

//     markUnreadMessages();

//     const handleMessageUpdate = updatedMessage => {
//       dispatch(updateMessage(updatedMessage));
//     };

//     const handleMessageDelete = data => {
//       dispatch(deleteMessage({ messageId: data.messageId, chatId }));
//     };

//     const handleMessageRead = data => {
//       const { messageId, userId, readBy } = data;
//       const message = messages.find(msg => msg._id === messageId);

//       if (message) {
//         if (readBy) {
//           dispatch(updateMessage({ ...message, readBy }));
//         } else {
//           const updatedReadBy = [...(message.readBy || [])];
//           if (!updatedReadBy.some(reader => reader._id === userId)) {
//             updatedReadBy.push({ _id: userId });
//             dispatch(updateMessage({ ...message, readBy: updatedReadBy }));
//           }
//         }
//       }
//     };

//     const events = {
//       'message-updated': handleMessageUpdate,
//       'message-deleted': handleMessageDelete,
//       'message-reaction': handleMessageUpdate,
//       'message-read': handleMessageRead,
//     };

//     Object.entries(events).forEach(([event, handler]) => {
//       socket.on(event, handler);
//     });

//     return () => {
//       Object.entries(events).forEach(([event, handler]) => {
//         socket.off(event, handler);
//       });
//     };
//   }, [socket, dispatch, chatId, messages, currentUser, markAsRead]);

//   const handleDeleteMessage = async messageId => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}`, {
//         method: 'DELETE',
//       });

//       if (response.ok) {
//         dispatch(deleteMessage({ messageId, chatId }));
//       }
//     } catch (error) {
//       console.error('Error deleting message:', error);
//     }
//   };

//   const handleEditMessage = message => {
//     window.dispatchEvent(
//       new CustomEvent('editMessage', {
//         detail: {
//           id: message._id,
//           content: message.content,
//           chatId: message.chat,
//         },
//       })
//     );
//   };

//   const openEmojiPicker = (message, event) => {
//     const rect = event.currentTarget.getBoundingClientRect();
//     const isOwnMessage = message.sender._id === currentUser._id;

//     setEmojiPickerPosition({
//       top: rect.top + window.scrollY,
//       left: isOwnMessage ? rect.left : rect.right,
//       isOwnMessage,
//     });
//     setSelectedMessage(message);
//     setShowEmojiPicker(true);
//   };

//   useEffect(() => {
//     initializeMessageRefs(messages);
//   }, [messages, initializeMessageRefs]);

//   const pinnedMessages = getPinnedMessages(messages);
//   const latestPinnedMessage = pinnedMessages[0];

//   if (loading) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
//       </div>
//     );
//   }

//   if (!loading && !messages?.length) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <div className="text-center space-y-3">
//           <p className="text-gray-500 text-lg">No messages yet</p>
//           <p className="text-gray-400 text-sm">Start a conversation!</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 flex flex-col h-full overflow-hidden">
//       {latestPinnedMessage && (
//         <PinnedMessage
//           message={latestPinnedMessage}
//           onUnpin={() => handlePinToggle(latestPinnedMessage._id, true)}
//           onScrollTo={() => scrollToMessage(latestPinnedMessage._id)}
//         />
//       )}

//       <MessageList
//         messages={messages}
//         currentUser={currentUser}
//         messageRefs={messageRefs}
//         onDeleteMessage={handleDeleteMessage}
//         onEditMessage={handleEditMessage}
//         onPinMessage={messageId => handlePinToggle(messageId, false)}
//         onUnpinMessage={messageId => handlePinToggle(messageId, true)}
//         onReaction={handleReaction}
//         onOpenEmojiPicker={openEmojiPicker}
//         onScrollToMessage={scrollToMessage}
//         showEmojiPicker={showEmojiPicker}
//         selectedMessage={selectedMessage}
//         emojiPickerPosition={emojiPickerPosition}
//         onCloseEmojiPicker={() => {
//           setShowEmojiPicker(false);
//           setSelectedMessage(null);
//         }}
//         messagesEndRef={messagesEndRef}
//       />
//     </div>
//   );
// };

// export default MessagesArea;
