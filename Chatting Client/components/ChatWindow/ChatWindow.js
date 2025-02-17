// components/ChatWindow.js
import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ChatWindow = ({ selectedUser }) => {
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Fetch message history for the selected user
    fetchMessageHistory(selectedUser.id);
  }, [selectedUser.id]);

  const fetchMessageHistory = (userId) => {
    // Fetch message history from the server
    const history = [
      {
        id: 1,
        content: "Hello",
        timestamp: "11:12 AM",
        isFromCurrentUser: false,
      },
      {
        id: 2,
        content: "Hi there!",
        timestamp: "11:13 AM",
        isFromCurrentUser: true,
      },
    ];
    setMessages(history);
  };

  const sendMessage = () => {
    if (messageInput.trim() !== "") {
      // Add the new message to the message history
      const newMessage = {
        id: messages.length + 1,
        content: messageInput,
        timestamp: new Date().toLocaleTimeString(),
        isFromCurrentUser: true,
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");

      // Send the message to the server
      sendMessageToServer(selectedUser.id, messageInput);
    }
  };

  const sendMessageToServer = (userId, content) => {
    // Code to send the message to the server
  };

  return (
    <div className='h-full flex flex-col'>
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-10 w-10 border border-gray-300'>
            <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
            <AvatarFallback>{selectedUser.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <span className='text-sm font-semibold'>{selectedUser.name}</span>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-end ${
              message.isFromCurrentUser ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-2 rounded-md max-w-[70%] ${
                message.isFromCurrentUser
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              <p className='text-sm'>{message.content}</p>
              <span className='text-xs text-gray-400'>{message.timestamp}</span>
            </div>
          </div>
        ))}
      </div>
      <div className='p-4 border-t border-gray-200'>
        <div className='flex items-center'>
          <Input
            type='text'
            placeholder='Type a message'
            className='flex-1 pr-4'
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
