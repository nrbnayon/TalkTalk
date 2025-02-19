// components/chat/MessageArea.js
import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMessagesLoading,
  updateMessage,
  deleteMessage,
} from '@/redux/features/messages/messageSlice';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useMessageScroll } from '@/hooks/useMessageScroll';
import MessageList from './MessageList';
import PinnedMessage from './PinnedMessage';

const MessagesArea = ({ messages = [], currentUser, chatId }) => {
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const { socket } = useSocket();
  const loading = useSelector(selectMessagesLoading);

  const { markAsRead, handlePinToggle, getPinnedMessages, handleReaction } =
    useMessageActions(chatId);

  const { messageRefs, initializeMessageRefs, scrollToMessage } =
    useMessageScroll();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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

      <MessageList
        messages={messages}
        currentUser={currentUser}
        messageRefs={messageRefs}
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
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

export default MessagesArea;

// 'use client';
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

//   const dispatch = useDispatch();
//   const { socket } = useSocket();
//   const loading = useSelector(selectMessagesLoading);

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
