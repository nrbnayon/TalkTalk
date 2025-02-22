// app/[user]/chat/[chatId]/page.js
'use client';

import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageArea from '@/components/chat/MessageArea';
import MessageInput from '@/components/chat/MessageInput';
import { accessChat, selectChat } from '@/redux/features/chat/chatSlice';
import {
  fetchMessages,
  selectMessagesByChatId,
  selectMessagesLoading,
  addMessage,
} from '@/redux/features/messages/messageSlice';
import { useChatMessages } from '@/hooks/useChatMessages';
import { LottieLoading } from '@/components/Animations/Loading';
import { MessagesSquare } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

const ChatView = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const chatId = params?.chat;
  const { user } = useSelector(state => state.auth);
  const { chats, selectedChat } = useSelector(state => state.chat);
  const messages = useSelector(state => selectMessagesByChatId(state, chatId));
  const loading = useSelector(selectMessagesLoading);
  const initialized = useSelector(state => state.messages.initialized[chatId]);
  const { socket, joinChat, leaveChat } = useSocket();

  // Use the useChatMessages hook instead of manually handling socket events
  const { sendMessage, typingUsers } = useChatMessages(chatId, messages);

  const otherUser = useMemo(() => {
    return selectedChat?.users?.find(u => u._id !== user?._id);
  }, [selectedChat?.users, user?._id]);

  useEffect(() => {
    if (!socket || !chatId) return;

    const handleNewMessage = message => {
      console.log('[ChatView] New message received:', message);
      if (message.chat._id === chatId) {
        // Dispatch the new message to Redux store
        dispatch(addMessage({ chatId, message }));
      }
    };

    // Add socket event listener
    socket.on('message-received', handleNewMessage);

    return () => {
      socket.off('message-received', handleNewMessage);
    };
  }, [socket, chatId, dispatch]);

  useEffect(() => {
    if (user && (selectedChat || chatId)) {
      console.log('Get chat id, user, and selectedChat', {
        chatId,
        user,
        selectedChat,
      });
      joinChat(chatId, user);
      const existingChat = chats.find(chat => chat._id === chatId);
      if (existingChat) {
        dispatch(selectChat(existingChat));
      } else {
        dispatch(accessChat(chatId));
      }
      // Only fetch messages if the chat hasn't been initialized
      if (!initialized) {
        dispatch(fetchMessages({ chatId, page: 1, limit: 20 }));
      }
      return () => {
        leaveChat(chatId);
      };
    }
  }, [
    chatId,
    dispatch,
    chats,
    initialized,
    selectedChat,
    user,
    joinChat,
    leaveChat,
  ]);

  if (loading && !initialized) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50">
        <LottieLoading />
        <div className="flex justify-center items-center gap-2">
          <MessagesSquare className="w-16 h-16 text-gray-300" />
          <p className="text-gray-700">
            Please wait while we load your conversation
          </p>
        </div>
      </div>
    );
  }

  if (!selectedChat) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-gray-50">
        <LottieLoading />
        <div className="flex justify-center items-center gap-2">
          <MessagesSquare className="w-16 h-16 text-gray-300" />
          <p className="text-gray-700">
            Please wait while we load your conversation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-white shadow-lg rounded-lg overflow-hidden">
      <ChatHeader otherUser={otherUser} />
      <MessageArea
        messages={messages}
        currentUser={user}
        chatId={chatId}
        typingUsers={typingUsers}
      />
      <MessageInput chatId={chatId} sendMessage={sendMessage} />
    </div>
  );
};

export default ChatView;
