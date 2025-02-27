// Chatting Client\components\Sidebar\SearchResults.js
'use client';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useSocket } from '@/context/SocketContext';
import { useDispatch, useSelector } from 'react-redux';
import { accessChat } from '@/redux/features/chat/chatSlice';
import UserProfileDialog from '@/components/User/UserProfileDialog';

export default function SearchResults({
  results,
  isLoading,
  searchTerm,
  setResults,
  setSearchTerm,
}) {
  const { onlineUsers } = useSocket();
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector(state => state.auth);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isUserOnline = userId => {
    return onlineUsers.some(onlineUser => onlineUser._id === userId);
  };

  const handleUserClick = user => {
    setSelectedUser(user);
    setIsProfileOpen(true);
  };

  const handleStartChat = async userId => {
    try {
      await dispatch(accessChat(userId)).unwrap();
      // Clear search results and term after starting a chat
      setResults([]);
      setSearchTerm('');
      setIsProfileOpen(false);
    } catch (error) {
      console.error('Failed to start chat:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (results.length === 0 && searchTerm) {
    return (
      <div className="p-4 text-center text-gray-500">
        No users found matching &quot;{searchTerm}&quot;
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md shadow-lg max-h-80 overflow-y-auto">
      <div className="p-2">
        {results.length > 0 && (
          <p className="text-xs text-gray-500 mb-2 px-2">
            {results.length} user{results.length !== 1 ? 's' : ''} found
          </p>
        )}

        {results.map(user => {
          // Skip current user
          if (user._id === currentUser?._id) return null;

          const isOnline = isUserOnline(user._id);

          return (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
              onClick={() => handleUserClick(user)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span
                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile Dialog */}
      <UserProfileDialog
        user={selectedUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onStartChat={handleStartChat}
      />
    </div>
  );
}