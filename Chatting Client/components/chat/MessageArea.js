// components/chat/MessageArea.js
'use client';
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
  const {
    markAsRead,
    handlePinMessage,
    handleUnpinMessage,
    getPinnedMessages,
  } = useMessageActions(chatId);
  const { messageRefs, initializeMessageRefs, scrollToMessage } =
    useMessageScroll();

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const dispatch = useDispatch();
  const { markMessageRead, socket } = useSocket();
  const loading = useSelector(selectMessagesLoading);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Mark messages as read and handle real-time updates
  useEffect(() => {
    if (!socket || !currentUser) return;

    // Mark unread messages as read
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

    // Socket event handlers
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

    // Subscribe to socket events
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

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(updateMessage(data.data));
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setShowEmojiPicker(false);
      setSelectedMessage(null);
    }
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
          onUnpin={() => handleUnpinMessage(latestPinnedMessage._id)}
          onScrollTo={() => scrollToMessage(latestPinnedMessage._id)}
        />
      )}

      <MessageList
        messages={messages}
        currentUser={currentUser}
        messageRefs={messageRefs}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onPinMessage={handlePinMessage}
        onReaction={handleReaction}
        onOpenEmojiPicker={openEmojiPicker}
        onScrollToMessage={scrollToMessage}
        showEmojiPicker={showEmojiPicker}
        selectedMessage={selectedMessage}
        emojiPickerPosition={emojiPickerPosition}
        onCloseEmojiPicker={() => setShowEmojiPicker(false)}
        messagesEndRef={messagesEndRef}
      />
    </div>
  );
};

export default MessagesArea;

// // components/chat/MessageArea.js // all components
// 'use client';
// import React, { useRef, useEffect, useState } from 'react';
// import { format, isToday, isYesterday } from 'date-fns';
// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
// import { useSocket } from '@/context/SocketContext';
// import { useSelector, useDispatch } from 'react-redux';
// import {
//   selectMessagesLoading,
//   updateMessage,
//   deleteMessage,
// } from '@/redux/features/messages/messageSlice';
// import {
//   Check,
//   CheckCheck,
//   Pin,
//   Edit2,
//   Reply,
//   Smile,
//   MoreVertical,
//   ChevronDown,
//   Trash2,
//   X,
// } from 'lucide-react';
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from '@/components/ui/dropdown-menu';
// import { Button } from '@/components/ui/button';
// import { useMessageActions } from '@/hooks/useMessageActions';
// import { useMessageScroll } from '@/hooks/useMessageScroll';

// const MessagesArea = ({ messages = [], currentUser, chatId }) => {
//   const messagesEndRef = useRef(null);
//   // const messageRefs = useRef({});
//   const {
//     markAsRead,
//     handlePinMessage,
//     handleUnpinMessage,
//     getPinnedMessages,
//   } = useMessageActions(chatId);
//   const { messageRefs, initializeMessageRefs, scrollToMessage } =
//     useMessageScroll();

//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState(null);
//   const [pinnedMessage, setPinnedMessage] = useState(null);
//   const [emojiPickerPosition, setEmojiPickerPosition] = useState({
//     top: 0,
//     left: 0,
//   });

//   const dispatch = useDispatch();
//   const { markMessageRead, socket } = useSocket();
//   const loading = useSelector(selectMessagesLoading);

//   // Auto-scroll to bottom on new messages
//   useEffect(() => {
//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };
//     if (messages.length > 0) {
//       scrollToBottom();
//     }
//   }, [messages]);

//   // Find and set pinned message
//   useEffect(() => {
//     const pinnedMessages = messages.filter(msg => msg.isPinned);
//     const latestPinned = pinnedMessages.reduce((latest, current) => {
//       if (!latest) return current;
//       return new Date(current.pinnedAt) > new Date(latest.pinnedAt)
//         ? current
//         : latest;
//     }, null);
//     setPinnedMessage(latestPinned);
//   }, [messages]);

//   // Mark messages as read and handle real-time updates
//   useEffect(() => {
//     if (!socket || !currentUser) return;

//     // Mark unread messages as read
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

//     // Socket event handlers
//     const handleMessageUpdate = updatedMessage => {
//       // Handle pinned message updates
//       if (updatedMessage.isPinned) {
//         // Unpin any other pinned messages
//         messages.forEach(msg => {
//           if (msg.isPinned && msg._id !== updatedMessage._id) {
//             dispatch(
//               updateMessage({ ...msg, isPinned: false, pinnedAt: null })
//             );
//           }
//         });
//       }
//       dispatch(updateMessage(updatedMessage));
//     };

//     const handleMessageDelete = data => {
//       dispatch(deleteMessage({ messageId: data.messageId, chatId }));
//       if (pinnedMessage?._id === data.messageId) {
//         setPinnedMessage(null);
//       }
//     };

//     const handleMessageRead = data => {
//       const { messageId, userId, readBy } = data;
//       const message = messages.find(msg => msg._id === messageId);

//       if (message) {
//         if (readBy) {
//           // If server sends complete readBy array, use it
//           dispatch(updateMessage({ ...message, readBy }));
//         } else {
//           // Otherwise, update locally
//           const updatedReadBy = [...(message.readBy || [])];
//           if (!updatedReadBy.some(reader => reader._id === userId)) {
//             updatedReadBy.push({ _id: userId });
//             dispatch(updateMessage({ ...message, readBy: updatedReadBy }));
//           }
//         }
//       }
//     };

//     // Subscribe to socket events
//     const events = {
//       'message-updated': handleMessageUpdate,
//       'message-deleted': handleMessageDelete,
//       'message-reaction': handleMessageUpdate,
//       'message-read': handleMessageRead,
//     };

//     // Register all event listeners
//     Object.entries(events).forEach(([event, handler]) => {
//       socket.on(event, handler);
//     });

//     // Cleanup function
//     return () => {
//       // Remove all event listeners
//       Object.entries(events).forEach(([event, handler]) => {
//         socket.off(event, handler);
//       });
//     };
//   }, [
//     socket,
//     dispatch,
//     chatId,
//     messages,
//     currentUser,
//     pinnedMessage,
//     markAsRead,
//   ]);

//   const handleDeleteMessage = async messageId => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}`, {
//         method: 'DELETE',
//       });

//       if (response.ok) {
//         dispatch(deleteMessage({ messageId, chatId }));
//         if (pinnedMessage?._id === messageId) {
//           setPinnedMessage(null);
//         }
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

//   const handleReaction = async (messageId, emoji) => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}/react`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ emoji }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         dispatch(updateMessage(data.data));
//       }
//     } catch (error) {
//       console.error('Error adding reaction:', error);
//     } finally {
//       setShowEmojiPicker(false);
//       setSelectedMessage(null);
//     }
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

//   const renderPinnedMessage = () => {
//     if (!latestPinnedMessage) return null;

//     const handlePinnedMessageClick = () => {
//       scrollToMessage(latestPinnedMessage._id);
//     };

//     return (
//       <div className="border-b bg-white shadow-sm sticky top-0 z-10">
//         <div className="px-4 py-2 hover:bg-gray-50/80 transition-colors">
//           <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
//             <div className="flex items-center gap-2">
//               <Pin className="h-4 w-4 text-blue-500" />
//               <span className="font-medium">Pinned Message</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={handlePinnedMessageClick}
//                 className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
//               >
//                 <ChevronDown className="h-4 w-4" />
//                 <span className="text-xs">Jump to message</span>
//               </Button>
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={() => handleUnpinMessage(latestPinnedMessage._id)}
//                 className="text-gray-500 hover:text-gray-700"
//               >
//                 <X className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//           <div onClick={handlePinnedMessageClick} className="cursor-pointer">
//             {renderMessage(latestPinnedMessage, true)}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderMessage = (message, isPinnedView = false) => {
//     if (!message?.sender || !currentUser) return null;

//     console.log('Current user:', currentUser);
//     console.log('Message sender:', message.sender);

//     const isOwnMessage = message.sender._id === currentUser._id;
//     const messageTime = format(new Date(message.createdAt), 'h:mm a');
//     const isRead = message.readBy?.some(
//       reader => reader._id !== currentUser._id
//     );

//     return (
//       <div
//         key={`${message._id}${isPinnedView ? '-pinned' : ''}`}
//         ref={el => {
//           if (!isPinnedView) {
//             messageRefs.current[message._id] = { current: el };
//           }
//         }}
//         className={`flex items-start gap-2 group ${
//           isOwnMessage ? 'flex-row-reverse' : 'flex-row'
//         } ${isPinnedView ? 'bg-gray-50/80 p-2 rounded-lg mb-2' : 'mb-4'}`}
//       >
//         <Avatar className="h-10 w-10 border-2 flex-shrink-0">
//           <AvatarImage
//             src={isOwnMessage ? currentUser.image : message.sender?.image}
//             alt={isOwnMessage ? currentUser.name : message.sender.name}
//           />
//           <AvatarFallback>
//             {(isOwnMessage ? currentUser.name : message.sender.name)
//               ?.substring(0, 2)
//               .toUpperCase()}
//           </AvatarFallback>
//         </Avatar>

//         <div
//           className={`flex flex-col ${
//             isOwnMessage ? 'items-end' : 'items-start'
//           } max-w-[65%]`}
//         >
//           {!isOwnMessage && (
//             <span className="text-xs text-gray-500 mb-1">
//               {message.sender.name}
//             </span>
//           )}

//           <div className="relative group">
//             {message.replyTo && (
//               <div
//                 className="text-xs text-gray-600 mb-1 bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
//                 onClick={() => scrollToMessage(message.replyTo._id)}
//               >
//                 <div className="flex items-center gap-1 mb-1">
//                   <Reply className="h-3 w-3" />
//                   <span className="font-medium">
//                     {message.replyTo.sender.name}
//                   </span>
//                 </div>
//                 {message.replyTo.content.substring(0, 50)}
//                 {message.replyTo.content.length > 50 ? '...' : ''}
//               </div>
//             )}

//             <div
//               className={`rounded-lg px-3 py-2 ${
//                 isOwnMessage
//                   ? 'bg-blue-500 text-white'
//                   : 'bg-gray-200 text-gray-900'
//               }`}
//             >
//               <p className="whitespace-pre-wrap break-words">
//                 {message.content}
//               </p>
//             </div>

//             {message.reactions?.length > 0 && (
//               <div
//                 className={`flex flex-wrap gap-1 mt-1 ${
//                   isOwnMessage ? 'justify-end' : 'justify-start'
//                 }`}
//               >
//                 {message.reactions.map((reaction, index) => (
//                   <span
//                     key={index}
//                     className="bg-gray-100 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-gray-200"
//                     onClick={() => handleReaction(message._id, reaction.emoji)}
//                   >
//                     {reaction.emoji} {reaction.count}
//                   </span>
//                 ))}
//               </div>
//             )}

//             {!isPinnedView && (
//               <div
//                 className={`absolute top-1/2 -translate-y-1/2 ${
//                   isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'
//                 } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
//               >
//                 <DropdownMenu>
//                   <DropdownMenuTrigger asChild>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
//                     >
//                       <MoreVertical className="h-4 w-4" />
//                     </Button>
//                   </DropdownMenuTrigger>
//                   <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
//                     <DropdownMenuItem
//                       onClick={() =>
//                         window.dispatchEvent(
//                           new CustomEvent('replyTo', { detail: message })
//                         )
//                       }
//                     >
//                       <Reply className="h-4 w-4 mr-2" />
//                       Reply
//                     </DropdownMenuItem>
//                     {isOwnMessage && (
//                       <>
//                         <DropdownMenuItem
//                           onClick={() => handleEditMessage(message)}
//                         >
//                           <Edit2 className="h-4 w-4 mr-2" />
//                           Edit
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => handleDeleteMessage(message._id)}
//                           className="text-red-600"
//                         >
//                           <Trash2 className="h-4 w-4 mr-2" />
//                           Delete
//                         </DropdownMenuItem>
//                       </>
//                     )}
//                     <DropdownMenuItem
//                       onClick={() => handlePinMessage(message._id)}
//                     >
//                       <Pin className="h-4 w-4 mr-2" />
//                       {message.isPinned ? 'Unpin' : 'Pin'}
//                     </DropdownMenuItem>
//                     <DropdownMenuItem
//                       onClick={e => openEmojiPicker(message, e)}
//                     >
//                       <Smile className="h-4 w-4 mr-2" />
//                       React
//                     </DropdownMenuItem>
//                   </DropdownMenuContent>
//                 </DropdownMenu>
//               </div>
//             )}
//           </div>

//           <div className="flex items-center text-xs mt-1 gap-1">
//             <span className="text-gray-500">{messageTime}</span>
//             {isOwnMessage && (
//               <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
//                 {isRead ? (
//                   <CheckCheck className="h-3 w-3" />
//                 ) : (
//                   <Check className="h-3 w-3" />
//                 )}
//               </span>
//             )}
//             {message.isEdited && (
//               <span className="text-gray-400">(edited)</span>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Group messages by date
//   const groupedMessages = messages.reduce((groups, message) => {
//     const date = new Date(message.createdAt);
//     const dateStr = isToday(date)
//       ? 'Today'
//       : isYesterday(date)
//       ? 'Yesterday'
//       : format(date, 'MMMM d, yyyy');

//     if (!groups[dateStr]) {
//       groups[dateStr] = [];
//     }
//     groups[dateStr].push(message);
//     return groups;
//   }, {});

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
//       {renderPinnedMessage()}

//       <div className="flex-1 overflow-y-auto px-4 py-2">
//         {Object.entries(groupedMessages).map(([date, dateMessages]) => (
//           <div key={date}>
//             <div className="flex items-center justify-center my-4">
//               <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
//                 {date}
//               </div>
//             </div>
//             {dateMessages.map(message => renderMessage(message))}
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {showEmojiPicker && selectedMessage && (
//         <div
//           className="fixed inset-0 z-50"
//           onClick={() => setShowEmojiPicker(false)}
//         >
//           <div
//             className="absolute bg-white rounded-lg p-4 shadow-xl"
//             style={{
//               top: emojiPickerPosition.top,
//               left: emojiPickerPosition.left,
//               transform: emojiPickerPosition.isOwnMessage
//                 ? 'translate(-100%, -50%)'
//                 : 'translate(0, -50%)',
//             }}
//             onClick={e => e.stopPropagation()}
//           >
//             <div className="grid grid-cols-8 gap-2">
//               {['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡'].map(emoji => (
//                 <button
//                   key={emoji}
//                   className="text-2xl hover:bg-gray-100 p-2 rounded"
//                   onClick={() => handleReaction(selectedMessage._id, emoji)}
//                 >
//                   {emoji}
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MessagesArea;
