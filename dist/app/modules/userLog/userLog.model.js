"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserLog = void 0;
const mongoose_1 = require("mongoose");
const userLogSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        ref: 'User',
    },
    email: {
        type: String,
        required: true,
    },
    device: {
        type: String,
        required: true,
    },
    browser: {
        type: String,
        required: true,
    },
    location: {
        ip: {
            type: String,
            required: true,
        },
        zip: String,
        region: String,
        city: String,
        country: String,
        regionName: String,
        latitude: Number,
        longitude: Number,
    },
    loginTime: {
        type: Date,
        default: Date.now,
    },
    logoutTime: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['active', 'logged_out'],
        default: 'active',
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
});
exports.UserLog = (0, mongoose_1.model)('UserLog', userLogSchema);
