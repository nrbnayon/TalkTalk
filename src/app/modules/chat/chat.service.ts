// src\app\modules\chat\chat.service.ts
import httpStatus from 'http-status';
import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { IChat } from './chat.interface';
import { Chat } from './chat.model';

const accessChat = async (
  userId: string,
  currentUserId: string
): Promise<IChat> => {
  if (!userId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'UserId param not sent with request'
    );
  }

  const users = await User.find({
    _id: { $in: [userId, currentUserId] },
    status: 'active',
  });

  if (users.length !== 2) {
    throw new ApiError(httpStatus.NOT_FOUND, 'One or both users not found');
  }

  const existingChat = await Chat.findOne({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: currentUserId } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'sender',
        select: 'name email image onlineStatus',
      },
    });

  if (existingChat) {
    return existingChat.toObject();
  }

  const chatData = {
    chatName: 'sender',
    isGroupChat: false,
    users: [currentUserId, userId],
  };

  const createdChat = await Chat.create(chatData);
  const fullChat = await Chat.findById(createdChat._id).populate({
    path: 'users',
    select: 'name email image onlineStatus lastActiveAt status verified',
    match: { status: 'active' },
  });

  if (!fullChat) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create chat'
    );
  }

  return fullChat.toObject();
};

const getAllChats = async (userId: string): Promise<IChat[]> => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: userId } },
  })
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'groupAdmin',
      select: 'name email image onlineStatus',
      match: { status: 'active' },
    })
    .populate({
      path: 'latestMessage',
      populate: {
        path: 'sender',
        select: 'name email image onlineStatus',
      },
    })
    .sort({ updatedAt: -1 });

  return chats.map(chat => chat.toObject());
};

const createGroupChat = async (
  name: string,
  users: string[],
  currentUserId: string
): Promise<IChat> => {
  if (!users || !name) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Please fill all fields');
  }

  if (users.length < 2) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'More than 2 users are required to create a group chat'
    );
  }

  const validUsers = await User.find({
    _id: { $in: [...users, currentUserId] },
    status: 'active',
  });

  if (validUsers.length !== users.length + 1) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      'One or more users not found or inactive'
    );
  }

  const groupChat = await Chat.create({
    chatName: name,
    users: [...users, currentUserId],
    isGroupChat: true,
    groupAdmin: currentUserId,
  });

  const fullGroupChat = await Chat.findById(groupChat._id)
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'groupAdmin',
      select: 'name email image onlineStatus',
      match: { status: 'active' },
    });

  if (!fullGroupChat) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create group chat'
    );
  }

  return fullGroupChat.toObject();
};

const renameGroup = async (
  chatId: string,
  chatName: string,
  currentUserId: string
): Promise<IChat> => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  if (chat.groupAdmin?.toString() !== currentUserId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only group admin can rename the group'
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { chatName },
    { new: true }
  )
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'groupAdmin',
      select: 'name email image onlineStatus',
      match: { status: 'active' },
    });

  if (!updatedChat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  return updatedChat.toObject();
};

const removeFromGroup = async (
  chatId: string,
  userId: string,
  currentUserId: string
): Promise<IChat> => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  if (chat.groupAdmin?.toString() !== currentUserId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only group admin can remove members'
    );
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $pull: { users: userId } },
    { new: true }
  )
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'groupAdmin',
      select: 'name email image onlineStatus',
      match: { status: 'active' },
    });

  if (!updatedChat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  return updatedChat.toObject();
};

const addToGroup = async (
  chatId: string,
  userId: string,
  currentUserId: string
): Promise<IChat> => {
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  if (chat.groupAdmin?.toString() !== currentUserId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      'Only group admin can add members'
    );
  }

  const user = await User.findOne({ _id: userId, status: 'active' });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found or inactive');
  }

  const updatedChat = await Chat.findByIdAndUpdate(
    chatId,
    { $addToSet: { users: userId } },
    { new: true }
  )
    .populate({
      path: 'users',
      select: 'name email image onlineStatus lastActiveAt status verified',
      match: { status: 'active' },
    })
    .populate({
      path: 'groupAdmin',
      select: 'name email image onlineStatus',
      match: { status: 'active' },
    });

  if (!updatedChat) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat not found');
  }

  return updatedChat.toObject();
};

export const ChatService = {
  accessChat,
  getAllChats,
  createGroupChat,
  renameGroup,
  removeFromGroup,
  addToGroup,
};