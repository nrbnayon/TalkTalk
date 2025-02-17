// hooks/useMessageScroll.js
import { useRef, useCallback } from 'react';

export const useMessageScroll = () => {
  const messageRefs = useRef({});

  const initializeMessageRefs = useCallback(messages => {
    messages.forEach(message => {
      if (!messageRefs.current[message._id]) {
        messageRefs.current[message._id] = { current: null };
      }
    });
  }, []);

  const scrollToMessage = useCallback(messageId => {
    const messageRef = messageRefs.current[messageId];
    if (messageRef?.current) {
      messageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Add highlight effect
      messageRef.current.classList.add('highlight-message');
      setTimeout(() => {
        messageRef.current?.classList.remove('highlight-message');
      }, 2000);
    }
  }, []);

  return {
    messageRefs,
    initializeMessageRefs,
    scrollToMessage,
  };
};
