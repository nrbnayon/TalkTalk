// app/[user]/chat/[chatId]/page.js
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'next/navigation';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageArea from '@/components/chat/MessageArea';
import MessageInput from '@/components/chat/MessageInput';
import { accessChat, selectChat } from '@/redux/features/chat/chatSlice';
import { useSocket } from '@/context/SocketContext';
import {
  fetchMessages,
  selectMessagesByChatId,
  selectMessagesLoading,
  addMessage,
} from '@/redux/features/messages/messageSlice';
import { LottieLoading } from '@/components/Animations/Loading';
import { MessagesSquare } from 'lucide-react';

const ChatView = () => {
  const dispatch = useDispatch();
  const params = useParams();
  const chatId = params?.chat;
  const { socket, joinChat, leaveChat } = useSocket();
  const { user } = useSelector(state => state.auth);
  const { chats, selectedChat } = useSelector(state => state.chat);

  // Memoize the messages selector to prevent unnecessary rerenders
  const messages = useSelector(state => selectMessagesByChatId(state, chatId));
  const loading = useSelector(selectMessagesLoading);

  const otherUser = useMemo(() => {
    return selectedChat?.users.find(u => u._id !== user?._id);
  }, [selectedChat?.users, user?._id]);

  useEffect(() => {
    if (chatId) {
      const existingChat = chats.find(chat => chat._id === chatId);

      if (existingChat) {
        dispatch(selectChat(existingChat));
      } else {
        dispatch(accessChat(chatId));
      }
      dispatch(fetchMessages(chatId));
    }
  }, [chatId, dispatch, chats]);

  useEffect(() => {
    if (socket && chatId) {
      // Join chat room
      joinChat(chatId);

      socket.on('message-received', newMessage => {
        if (newMessage.chat === chatId) {
          dispatch(addMessage(newMessage));
        }
      });

      return () => {
        leaveChat(chatId);
        socket.off('message-received');
      };
    }
  }, [socket, chatId, joinChat, leaveChat, dispatch]);

  if (loading) {
    <div className="text-center">
      <LottieLoading />
      <p className="text-gray-500">
        Please wait while we load your conversation
      </p>
    </div>;
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
      <MessageArea messages={messages} currentUser={user} chatId={chatId} />
      <MessageInput chatId={chatId} />
    </div>
  );
};

export default ChatView;
