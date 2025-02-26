"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chat = void 0;
// src\app\modules\chat\chat.model.ts
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    chatName: {
        type: String,
        trim: true,
        required: true,
    },
    isGroupChat: {
        type: Boolean,
        default: false,
    },
    users: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    latestMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
    },
    groupAdmin: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
    },
    // isPinned: {
    //   type: Boolean,
    //   default: false,
    // },
    pinnedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
        {
            type: Boolean,
            default: false,
        },
    ],
    deletedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
    blockedBy: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
exports.Chat = (0, mongoose_1.model)('Chat', chatSchema);
