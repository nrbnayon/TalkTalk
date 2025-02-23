'use client';
import React, { useEffect, useRef } from 'react';

const TypingIndicator = ({ typingUsers, messageContainerRef }) => {
  const indicatorRef = useRef(null);

  useEffect(() => {
    if (
      typingUsers.length > 0 &&
      messageContainerRef.current &&
      indicatorRef.current
    ) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [typingUsers, messageContainerRef]);

  if (!typingUsers.length) return null;

  return (
    <div
      ref={indicatorRef}
      className="flex flex-col gap-1 px-4 py-2 bg-gray-100 rounded-lg max-w-[80%] animate-fade-in fixed bottom-24 left-4"
    >
      {typingUsers.map((user, index) => (
        <div key={user.userId} className="flex items-center gap-2">
          <span className="font-medium text-gray-700">{user.name}</span>
          <span className="text-gray-600 text-sm">
            is typing:{' '}
            {user.content && <span className="italic">{user.content}</span>}
          </span>
          <span className="flex gap-1">
            <span
              className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </div>
      ))}
    </div>
  );
};

export default TypingIndicator;
