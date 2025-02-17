// // components/chat/MessageInput.js
import React, { useState, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Mic, Image, Smile, X } from "lucide-react";
import {
  sendMessage,
  updateMessage,
} from "@/redux/features/messages/messageSlice";
import { useSocket } from "@/context/SocketContext";
import { cn } from "@/lib/utils";

const MessageInput = ({ chatId }) => {
  const dispatch = useDispatch();
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingMessage, setEditingMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  const {
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
  } = useSocket();
  const typingTimeoutRef = useRef(null);

  // Listen for reply events
  React.useEffect(() => {
    const handleReplyTo = (event) => {
      setReplyingTo(event.detail);
      // Focus the input when replying
      document.querySelector('input[type="text"]')?.focus();
    };

    window.addEventListener("replyTo", handleReplyTo);
    return () => window.removeEventListener("replyTo", handleReplyTo);
  }, []);

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      startTyping(chatId, user._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(chatId, user._id);
    }, 3000);
  }, [isTyping, chatId, user._id, startTyping, stopTyping]);

  const handleFileSelect = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  }, []);

  const removeFile = useCallback((index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const cancelReplyOrEdit = () => {
    if (editingMessage) {
      setEditingMessage(null);
    }
    if (replyingTo) {
      setReplyingTo(null);
    }
    setMessageText("");
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() && files.length === 0) {
      return;
    }

    try {
      if (isTyping) {
        clearTimeout(typingTimeoutRef.current);
        setIsTyping(false);
        stopTyping(chatId, user._id);
      }

      const formData = new FormData();

      if (editingMessage) {
        // Handle message edit
        const response = await fetch(`/api/messages/${editingMessage._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: messageText }),
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(updateMessage(data.data));
          setEditingMessage(null);
        }
      } else {
        // Handle new message
        formData.append("content", messageText);
        formData.append("chatId", chatId);
        if (replyingTo) {
          formData.append("replyTo", replyingTo._id);
        }

        files.forEach((file) => {
          formData.append("files", file);
        });

        const resultAction = await dispatch(sendMessage(formData));

        if (sendMessage.fulfilled.match(resultAction)) {
          socketSendMessage(resultAction.payload);
        }
      }

      setMessageText("");
      setFiles([]);
      setUploadProgress(0);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error sending/editing message:", error);
    }
  };

  return (
    <div className="border-t bg-white">
      {/* Reply/Edit Preview */}
      {(replyingTo || editingMessage) && (
        <div className="p-2 border-b bg-gray-50 flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-600 font-medium">
              {editingMessage
                ? "Editing message"
                : `Replying to ${replyingTo.sender.name}`}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {editingMessage ? editingMessage.content : replyingTo.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelReplyOrEdit}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-4">
        <div className="flex items-center justify-between gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="w-[10%]"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5 text-gray-500" />
          </Button>

          <div className="w-full">
            <Input
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              placeholder={
                editingMessage ? "Edit your message..." : "Type a message..."
              }
              className={cn("w-full")}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  cancelReplyOrEdit();
                }
              }}
            />
            {files.length > 0 && (
              <div className="mt-2 flex gap-2 flex-wrap">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded"
                  >
                    <span className="max-w-[150px] truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>

          <div className="md:w-[20%] flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                fileInputRef.current.accept = "image/*";
                fileInputRef.current?.click();
              }}
            >
              <Image className="h-5 w-5 text-gray-500" alt="Upload" />
            </Button>

            <Button type="button" variant="ghost" size="icon">
              <Mic className="h-5 w-5 text-gray-500" />
            </Button>

            <Button type="button" variant="ghost" size="icon">
              <Smile className="h-5 w-5 text-gray-500" />
            </Button>

            <Button
              type="submit"
              disabled={!messageText.trim() && files.length === 0}
              className="bg-blue-500 hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;

// import React, { useState, useRef, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Send, Paperclip, Mic, Image, Smile, X } from "lucide-react";
// import { sendMessage } from "@/redux/features/messages/messageSlice";
// import { useSocket } from "@/context/SocketContext";
// import { cn } from "@/lib/utils";

// const MessageInput = ({ chatId }) => {
//   const dispatch = useDispatch();
//   const [messageText, setMessageText] = useState("");
//   const [isTyping, setIsTyping] = useState(false);
//   const [files, setFiles] = useState([]);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const fileInputRef = useRef(null);
//   const { user } = useSelector((state) => state.auth);
//   const {
//     sendMessage: socketSendMessage,
//     startTyping,
//     stopTyping,
//   } = useSocket();
//   const typingTimeoutRef = useRef(null);

//   console.log("[MessageInput] Current state:", {
//     messageText,
//     isTyping,
//     files,
//     uploadProgress,
//     user: user?._id,
//   });

//   const handleTyping = useCallback(() => {
//     if (!isTyping) {
//       setIsTyping(true);
//       startTyping(chatId, user._id);
//       console.log("[MessageInput] Started typing");
//     }

//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     typingTimeoutRef.current = setTimeout(() => {
//       setIsTyping(false);
//       stopTyping(chatId, user._id);
//       console.log("[MessageInput] Stopped typing");
//     }, 3000);
//   }, [isTyping, chatId, user._id, startTyping, stopTyping]);

//   const handleFileSelect = useCallback((e) => {
//     const selectedFiles = Array.from(e.target.files);
//     console.log(
//       "[MessageInput] Files selected:",
//       selectedFiles.map((f) => f.name)
//     );
//     setFiles((prev) => [...prev, ...selectedFiles]);
//   }, []);

//   const removeFile = useCallback((index) => {
//     console.log("[MessageInput] Removing file at index:", index);
//     setFiles((prev) => prev.filter((_, i) => i !== index));
//   }, []);

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     console.log("[MessageInput] Attempting to send message");

//     if (!messageText.trim() && files.length === 0) {
//       console.log("[MessageInput] No content to send");
//       return;
//     }

//     try {
//       if (isTyping) {
//         clearTimeout(typingTimeoutRef.current);
//         setIsTyping(false);
//         stopTyping(chatId, user._id);
//       }

//       const formData = new FormData();
//       formData.append("content", messageText);
//       formData.append("chatId", chatId);

//       files.forEach((file) => {
//         formData.append("files", file);
//         console.log("[MessageInput] Appending file:", file.name);
//       });

//       console.log("[MessageInput] Dispatching sendMessage");
//       const resultAction = await dispatch(sendMessage(formData));

//       if (sendMessage.fulfilled.match(resultAction)) {
//         console.log(
//           "[MessageInput] Message sent successfully:",
//           resultAction.payload
//         );
//         socketSendMessage(resultAction.payload);
//       } else {
//         console.error(
//           "[MessageInput] Failed to send message:",
//           resultAction.error
//         );
//       }

//       setMessageText("");
//       setFiles([]);
//       setUploadProgress(0);
//       if (fileInputRef.current) {
//         fileInputRef.current.value = "";
//       }
//     } catch (error) {
//       console.error("[MessageInput] Error sending message:", error);
//     }
//   };

//   return (
//     <form onSubmit={handleSendMessage} className="p-4 border-t">
//       <div className="flex items-center justify-between gap-2">
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handleFileSelect}
//           multiple
//           className="hidden"
//           accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
//         />

//         <Button
//           type="button"
//           variant="ghost"
//           size="icon"
//           className="w-[10%]"
//           onClick={() => fileInputRef.current?.click()}
//         >
//           <Paperclip className="h-5 w-5 text-gray-500" />
//         </Button>

//         <div className="w-full">
//           <Input
//             value={messageText}
//             onChange={(e) => {
//               setMessageText(e.target.value);
//               handleTyping();
//             }}
//             placeholder="Type a message..."
//             className={cn("w-full")}
//           />
//           {files.length > 0 && (
//             <div className="mt-2 flex gap-2 flex-wrap">
//               {files.map((file, index) => (
//                 <div
//                   key={index}
//                   className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded"
//                 >
//                   <span className="max-w-[150px] truncate">{file.name}</span>
//                   <button
//                     type="button"
//                     onClick={() => removeFile(index)}
//                     className="ml-2 text-gray-500 hover:text-red-500"
//                   >
//                     <X className="h-4 w-4" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           )}
//           {uploadProgress > 0 && uploadProgress < 100 && (
//             <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
//               <div
//                 className="bg-blue-600 h-2.5 rounded-full"
//                 style={{ width: `${uploadProgress}%` }}
//               ></div>
//             </div>
//           )}
//         </div>

//         <div className="md:w-[20%] flex justify-between items-center">
//           <Button
//             type="button"
//             variant="ghost"
//             size="icon"
//             onClick={() => {
//               fileInputRef.current.accept = "image/*";
//               fileInputRef.current?.click();
//             }}
//           >
//             <Image className="h-5 w-5 text-gray-500" alt="Upload" />
//           </Button>

//           <Button type="button" variant="ghost" size="icon">
//             <Mic className="h-5 w-5 text-gray-500" />
//           </Button>

//           <Button type="button" variant="ghost" size="icon">
//             <Smile className="h-5 w-5 text-gray-500" />
//           </Button>

//           <Button
//             type="submit"
//             disabled={!messageText.trim() && files.length === 0}
//             className="bg-blue-500 hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <Send className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
//     </form>
//   );
// };

// export default MessageInput;
