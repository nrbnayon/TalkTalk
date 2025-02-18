// src\app\modules\messages\messages.service.ts
import { Types } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { Chat } from '../chat/chat.model';
import { Message } from './messages.model';
import {
  IMessage,
  IMessageAttachment,
  IMessageFilters,
  MessageType,
} from './messages.interface';

const processUploadedFile = async (
  file: Express.Multer.File
): Promise<{
  url: string;
  metadata: {
    mimeType: string;
    size: number;
  };
}> => {
  return {
    url: `/uploads/${file.filename}`,
    metadata: {
      mimeType: file.mimetype,
      size: file.size,
    },
  };
};

const getAllMessages = async (chatId: string): Promise<IMessage[]> => {
  const messages = await Message.find({ chat: chatId })
    .populate('sender', 'name email image')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name image',
      },
    })
    .populate('chat')
    .populate('readBy', 'name image')
    .sort({ createdAt: 1 });

  return messages.map(msg => msg.toObject());
};

const sendMessage = async (
  userId: string,
  content: string,
  chatId: string,
  files: Express.Multer.File[] = [],
  messageType: MessageType = MessageType.TEXT,
  replyToId?: string
): Promise<IMessage> => {
  if ((!content && !files?.length) || !chatId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Message content or files required'
    );
  }

  let attachments: IMessageAttachment[] = [];

  if (files?.length) {
    attachments = await Promise.all(
      files.map(async file => {
        const processedFile = await processUploadedFile(file);
        return {
          url: processedFile.url,
          type: messageType,
          filename: file.originalname,
          ...processedFile.metadata,
        };
      })
    );
  }

  const newMessage = await Message.create({
    sender: userId,
    content,
    chat: chatId,
    messageType,
    attachments,
    replyTo: replyToId ? new Types.ObjectId(replyToId) : undefined,
    readBy: [userId],
  });

  const message = await Message.findById(newMessage._id)
    .populate('sender', 'name image')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name image',
      },
    })
    .populate('chat')
    .populate('readBy', 'name image');

  if (!message) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create message'
    );
  }

  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

  return message.toObject();
};

const editMessage = async (
  messageId: string,
  userId: string,
  newContent: string
): Promise<IMessage> => {
  const message = await Message.findOne({
    _id: messageId,
    sender: userId,
    isDeleted: false,
  });

  if (!message) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Message not found or cannot be edited'
    );
  }

  const editHistoryEntry = {
    content: message.content,
    editedAt: new Date(),
  };

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    {
      content: newContent,
      isEdited: true,
      $push: { editHistory: editHistoryEntry },
    },
    { new: true }
  )
    .populate('sender', 'name image')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name image',
      },
    })
    .populate('chat')
    .populate('readBy', 'name image');

  if (!updatedMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found after update');
  }

  return updatedMessage.toObject();
};

const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<IMessage> => {
  const message = await Message.findOne({
    _id: messageId,
    sender: userId,
    isDeleted: false,
  });

  if (!message) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'Message not found or cannot be deleted'
    );
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    {
      isDeleted: true,
      deletedAt: new Date(),
      content: 'This message has been deleted',
    },
    { new: true }
  )
    .populate('sender', 'name image')
    .populate('chat')
    .populate('readBy', 'name image');

  if (!updatedMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found after update');
  }

  return updatedMessage.toObject();
};

const togglePinMessage = async (
  messageId: string,
  userId: string,
  chatId: string
): Promise<IMessage> => {
  const message = await Message.findOne({
    _id: messageId,
    chat: chatId,
  });

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  const updatedMessage = await Message.findByIdAndUpdate(
    messageId,
    [
      {
        // isPinned: !message.isPinned,
        $set: {
          isPinned: { $not: '$isPinned' },
          pinnedBy: userId,
          pinnedAt: new Date(),
        },
      },
    ],
    { new: true }
  )
    .populate('sender', 'name image')
    .populate('pinnedBy', 'name image')
    .populate('chat')
    .populate('readBy', 'name image');

  if (!updatedMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found after update');
  }

  return updatedMessage.toObject();
};

const toggleReaction = async (
  messageId: string,
  userId: string,
  emoji: string
): Promise<IMessage> => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  if (!message.reactions) {
    message.reactions = [];
  }

  const userReactionIndex = message.reactions.findIndex(reaction =>
    reaction.users.some(user => user.toString() === userId)
  );

  if (userReactionIndex !== -1) {
    const existingReaction = message.reactions[userReactionIndex];

    if (existingReaction.emoji === emoji) {
      existingReaction.users = existingReaction.users.filter(
        user => user.toString() !== userId
      );

      if (existingReaction.users.length === 0) {
        message.reactions.splice(userReactionIndex, 1);
      }
    } else {
      message.reactions[userReactionIndex].users =
        existingReaction.users.filter(user => user.toString() !== userId);

      if (message.reactions[userReactionIndex].users.length === 0) {
        message.reactions.splice(userReactionIndex, 1);
      }

      const newReactionIndex = message.reactions.findIndex(
        r => r.emoji === emoji
      );
      if (newReactionIndex !== -1) {
        message.reactions[newReactionIndex].users.push(
          new Types.ObjectId(userId)
        );
      } else {
        message.reactions.push({
          emoji,
          users: [new Types.ObjectId(userId)],
        });
      }
    }
  } else {
    const existingEmojiIndex = message.reactions.findIndex(
      r => r.emoji === emoji
    );
    if (existingEmojiIndex !== -1) {
      message.reactions[existingEmojiIndex].users.push(
        new Types.ObjectId(userId)
      );
    } else {
      message.reactions.push({
        emoji,
        users: [new Types.ObjectId(userId)],
      });
    }
  }

  await message.save();

  const updatedMessage = await Message.findById(messageId)
    .populate('sender', 'name image')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name image',
      },
    })
    .populate('chat')
    .populate('readBy', 'name image');

  if (!updatedMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found after update');
  }

  return updatedMessage.toObject();
};

const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<IMessage> => {
  const message = await Message.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { readBy: userId },
    },
    { new: true }
  )
    .populate('sender', 'name image')
    .populate('readBy', 'name image')
    .populate('chat');

  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  return message.toObject();
};

const searchMessages = async (
  filters: IMessageFilters
): Promise<IMessage[]> => {
  const { searchTerm, chatId, isPinned, startDate, endDate } = filters;
  const query: any = { isDeleted: false };

  if (searchTerm) {
    query.$text = { $search: searchTerm };
  }

  if (chatId) {
    query.chat = chatId;
  }

  if (isPinned !== undefined) {
    query.isPinned = isPinned;
  }

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const messages = await Message.find(query)
    .populate('sender', 'name email image')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name image',
      },
    })
    .populate('chat')
    .populate('readBy', 'name image')
    .sort({ createdAt: -1 });

  return messages.map(msg => msg.toObject());
};

const getUnseenMessageCount = async (
  chatId: string,
  userId: string
): Promise<number> => {
  return Message.countDocuments({
    chat: chatId,
    readBy: { $ne: userId },
    sender: { $ne: userId },
    isDeleted: false,
  });
};

export const MessageService = {
  getAllMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
  markMessageAsRead,
  searchMessages,
  getUnseenMessageCount,
};
