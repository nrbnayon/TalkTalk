// src/app/modules/messages/messages.model.ts
import { Schema, model } from 'mongoose';
import { IMessage, MessageType } from './messages.interface';

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
    },
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
    pinnedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    messageType: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
    },
    attachments: [
      {
        url: String,
        type: {
          type: String,
          enum: Object.values(MessageType),
        },
        filename: String,
        size: Number,
        mimeType: String,
        duration: Number,
        dimensions: {
          width: Number,
          height: Number,
        },
      },
    ],
    reactions: [
      {
        emoji: String,
        users: [
          {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        ],
      },
    ],
    deletedAt: Date,
    editHistory: [
      {
        content: String,
        editedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

messageSchema.index({ content: 'text' });

export const Message = model<IMessage>('Message', messageSchema);