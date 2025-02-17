import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { MoreVertical, Check, CheckCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MessageList = ({ messages, currentUser }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const renderMessage = (message) => {
    const isOwnMessage = message.sender._id === currentUser._id;
    const time = format(new Date(message.createdAt), "h:mm a");

    return (
      <div
        key={message._id}
        className={`flex ${
          isOwnMessage ? "justify-end" : "justify-start"
        } mb-4`}
      >
        <div
          className={`flex ${
            isOwnMessage ? "flex-row-reverse" : "flex-row"
          } items-end gap-2 max-w-[70%]`}
        >
          {!isOwnMessage && (
            <Avatar
              src={message.sender.image}
              alt={message.sender.name}
              className='h-8 w-8'
            />
          )}

          <div
            className={`group relative rounded-lg p-3 ${
              isOwnMessage
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-900"
            }`}
          >
            {message.replyTo && (
              <div
                className={`text-xs mb-1 ${
                  isOwnMessage ? "text-blue-100" : "text-gray-500"
                }`}
              >
                Replying to: {message.replyTo.content.substring(0, 30)}...
              </div>
            )}

            <p className='break-words'>{message.content}</p>

            <div
              className={`flex items-center gap-1 text-xs mt-1 ${
                isOwnMessage ? "text-blue-100" : "text-gray-500"
              }`}
            >
              <span>{time}</span>
              {isOwnMessage &&
                (message.readBy?.length > 0 ? (
                  <CheckCheck size={14} />
                ) : (
                  <Check size={14} />
                ))}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className='absolute top-2 right-2 opacity-0 group-hover:opacity-100'>
                <MoreVertical className='h-4 w-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Reply</DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem className='text-red-500'>
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className='flex-1 overflow-y-auto p-4 space-y-4'>
      {messages.map(renderMessage)}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
