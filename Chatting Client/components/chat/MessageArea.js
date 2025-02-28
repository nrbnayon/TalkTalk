// // // components/chat/MessageArea.js
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/context/SocketContext';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectMessagesLoading,
  updateMessage,
  deleteMessage,
  fetchMessages,
  selectMessagesMeta,
  selectMessagesByChatId,
} from '@/redux/features/messages/messageSlice';
import { useMessageActions } from '@/hooks/useMessageActions';
import { useMessageScroll } from '@/hooks/useMessageScroll';
import MessageList from './MessageList';
import PinnedMessage from './PinnedMessage';
import { Loader2 } from 'lucide-react';
import { EmptyStateMessage, LottieLoading } from '../Animations/Loading';
import { useChatMessages } from '@/hooks/useChatMessages';
import TypingIndicator from './TypingIndicator';

const MessagesArea = ({ currentUser, chatId }) => {
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({
    top: 0,
    left: 0,
  });

  const { markAsRead, handlePinToggle, getPinnedMessages, handleReaction } =
    useMessageActions(chatId);
  const { messageRefs, initializeMessageRefs, scrollToMessage } =
    useMessageScroll();
  const meta = useSelector(state => selectMessagesMeta(state, chatId));
  const messages = useSelector(state => selectMessagesByChatId(state, chatId));
  const messageContainerRef = useRef(null);
  const { typingUsers } = useChatMessages(chatId, messages);

  // Initialize messages
  useEffect(() => {
    if (chatId && chatId !== 'undefined') {
      setIsInitialLoad(true);
      setPage(1);
      setHasMoreOlder(true);
      dispatch(fetchMessages({ chatId, page: 1, limit: 40 })).finally(() => {
        setIsInitialLoad(false);
        setHasAttemptedLoad(true);
      });
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
      setIsLoadingMore(true);

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
            const newScrollTop =
              newScrollHeight - currentScrollHeight + scrollTop;
            messagesContainerRef.current.scrollTop = newScrollTop;
          }
        });
      } catch (error) {
        console.error('Error loading more messages:', error);
      } finally {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [chatId, dispatch, page, hasMoreOlder]);

  // Setup scroll listener with throttling
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledScroll);
    return () => container.removeEventListener('scroll', throttledScroll);
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
      console.log('Received updated message in message area::', updatedMessage);
      if (
        updatedMessage.chat._id === chatId ||
        updatedMessage.chat === chatId
      ) {
        dispatch(updateMessage(updatedMessage));

        // If the message is pinned/unpinned, make sure to update the UI immediately
        if (updatedMessage.isPinned !== undefined) {
          // Force re-render of pinned messages
          const updatedMessages = [...messages];
          const index = updatedMessages.findIndex(
            msg => msg._id === updatedMessage._id
          );
          if (index !== -1) {
            updatedMessages[index] = {
              ...updatedMessages[index],
              ...updatedMessage,
            };
          }
        }
      }
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
        socket.emit('delete-message', { messageId, chatId });
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
        <LottieLoading />
        <p className="text-gray-500">
          Please wait while we load your conversation
        </p>
      </div>
    );
  }

  if (hasAttemptedLoad && !loading && !messages?.length) {
    return <EmptyStateMessage />;
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
        {isLoadingMore && (
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

        {/* Add TypingIndicator at the bottom */}
        <TypingIndicator
          typingUsers={typingUsers}
          messageContainerRef={messageContainerRef}
        />
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessagesArea;
