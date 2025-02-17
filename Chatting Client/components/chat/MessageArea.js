// // components/chat/MessageArea.js
"use client";
import React, { useRef, useEffect, useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSocket } from "@/context/SocketContext";
import { useSelector, useDispatch } from "react-redux";
import {
  selectMessagesLoading,
  updateMessage,
  deleteMessage,
} from "@/redux/features/messages/messageSlice";
import {
  Check,
  CheckCheck,
  Pin,
  Edit2,
  Reply,
  Smile,
  MoreVertical,
  ChevronDown,
  Trash2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const MessagesArea = ({ messages = [], currentUser, chatId }) => {
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [pinnedMessage, setPinnedMessage] = useState(null);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const dispatch = useDispatch();
  const { socket } = useSocket();
  const loading = useSelector(selectMessagesLoading);

  // Initialize refs for each message
  useEffect(() => {
    messages.forEach((message) => {
      if (!messageRefs.current[message._id]) {
        messageRefs.current[message._id] = React.createRef();
      }
    });
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Find and set pinned message
  useEffect(() => {
    const pinnedMessages = messages.filter((msg) => msg.isPinned);
    const latestPinned = pinnedMessages.reduce((latest, current) => {
      if (!latest) return current;
      return new Date(current.pinnedAt) > new Date(latest.pinnedAt)
        ? current
        : latest;
    }, null);
    setPinnedMessage(latestPinned);
  }, [messages]);

  // Mark messages as read and handle real-time updates
  useEffect(() => {
    if (!socket || !currentUser) return;

    const markMessageAsRead = async (messageId) => {
      try {
        const response = await fetch(`/api/messages/${messageId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId: currentUser._id }),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(updateMessage(data.data));

          // Emit socket event for real-time updates
          socket.emit("message-read", {
            messageId,
            chatId,
            userId: currentUser._id,
          });
        }
      } catch (error) {
        console.error("Error marking message as read:", error);
      }
    };

    // Mark unread messages as read
    const unreadMessages = messages.filter(
      (msg) =>
        msg.sender._id !== currentUser._id &&
        !msg.readBy?.some((reader) => reader._id === currentUser._id)
    );

    unreadMessages.forEach((msg) => {
      markMessageAsRead(msg._id);
    });

    // Socket event handlers
    const handleMessageUpdate = (updatedMessage) => {
      if (updatedMessage.isPinned) {
        messages.forEach((msg) => {
          if (msg.isPinned && msg._id !== updatedMessage._id) {
            dispatch(updateMessage({ ...msg, isPinned: false }));
          }
        });
      }
      dispatch(updateMessage(updatedMessage));
    };

    const handleMessageDelete = (data) => {
      dispatch(deleteMessage({ messageId: data.messageId, chatId }));
      if (pinnedMessage?._id === data.messageId) {
        setPinnedMessage(null);
      }
    };

    const handleMessageRead = (data) => {
      const { messageId, userId } = data;
      const message = messages.find((msg) => msg._id === messageId);

      if (message) {
        const updatedReadBy = message.readBy || [];
        if (!updatedReadBy.some((reader) => reader._id === userId)) {
          updatedReadBy.push({ _id: userId });
          dispatch(updateMessage({ ...message, readBy: updatedReadBy }));
        }
      }
    };

    socket.on("message-updated", handleMessageUpdate);
    socket.on("message-deleted", handleMessageDelete);
    socket.on("message-reaction", handleMessageUpdate);
    socket.on("message-read", handleMessageRead);

    return () => {
      socket.off("message-updated", handleMessageUpdate);
      socket.off("message-deleted", handleMessageDelete);
      socket.off("message-reaction", handleMessageUpdate);
      socket.off("message-read", handleMessageRead);
    };
  }, [socket, dispatch, chatId, messages, currentUser, pinnedMessage]);

  const handlePinMessage = async (messageId) => {
    try {
      if (pinnedMessage && pinnedMessage._id !== messageId) {
        await fetch(`/api/messages/${pinnedMessage._id}/pin`, {
          method: "PATCH",
        });
      }

      const response = await fetch(`/api/messages/${messageId}/pin`, {
        method: "PATCH",
      });

      if (response.ok) {
        const data = await response.json();
        if (pinnedMessage) {
          dispatch(updateMessage({ ...pinnedMessage, isPinned: false }));
        }
        dispatch(updateMessage({ ...data.data, pinnedAt: new Date() }));
      }
    } catch (error) {
      console.error("Error pinning message:", error);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        dispatch(deleteMessage({ messageId, chatId }));
        if (pinnedMessage?._id === messageId) {
          setPinnedMessage(null);
        }
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditMessage = (message) => {
    window.dispatchEvent(
      new CustomEvent("editMessage", {
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();
        dispatch(updateMessage(data.data));
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
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

  const scrollToMessage = (messageId) => {
    const messageRef = messageRefs.current[messageId];
    if (messageRef?.current) {
      messageRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      messageRef.current.classList.add("highlight");
      setTimeout(() => {
        messageRef.current?.classList.remove("highlight");
      }, 2000);
    }
  };

  const renderMessage = (message, isPinnedView = false) => {
    if (!message?.sender || !currentUser) return null;

    const isOwnMessage = message.sender._id === currentUser._id;
    const messageTime = format(new Date(message.createdAt), "h:mm a");
    const isRead = message.readBy?.some(
      (reader) => reader._id !== currentUser._id
    );

    return (
      <div
        key={`${message._id}${isPinnedView ? "-pinned" : ""}`}
        ref={messageRefs.current[message._id]}
        className={`flex items-start gap-2 group ${
          isOwnMessage ? "flex-row-reverse" : "flex-row"
        } ${isPinnedView ? "bg-gray-50/80 p-2 rounded-lg mb-2" : "mb-4"}`}
      >
        <Avatar className="h-8 w-8 border flex-shrink-0">
          <AvatarImage src={message.sender.image} alt={message.sender.name} />
          <AvatarFallback>
            {message.sender.name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div
          className={`flex flex-col ${
            isOwnMessage ? "items-end" : "items-start"
          } max-w-[65%]`}
        >
          <span className="text-xs text-gray-500 mb-1">
            {message.sender.name}
          </span>

          <div className="relative group">
            {message.replyTo && (
              <div
                className="text-xs text-gray-600 mb-1 bg-gray-100 p-2 rounded cursor-pointer hover:bg-gray-200"
                onClick={() => scrollToMessage(message.replyTo._id)}
              >
                <div className="flex items-center gap-1 mb-1">
                  <Reply className="h-3 w-3" />
                  <span className="font-medium">
                    {message.replyTo.sender.name}
                  </span>
                </div>
                {message.replyTo.content.substring(0, 50)}
                {message.replyTo.content.length > 50 ? "..." : ""}
              </div>
            )}

            <div
              className={`rounded-lg px-3 py-2 ${
                isOwnMessage
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-900"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>

            {message.reactions?.length > 0 && (
              <div
                className={`flex flex-wrap gap-1 mt-1 ${
                  isOwnMessage ? "justify-end" : "justify-start"
                }`}
              >
                {message.reactions.map((reaction, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-gray-200"
                    onClick={() => handleReaction(message._id, reaction.emoji)}
                  >
                    {reaction.emoji} {reaction.count}
                  </span>
                ))}
              </div>
            )}

            {!isPinnedView && (
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isOwnMessage ? "right-full mr-2" : "left-full ml-2"
                } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isOwnMessage ? "end" : "start"}>
                    <DropdownMenuItem
                      onClick={() =>
                        window.dispatchEvent(
                          new CustomEvent("replyTo", { detail: message })
                        )
                      }
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </DropdownMenuItem>
                    {isOwnMessage && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleEditMessage(message)}
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteMessage(message._id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => handlePinMessage(message._id)}
                    >
                      <Pin className="h-4 w-4 mr-2" />
                      {message.isPinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => openEmojiPicker(message, e)}
                    >
                      <Smile className="h-4 w-4 mr-2" />
                      React
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          <div className="flex items-center text-xs mt-1 gap-1">
            <span className="text-gray-500">{messageTime}</span>
            {isOwnMessage && (
              <span className={isRead ? "text-blue-500" : "text-gray-400"}>
                {isRead ? (
                  <CheckCheck className="h-3 w-3" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
              </span>
            )}
            {message.isEdited && (
              <span className="text-gray-400">(edited)</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateStr = isToday(date)
      ? "Today"
      : isYesterday(date)
      ? "Yesterday"
      : format(date, "MMMM d, yyyy");

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {pinnedMessage && (
        <div className="border-b bg-white shadow-sm sticky top-0 z-10">
          <div className="px-4 py-2 hover:bg-gray-50/80 transition-colors">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Pinned Message</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => scrollToMessage(pinnedMessage._id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePinMessage(pinnedMessage._id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {renderMessage(pinnedMessage, true)}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            <div className="flex items-center justify-center my-4">
              <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {date}
              </div>
            </div>
            {dateMessages.map((message) => renderMessage(message))}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {showEmojiPicker && selectedMessage && (
        <div
          className="fixed inset-0 z-50"
          onClick={() => setShowEmojiPicker(false)}
        >
          <div
            className="absolute bg-white rounded-lg p-4 shadow-xl"
            style={{
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
              transform: emojiPickerPosition.isOwnMessage
                ? "translate(-100%, -50%)"
                : "translate(0, -50%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-8 gap-2">
              {["😊", "😂", "❤️", "👍", "👎", "😮", "😢", "😡"].map((emoji) => (
                <button
                  key={emoji}
                  className="text-2xl hover:bg-gray-100 p-2 rounded"
                  onClick={() => handleReaction(selectedMessage._id, emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesArea;

// import React, { useRef, useEffect, useState } from "react";
// import { format, isToday, isYesterday } from "date-fns";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { useSocket } from "@/context/SocketContext";
// import { useSelector, useDispatch } from "react-redux";
// import {
//   selectMessagesLoading,
//   updateMessage,
// } from "@/redux/features/messages/messageSlice";
// import {
//   Check,
//   CheckCheck,
//   Pin,
//   Edit2,
//   Reply,
//   Smile,
//   MoreVertical,
// } from "lucide-react";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { EmojiPicker } from "./EmojiPicker";
// import { cn } from "@/lib/utils";
// import { Avatar } from "@/components/ui/avatar";

// const MessageArea = ({ messages = [], currentUser, chatId }) => {
//   const messagesEndRef = useRef(null);
//   const [editingMessage, setEditingMessage] = useState(null);
//   const [editContent, setEditContent] = useState("");
//   const [replyingTo, setReplyingTo] = useState(null);
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [selectedMessage, setSelectedMessage] = useState(null);

//   const dispatch = useDispatch();
//   const { markMessageRead, socket } = useSocket();
//   const loading = useSelector(selectMessagesLoading);

//   // Auto scroll to bottom
//   useEffect(() => {
//     const scrollToBottom = () => {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     };
//     if (messages.length > 0) {
//       scrollToBottom();
//     }
//   }, [messages]);

//   // Mark messages as read
//   useEffect(() => {
//     if (messages.length > 0 && currentUser?._id && chatId) {
//       const unreadMessages = messages.filter(
//         (msg) =>
//           msg.sender._id !== currentUser._id &&
//           !msg.readBy?.includes(currentUser._id)
//       );

//       unreadMessages.forEach((msg) => {
//         markMessageRead(msg._id, chatId, currentUser._id);
//       });
//     }
//   }, [messages, currentUser, chatId, markMessageRead]);

//   // Edit message
//   const handleEditSubmit = async (messageId) => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}/edit`, {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ content: editContent }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         dispatch(updateMessage(data.data));
//         setEditingMessage(null);
//         setEditContent("");
//       }
//     } catch (error) {
//       console.error("Error editing message:", error);
//     }
//   };

//   // Pin/Unpin message
//   const handlePinMessage = async (messageId) => {
//     try {
//       const response = await fetch(`/api/messages/${messageId}/pin`, {
//         method: "PATCH",
//       });

//       if (response.ok) {
//         const data = await response.json();
//         dispatch(updateMessage(data.data));
//       }
//     } catch (error) {
//       console.error("Error pinning message:", error);
//     }
//   };

//   // Handle emoji reaction
//   const handleReaction = async (messageId, emoji) => {
//     if (socket) {
//       socket.emit("message-reaction", { messageId, chatId, emoji });
//     }
//     setShowEmojiPicker(false);
//     setSelectedMessage(null);
//   };

//   // Group messages by date
//   const groupedMessages = messages.reduce((groups, message) => {
//     if (!message?.createdAt) return groups;

//     const date = new Date(message.createdAt);
//     let dateStr = isToday(date)
//       ? "Today"
//       : isYesterday(date)
//       ? "Yesterday"
//       : format(date, "MMMM d, yyyy");

//     if (!groups[dateStr]) {
//       groups[dateStr] = [];
//     }
//     groups[dateStr].push(message);
//     return groups;
//   }, {});

//   // Render individual message
//   const renderMessage = (message) => {
//     if (!message?.sender || !currentUser) return null;

//     const isOwnMessage = message.sender._id === currentUser._id;
//     const messageTime = message.createdAt
//       ? format(new Date(message.createdAt), "h:mm a")
//       : "";
//     const isRead = message.readBy?.length > 1;

//     return (
//       <div
//         key={message._id}
//         className={`flex items-start gap-2 group ${
//           isOwnMessage ? "flex-row-reverse" : "flex-row"
//         }`}
//       >
//         <Avatar className="h-10 w-10 border-2 flex-shrink-0">
//           <AvatarImage
//             src={isOwnMessage ? currentUser.image : message.sender.image}
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
//             isOwnMessage ? "items-end" : "items-start"
//           } max-w-[65%]`}
//         >
//           {!isOwnMessage && (
//             <span className="text-xs text-gray-500 mb-1">
//               {message.sender.name}
//             </span>
//           )}

//           <div className="relative group">
//             {/* Reply reference */}
//             {message.replyTo && (
//               <div className="text-xs text-gray-500 mb-1 bg-gray-100 p-1 rounded">
//                 Replying to {message.replyTo.sender.name}:{" "}
//                 {message.replyTo.content.substring(0, 50)}...
//               </div>
//             )}

//             {/* Message content */}
//             <div
//               className={`rounded-2xl px-4 py-2 shadow-sm ${
//                 isOwnMessage
//                   ? "bg-green-500 text-white rounded-tr-none"
//                   : "bg-cyan-500 text-white rounded-tl-none"
//               }`}
//             >
//               {message.isDeleted ? (
//                 <span className="italic text-gray-400">
//                   This message was deleted
//                 </span>
//               ) : (
//                 <>
//                   <p className="whitespace-pre-wrap break-words">
//                     {editingMessage === message._id ? (
//                       <Input
//                         value={editContent}
//                         onChange={(e) => setEditContent(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === "Enter") handleEditSubmit(message._id);
//                           if (e.key === "Escape") setEditingMessage(null);
//                         }}
//                         className="bg-white text-black"
//                         autoFocus
//                       />
//                     ) : (
//                       message.content
//                     )}
//                   </p>
//                   {message.isPinned && (
//                     <Pin className="h-4 w-4 inline-block ml-2" />
//                   )}
//                   {message.isEdited && (
//                     <span className="text-xs ml-1 text-gray-300">(edited)</span>
//                   )}
//                 </>
//               )}
//             </div>

//             {/* Message actions dropdown */}
//             <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
//               <DropdownMenu>
//                 <DropdownMenuTrigger asChild>
//                   <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                     <MoreVertical className="h-4 w-4" />
//                   </Button>
//                 </DropdownMenuTrigger>
//                 <DropdownMenuContent align="end">
//                   <DropdownMenuItem onClick={() => setReplyingTo(message)}>
//                     <Reply className="h-4 w-4 mr-2" />
//                     Reply
//                   </DropdownMenuItem>
//                   {isOwnMessage && (
//                     <DropdownMenuItem
//                       onClick={() => {
//                         setEditingMessage(message._id);
//                         setEditContent(message.content);
//                       }}
//                     >
//                       <Edit2 className="h-4 w-4 mr-2" />
//                       Edit
//                     </DropdownMenuItem>
//                   )}
//                   <DropdownMenuItem
//                     onClick={() => handlePinMessage(message._id)}
//                   >
//                     <Pin className="h-4 w-4 mr-2" />
//                     {message.isPinned ? "Unpin" : "Pin"}
//                   </DropdownMenuItem>
//                   <DropdownMenuItem
//                     onClick={() => {
//                       setSelectedMessage(message);
//                       setShowEmojiPicker(true);
//                     }}
//                   >
//                     <Smile className="h-4 w-4 mr-2" />
//                     React
//                   </DropdownMenuItem>
//                 </DropdownMenuContent>
//               </DropdownMenu>
//             </div>

//             {/* Reactions display */}
//             {message.reactions?.length > 0 && (
//               <div className="flex flex-wrap gap-1 mt-1">
//                 {message.reactions.map((reaction, index) => (
//                   <span
//                     key={index}
//                     className="bg-gray-100 rounded-full px-2 py-0.5 text-xs"
//                   >
//                     {reaction.emoji}
//                   </span>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Message status */}
//           <div className="flex items-center text-xs mt-1 gap-1">
//             {isOwnMessage && (
//               <span className={isRead ? "text-blue-500" : "text-gray-400"}>
//                 {isRead ? (
//                   <CheckCheck className="h-4 w-4" />
//                 ) : (
//                   <Check className="h-4 w-4" />
//                 )}
//               </span>
//             )}
//             <span className="text-gray-500">{messageTime}</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   if (loading) {
//     return (
//       <div className="flex-1 flex items-center justify-center">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
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
//     <>
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
//         {Object.entries(groupedMessages).map(([date, dateMessages]) => (
//           <div key={date} className="space-y-4">
//             <div className="flex justify-center">
//               <span className="text-xs bg-white rounded-full px-4 py-1.5 text-gray-500 shadow-sm">
//                 {date}
//               </span>
//             </div>
//             {dateMessages.map(renderMessage)}
//           </div>
//         ))}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Emoji Picker Dialog */}
//       <Dialog
//         open={showEmojiPicker}
//         onOpenChange={setShowEmojiPicker}
//         className={cn("border-none")}
//       >
//         <DialogContent className={cn("border-none")}>
//           <DialogHeader className={cn("hidden")}>
//             <DialogTitle>Add Reaction</DialogTitle>
//           </DialogHeader>
//           <div className="mt-4 flex justify-center  items-center">
//             <EmojiPicker
//               onEmojiSelect={(emoji) => {
//                 if (selectedMessage) {
//                   handleReaction(selectedMessage._id, emoji);
//                 }
//               }}
//             />
//           </div>
//         </DialogContent>
//       </Dialog>
//     </>
//   );
// };

// export default MessageArea;
