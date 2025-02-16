// src\app\modules\chat\chat.interface.ts
import { Types } from 'mongoose';
import { IUser } from '../user/user.interface';
import { IMessage } from '../messages/messages.interface';

export interface IChat {
  _id: Types.ObjectId;
  chatName: string;
  isGroupChat: boolean;
  users: Types.ObjectId[] | IUser[];
  latestMessage?: Types.ObjectId | IMessage;
  groupAdmin?: Types.ObjectId | IUser;
  // isPinned?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedBy: Types.ObjectId[] | IUser[];
  blockedBy: Types.ObjectId[] | IUser[];
  pinnedBy: Types.ObjectId[] | IUser[];
}

export interface IChatFilters {
  searchTerm?: string;
  userId?: string;
}
