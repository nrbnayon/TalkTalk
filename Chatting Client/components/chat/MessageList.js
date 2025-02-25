// // components\chat\MessageList.js
// components\chat\MessageList.js
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Check,
  CheckCheck,
  Pin,
  Edit2,
  Reply,
  MoreVertical,
  Trash2,
  SmilePlusIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import MessageAttachment from './MessageAttachment';

const MessageList = ({
  messages,
  currentUser,
  messageRefs,
  onDeleteMessage,
  onEditMessage,
  onPinMessage,
  onUnpinMessage,
  onReaction,
  onOpenEmojiPicker,
  onScrollToMessage,
  showEmojiPicker,
  selectedMessage,
  emojiPickerPosition,
  onCloseEmojiPicker,
  messagesEndRef,
}) => {
  const formatMessageTime = dateStr => {
    try {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';

      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return `Yesterday at ${format(date, 'h:mm a')}`;
      } else {
        return format(date, 'MMM d, h:mm a');
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return '';
    }
  };

  const formatRelativeTime = dateStr => {
    try {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Relative time formatting error:', error);
      return '';
    }
  };

  const getReactionCount = (reactions, emoji) => {
    if (!reactions) return 0;
    const reaction = reactions.find(r => r.emoji === emoji);
    return reaction ? reaction.users.length : 0;
  };

  const hasUserReacted = (reactions, emoji) => {
    if (!reactions || !currentUser || !currentUser._id) return false;
    return reactions.some(
      reaction =>
        reaction.emoji === emoji &&
        reaction.users.some(
          user => user._id?.toString() === currentUser._id.toString()
        )
    );
  };

  const renderReactionButton = (message, emoji) => {
    const reaction = message.reactions?.find(r => r.emoji === emoji);
    const count = reaction ? reaction.users.length : 0;
    const hasReacted = hasUserReacted(message.reactions, emoji);
    const tooltip = reaction ? reaction.users.map(u => u.name).join(', ') : '';

    return (
      <button
        key={emoji}
        title={tooltip}
        className={cn(
          'inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-sm transition-all',
          'hover:bg-gray-50 hover:border-gray-300',
          'shadow-sm hover:shadow',
          hasReacted
            ? 'bg-blue-50 border border-blue-200'
            : 'bg-white border border-gray-200'
        )}
        onClick={() => onReaction(message._id, emoji)}
      >
        <span>{emoji}</span>
        {count > 0 && (
          <span
            className={cn(
              'text-xs font-medium',
              hasReacted ? 'text-blue-600' : 'text-gray-600'
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  };

  const renderMessage = (message, isPinnedView = false) => {
    if (message.isDeleted || !message?.sender || !currentUser) return null;

    const isOwnMessage =
      message.sender._id.toString() === currentUser._id.toString();
    const messageTime = formatMessageTime(message.createdAt);
    const editTime =
      message.editHistory?.length > 0
        ? formatRelativeTime(
            message.editHistory[message.editHistory.length - 1].timestamp
          )
        : null;
    const deleteTime = message.deletedAt
      ? formatRelativeTime(message.deletedAt)
      : null;

    const otherUsers =
      message.chat?.users?.filter(
        userId =>
          userId.toString() !== currentUser._id.toString() &&
          userId.toString() !== message.sender._id.toString()
      ) || [];

    const isRead = otherUsers.every(userId =>
      message.readBy?.some(
        reader => reader._id.toString() === userId.toString()
      )
    );

    const senderName = message.sender.name || 'Unknown User';
    const senderImage = message.sender.image || null;

    return (
      <div
        key={`${message._id}${isPinnedView ? '-pinned' : ''}`}
        ref={el => {
          if (!isPinnedView) {
            messageRefs.current[message._id] = { current: el };
          }
        }}
        className={cn(
          'flex items-start gap-1 group',
          isOwnMessage ? 'flex-row-reverse' : 'flex-row',
          isPinnedView ? 'bg-gray-50/80 p-3 rounded-lg mb-2' : 'mb-4'
        )}
      >
        {!isPinnedView && (
          <div
            className={cn(
              'opacity-0 group-hover:opacity-100 transition-all duration-200'
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-full hover:bg-gray-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isOwnMessage ? 'start' : 'end'}
                className="w-48 bg-white/95 backdrop-blur-sm"
              >
                <DropdownMenuItem
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('replyTo', { detail: message })
                    )
                  }
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    message.isPinned
                      ? onUnpinMessage(message._id)
                      : onPinMessage(message._id)
                  }
                >
                  <Pin className="h-4 w-4 mr-2" />
                  {message.isPinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => onEditMessage(message)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDeleteMessage(message._id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <Avatar className="h-10 w-10 border-2 border-gray-100 shadow-sm flex-shrink-0">
          <AvatarImage src={senderImage} alt={senderName} />
          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700">
            {senderName?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div
          className={cn(
            'flex flex-col',
            isOwnMessage ? 'items-end' : 'items-start',
            'max-w-[65%]'
          )}
        >
          {!isOwnMessage && (
            <div className="flex items-center text-xs text-gray-600 mb-1 gap-2 font-medium">
              <span>{senderName}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">{messageTime}</span>
            </div>
          )}

          <div className="relative group">
            {message.replyTo && (
              <div
                className="text-xs text-gray-600 mb-1.5 bg-gray-50 p-2.5 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100"
                onClick={() => onScrollToMessage(message.replyTo._id)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Reply className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {message.replyTo.sender.name}
                  </span>
                </div>
                {message.replyTo.content.substring(0, 50)}
                {message.replyTo.content.length > 50 ? '...' : ''}
              </div>
            )}
            <div
              className={cn(
                'px-4 py-1 shadow-sm',
                message.isDeleted
                  ? 'bg-gray-400 text-gray-700 italic'
                  : isOwnMessage
                  ? message.attachments && message.attachments.length > 0
                    ? 'bg-green-500 text-white rounded-2xl rounded-tr-sm mt-1 mr-1'
                    : 'bg-blue-500 text-white rounded-2xl rounded-tr-sm mt-1 mr-1'
                  : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm ml-1'
              )}
            >
              {message.content && message.content.length > 0 && (
                <p className="whitespace-pre-wrap break-words leading-relaxed mb-2">
                  {message.content}
                </p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div
                  className={cn(
                    'grid gap-2',
                    message.attachments.length > 1
                      ? 'grid-cols-2'
                      : 'grid-cols-1'
                  )}
                >
                  {message.attachments.map((attachment, index) => (
                    <MessageAttachment key={index} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>

            {message.reactions?.length > 0 && (
              <div
                className={cn(
                  'flex flex-wrap gap-1.5 mt-2',
                  isOwnMessage ? 'justify-end' : 'justify-start'
                )}
              >
                {['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡'].map(
                  emoji =>
                    message.reactions.some(r => r.emoji === emoji) &&
                    renderReactionButton(message, emoji)
                )}
              </div>
            )}

            {!isPinnedView && (
              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2',
                  isOwnMessage ? '-left-6' : '-right-7',
                  'opacity-0 group-hover:opacity-100 transition-all duration-200'
                )}
              >
                <div
                  className="flex flex-col gap-2"
                  onClick={e => onOpenEmojiPicker(message, e)}
                >
                  <SmilePlusIcon className="h-4 w-4 mr-2" />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center mt-1">
            {isOwnMessage && (
              <div className="flex items-center text-xs gap-2">
                <span className="text-gray-400">{messageTime}</span>
                <span className={isRead ? 'text-blue-500' : 'text-gray-400'}>
                  {isRead ? (
                    <CheckCheck className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </span>
              </div>
            )}
            {message.isEdited && (
              <span className="text-xs text-gray-400 ml-2">
                (edited) {editTime}
              </span>
            )}
            {message.isDeleted && (
              <span className="text-xs text-gray-400 ml-2">
                deleted {deleteTime}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.createdAt);
    const dateStr = isToday(date)
      ? 'Today'
      : isYesterday(date)
      ? 'Yesterday'
      : format(date, 'MMMM d, yyyy');

    if (!groups[dateStr]) {
      groups[dateStr] = [];
    }
    groups[dateStr].push(message);
    return groups;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto px-4 py-2">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center justify-center my-4">
            <div className="bg-gray-100/80 text-gray-600 text-xs px-4 py-1.5 rounded-full font-medium shadow-sm">
              {date}
            </div>
          </div>
          {dateMessages.map(message => renderMessage(message))}
        </div>
      ))}
      <div ref={messagesEndRef} />

      {showEmojiPicker && selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/20"
          onClick={onCloseEmojiPicker}
        >
          <div
            className="absolute bg-white rounded-xl p-4 shadow-lg border border-gray-100"
            style={{
              top: emojiPickerPosition.top,
              left: emojiPickerPosition.left,
              transform: emojiPickerPosition.isOwnMessage
                ? 'translate(-100%, -50%)'
                : 'translate(0, -50%)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="grid grid-cols-8 gap-2">
              {['😊', '😂', '❤️', '👍', '👎', '😮', '😢', '😡'].map(emoji => (
                <button
                  key={emoji}
                  className="text-2xl hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  onClick={() => {
                    onReaction(selectedMessage._id, emoji);
                    onCloseEmojiPicker();
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;
