'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSocket } from '@/context/SocketContext';
import { useDispatch } from 'react-redux';
import { accessChat } from '@/redux/features/chat/chatSlice';
import { sendMessage } from '@/redux/features/messages/messageSlice';
import { MessageCircle, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { DialogDescription } from '@radix-ui/react-dialog';

export default function UserProfileDialog({
  user,
  isOpen,
  onClose,
  onStartChat,
}) {
  const { onlineUsers, socket } = useSocket();
  const dispatch = useDispatch();
  const [isSending, setIsSending] = useState(false);

  if (!user) return null;

  const isUserOnline = userId => {
    return onlineUsers.some(onlineUser => onlineUser._id === userId);
  };

  const isOnline = isUserOnline(user._id);

  const handleSayHi = async () => {
    try {
      setIsSending(true);

      // First create or access the chat
      const chatResult = await dispatch(accessChat(user._id)).unwrap();

      // Then send the initial message
      if (chatResult) {
        const formData = new FormData();
        formData.append('content', 'Hi there! 👋');
        formData.append('chatId', chatResult._id);

        await dispatch(sendMessage({ formData, socket })).unwrap();
      }

      // Close the dialog and notify parent
      onClose();
      if (onStartChat) onStartChat(user._id);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>
        <DialogDescription className="hidden">
          This is a description of the dialog.
        </DialogDescription>
        <div className="flex flex-col items-center py-4">
          <div className="relative mb-4">
            <Avatar className="h-24 w-24 border-4 border-gray-100">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="text-2xl">
                {user.name?.substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <span
              className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-white ${
                isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          <h2 className="text-xl font-bold text-center">{user.name}</h2>
          <p className="text-sm text-gray-500 mb-4">
            {isOnline ? 'Online now' : 'Offline'}
          </p>

          <div className="w-full space-y-3 mt-2">
            {user.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{user.email}</span>
              </div>
            )}

            {user.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>{user.phone}</span>
              </div>
            )}

            {user.createdAt && (
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>
                  Joined{' '}
                  {formatDistanceToNow(new Date(user.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
            )}

            {user.location && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>{user.location}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="sm:justify-center">
          <Button
            variant="default"
            className="gap-2"
            onClick={handleSayHi}
            disabled={isSending}
          >
            {isSending ? (
              <>
                <span className="animate-spin">⏳</span>
                Sending...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Say Hi
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
