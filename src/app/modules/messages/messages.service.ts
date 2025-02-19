// src\app\modules\messages\messages.service.ts
import { Types } from 'mongoose';
import httpStatus from 'http-status';
import ApiError from '../../../errors/ApiError';
import { Chat } from '../chat/chat.model';
import { Message } from './messages.model';
import { IMessage, IMessageFilters, MessageType } from './messages.interface';
import { logger } from '../../../shared/logger';

const getAllMessages = async (chatId: string): Promise<IMessage[]> => {
  try {
    // Validate chatId (optional but recommended)
    if (!Types.ObjectId.isValid(chatId)) {
      throw new Error('Invalid chatId');
    }

    // Fetch messages
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
      .sort({ createdAt: 1 })
      .lean();

    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to fetch messages');
  }
};

// const getAllMessages = async (chatId: string): Promise<IMessage[]> => {
//   const messages = await Message.find({
//     chat: chatId,
//     isDeleted: false,
//   })
//     .populate('sender', 'name email image')
//     .populate('replyTo')
//     .populate('chat')
//     .sort({ createdAt: 1 });

//   return messages.map(msg => msg.toObject());
// };

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
        logger.debug(`[MessageService] Processing file: ${file.originalname}`);
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
