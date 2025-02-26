// src\app\modules\messages\messages.service.ts
import { Types } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { Chat } from '../chat/chat.model';
import { Message } from './messages.model';
import { IMessage, IMessageFilters, MessageType } from './messages.interface';
import { logger } from '../../../shared/logger';
import { IPaginationOptions } from '../../../types/pagination';
import { paginationHelper } from '../../../helpers/paginationHelper';
import { User } from '../user/user.model';

const getAllMessagesFromDB = async (
  chatId: string,
  userId: string,
  paginationOptions: IPaginationOptions
): Promise<{ meta: any; messages: IMessage[] }> => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(paginationOptions);

  try {
    // Validate chatId
    if (!Types.ObjectId.isValid(chatId)) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid chatId');
    }

    // Fetch messages with pagination
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
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate total number of messages in the chat
    const total = await Message.countDocuments({ chat: chatId });

    // Calculate unread count (assuming `user.id` is available)
    const unreadCount = await Message.countDocuments({
      chat: chatId,
      readBy: { $ne: new Types.ObjectId(userId) },
    });

    return {
      meta: {
        page,
        limit,
        total,
        unreadCount,
      },
      messages: messages,
    };
  } catch (error) {
    logger.error('Error fetching messages:', error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch messages'
    );
  }
};

const sendMessage = async ({
  content,
  chatId,
  userId,
  replyToId,
  files,
}: {
  content?: string;
  chatId: string;
  userId: string;
  replyToId?: string;
  files?: Record<string, Express.Multer.File[]>;
}): Promise<IMessage> => {
  logger.info(`[MessageService] Creating new message for chat: ${chatId}`);
  logger.debug(`[MessageService] Message data:`, {
    content: content?.substring(0, 50),
    chatId,
    userId,
    replyToId,
    filesCount: files ? Object.keys(files).length : 0,
  });

  // Validation
  if ((!content?.trim() && (!files || !Object.keys(files).length)) || !chatId) {
    logger.error('[MessageService] Invalid message data');
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Message content or files required'
    );
  }

  const messageData: any = {
    sender: userId,
    content: content?.trim() || '',
    chat: chatId,
    readBy: [userId],
  };

  if (replyToId) {
    messageData.replyTo = replyToId;
  }

  // Process attachments
  if (files && Object.keys(files).length > 0) {
    logger.info(
      `[MessageService] Processing ${Object.keys(files).length} files`
    );
    messageData.attachments = [];

    for (const [fieldName, fileArray] of Object.entries(files)) {
      fileArray.forEach((file: Express.Multer.File) => {
        console.log(`[MessageService] Processing file: ${file.originalname}`, {
          file: file,
        });
        const attachment = {
          url: `/${fieldName}/${file.filename}`,
          type: getMessageType(fieldName, file.mimetype),
          filename: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        };
        messageData.attachments.push(attachment);
      });
    }

    messageData.messageType =
      messageData.attachments.length > 1
        ? MessageType.MIXED
        : messageData.attachments[0].type;
  } else {
    messageData.messageType = MessageType.TEXT;
  }

  logger.debug(`[MessageService] Final message data:`, messageData);

  const newMessage = await Message.create(messageData);
  logger.info(`[MessageService] Message created with ID: ${newMessage._id}`);

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
    logger.error('[MessageService] Failed to retrieve created message');
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create message'
    );
  }

  // Update chat's latest message
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
  logger.info(`[MessageService] Updated latest message for chat: ${chatId}`);

  return message;
};

const getMessageType = (fieldName: string, mimeType: string): MessageType => {
  logger.debug(
    `[MessageService] Determining message type for: ${fieldName}, ${mimeType}`
  );
  if (fieldName === 'images') return MessageType.IMAGE;
  if (mimeType.startsWith('video/')) return MessageType.VIDEO;
  if (mimeType.startsWith('audio/')) return MessageType.AUDIO;
  return MessageType.DOCUMENT;
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
  chatId: string,
): Promise<IMessage> => {
  const message = await Message.findOne({ _id: messageId, chat: chatId });
  if (!message) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
  }

  const newPinStatus = !message.isPinned;
  message.isPinned = newPinStatus;
  if (newPinStatus) {
    const user = await User.findById(userId).select('name image');
    message.pinnedBy = user;
  } else {
    message.pinnedBy = null;
  }
  message.pinnedAt = newPinStatus ? new Date() : null;

  await message.save();

  const pinnedMessage = await Message.findById(messageId)
    .populate('sender', 'name image')
    .populate('pinnedBy', 'name image')
    .populate('readBy', 'name image')
    .populate('chat')
    .lean();

  if (!pinnedMessage) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Message not found after update');
  }

  console.log('Get pinned message in backend::', pinnedMessage);

  return pinnedMessage;
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

  // Ensure reactions array exists
  if (!message.reactions) {
    message.reactions = [];
  }

  // Find if the user has already reacted with any emoji
  const existingReactionIndex = message.reactions.findIndex(reaction =>
    reaction.users.some(user => user.toString() === userId)
  );

  if (existingReactionIndex !== -1) {
    const existingReaction = message.reactions[existingReactionIndex];
    if (existingReaction.emoji === emoji) {
      // User clicked the same emoji: remove their reaction (toggle off)
      existingReaction.users = existingReaction.users.filter(
        user => user.toString() !== userId
      );
      if (existingReaction.users.length === 0) {
        // Remove the reaction entry if no user left
        message.reactions.splice(existingReactionIndex, 1);
      }
    } else {
      // User had a different reaction: remove it first
      message.reactions[existingReactionIndex].users =
        existingReaction.users.filter(user => user.toString() !== userId);
      if (message.reactions[existingReactionIndex].users.length === 0) {
        message.reactions.splice(existingReactionIndex, 1);
      }
      // Then add the new reaction
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
    // No existing reaction by the user: add reaction normally
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
      populate: { path: 'sender', select: 'name image' },
    })
    .populate('chat')
    .populate('readBy', 'name image')
    .populate({ path: 'reactions.users', select: 'name image' });

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
  getAllMessagesFromDB,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  toggleReaction,
  markMessageAsRead,
  searchMessages,
  getUnseenMessageCount,
};
