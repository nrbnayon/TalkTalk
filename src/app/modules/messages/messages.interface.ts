// src/app/modules/messages/messages.interface.ts

import { Types } from 'mongoose';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  AUDIO = 'audio',
  VIDEO = 'video',
  STICKER = 'sticker',
  GIF = 'gif',
}

export interface IMessageAttachment {
  url: string;
  type: MessageType;
  filename: string;
  size?: number;
  mimeType?: string;
  duration?: number; // For audio/video
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface IMessage {
  _id: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  chat: Types.ObjectId;
  readBy: Types.ObjectId[];
  replyTo?: Types.ObjectId;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  messageType: MessageType;
  attachments?: IMessageAttachment[];
  reactions?: {
    emoji: string;
    users: Types.ObjectId[];
  }[];
  deletedAt?: Date;
  editHistory?: {
    content: string;
    editedAt: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IMessageFilters {
  searchTerm?: string;
  chatId?: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  sender?: string;
  messageType?: MessageType;
  startDate?: Date;
  endDate?: Date;
}

export interface ICallSession {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  chat: Types.ObjectId;
  initiator: Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  callType: 'audio' | 'video';
  status: 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
}
