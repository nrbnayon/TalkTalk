"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
// src/app/modules/messages/messages.model.ts
const mongoose_1 = require("mongoose");
const messages_interface_1 = require("./messages.interface");
const messageSchema = new mongoose_1.Schema({
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    chat: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true,
    },
    readBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    replyTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
    pinnedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(messages_interface_1.MessageType),
        default: messages_interface_1.MessageType.TEXT,
    },
    attachments: [
        {
            url: String,
            type: {
                type: String,
                enum: Object.values(messages_interface_1.MessageType),
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
                    type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
messageSchema.index({ content: 'text' });
exports.Message = (0, mongoose_1.model)('Message', messageSchema);
