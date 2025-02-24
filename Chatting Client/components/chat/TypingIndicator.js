'use client';
import React, { useEffect, useRef, useState } from 'react';

const TypingIndicator = ({ typingUsers, messageContainerRef }) => {
  const indicatorRef = useRef(null);
  const [latestContent, setLatestContent] = useState('');

  useEffect(() => {
    if (typingUsers.length > 0) {
      const newContent = typingUsers[typingUsers.length - 1]?.content || '';
      setLatestContent(newContent);
    }
  }, [typingUsers]);

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
      className="px-4 py-2 bg-gray-100 rounded-lg animate-fade-in fixed bottom-20 z-100 max-w-[60%] right-4"
    >
      <div className="flex items-center gap-2">
        <span className="font-medium text-gray-700">{typingUsers[0].name}</span>
        <span className="text-gray-600">is typing: </span>
        <span className="text-gray-600 italic overflow-hidden text-ellipsis">
          {latestContent}
        </span>
        <span className="flex gap-1 items-center flex-shrink-0">
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
    </div>
  );
};

export default TypingIndicator;
