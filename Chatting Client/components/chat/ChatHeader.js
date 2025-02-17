// components/chat/ChatHeader.js
import React from "react";
import { useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Phone, Video, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSocket } from "@/context/SocketContext";
import { useCallHandler } from "@/hooks/useCallHandler";

const ChatHeader = ({ otherUser }) => {
  const { isUserOnline } = useSocket();
  const { startCall } = useCallHandler();
  const { selectedChat } = useSelector((state) => state.chat);
  const { user } = useSelector((state) => state.auth);
  //   const { messages, sendNewMessage, chatTypingUsers } = useChatMessages(
  //     chatId,
  //     initialMessages
  //   );

  const handleStartVideoCall = () => {
    if (selectedChat) {
      startCall(
        selectedChat._id,
        selectedChat.users.map((u) => u._id),
        "video"
      );
    }
  };

  const handleStartAudioCall = () => {
    if (selectedChat) {
      startCall(
        selectedChat._id,
        selectedChat.users.map((u) => u._id),
        "audio"
      );
    }
  };

  return (
    <div className='flex items-center justify-between p-4 border-b'>
      <div className='flex items-center gap-3'>
        <Avatar className='h-12 w-12 border rounded-full'>
          <AvatarImage src={otherUser?.image} alt={otherUser?.name} />
          <AvatarFallback>{otherUser?.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className='font-semibold'>{otherUser?.name}</h2>
          <p className='text-sm text-gray-500'>
            {isUserOnline(otherUser?._id) ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Button variant='ghost' size='icon' onClick={handleStartAudioCall}>
          <Phone className='h-5 w-5' />
        </Button>
        <Button variant='ghost' size='icon' onClick={handleStartVideoCall}>
          <Video className='h-5 w-5' />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='h-5 w-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Block User</DropdownMenuItem>
            <DropdownMenuItem className='text-red-500'>
              Clear Chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
