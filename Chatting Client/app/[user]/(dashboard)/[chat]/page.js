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
  selectMessagesLoading,
} from '@/redux/features/messages/messageSlice';
import { LottieLoading } from '@/components/Animations/Loading';
import { MessagesSquare } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';

const ChatView = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const chatId = params?.chat;
  const { user } = useSelector(state => state.auth);
  const { chats, selectedChat } = useSelector(state => state.chat);
  const loading = useSelector(selectMessagesLoading);
  const initialized = useSelector(state => state.messages.initialized[chatId]);
  const { joinChat, leaveChat } = useSocket();
  const otherUser = useMemo(() => {
    return selectedChat?.users?.find(u => u._id !== user?._id);
  }, [selectedChat?.users, user?._id]);

  useEffect(() => {
    if (user && (selectedChat || chatId)) {
      joinChat(chatId, user);
      const existingChat = chats.find(chat => chat._id === chatId);
      if (existingChat) {
        dispatch(selectChat(existingChat));
      } else {
        dispatch(accessChat(chatId));
      }
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
      <MessageArea currentUser={user} chatId={chatId} />
      <MessageInput chatId={chatId} />
    </div>
  );
};

export default ChatView;
