// components/chat/Message.js
import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, CheckCheck, File } from "lucide-react";
import Image from "next/image";

const Message = ({ message, currentUser, isLastMessage, onReactionSelect }) => {
  const [showReactions, setShowReactions] = useState(false);
  const isOwnMessage = message.sender._id === currentUser._id;

  // Calculate message status
  const getMessageStatus = () => {
    if (message.readBy?.length > 0) {
      return "read";
    }
    return "sent";
  };

  const renderAttachments = () => {
    return message.attachments?.map((attachment, index) => {
      if (attachment.type === 'image') {
        return (
          <div key={index} className="message-attachment-image">
            <Image
              src={attachment.url}
              alt={attachment.filename}
              className="rounded-lg max-w-[200px]"
            />
          </div>
        );
      }

      return (
        <div key={index} className="message-attachment-file">
          <a
            href={attachment.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            <File size={20} />
            <span>{attachment.filename}</span>
          </a>
        </div>
      );
    });
  };

  const renderMessageStatus = () => {
    const status = getMessageStatus();
    if (status === "read") {
      return <CheckCheck size={16} className="text-blue-500" />;
    }
    return <Check size={16} className="text-gray-500" />;
  };

  return (
    <div
      className={`message ${isOwnMessage ? "own-message" : "other-message"}`}
    >
      <div className="message-content">
        {/* Message text */}
        {message.content && <p className="message-text">{message.content}</p>}

        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="message-attachments">{renderAttachments()}</div>
        )}

        {/* Message footer */}
        <div className="message-footer">
          <span className="message-time">
            {formatDistanceToNow(new Date(message.createdAt), {
              addSuffix: true,
            })}
          </span>

          {isOwnMessage && (
            <div className="message-status">{renderMessageStatus()}</div>
          )}
        </div>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <div key={index} className="reaction">
                <span>{reaction.emoji}</span>
                <span className="reaction-count">{reaction.users.length}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
