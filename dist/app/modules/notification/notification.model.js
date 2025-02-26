"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
// src\app\modules\notification\notification.model.ts
const mongoose_1 = require("mongoose");
const notificationSchema = new mongoose_1.Schema({
    message: {
        type: String,
        required: true,
        trim: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        // required: true,
        index: true,
    },
    read: {
        type: Boolean,
        default: false,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'ADMIN',
            'HOST',
            'USER',
            'PAYMENT',
            'REVIEW',
            'REFUND',
            'SERVICE_REQUEST',
            'SERVICE_ACCEPTED',
            'SERVICE_REJECTED',
            'SERVICE_COMPLETED',
            'SERVICE_CANCELED',
            'ORDER',
        ],
        required: true,
        index: true,
    },
    metadata: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
// Index for faster queries
notificationSchema.index({ receiver: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 });
// TTL index - automatically delete notifications after 30 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });
notificationSchema.pre('save', function (next) {
    if (!this.metadata) {
        this.metadata = {};
    }
    next();
});
exports.Notification = (0, mongoose_1.model)('Notification', notificationSchema);
