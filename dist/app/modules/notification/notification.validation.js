"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationValidation = void 0;
const zod_1 = require("zod");
const createNotification = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string({
            required_error: 'Message is required',
        }),
        receiver: zod_1.z.string({
            required_error: 'Receiver is required',
        }),
        type: zod_1.z.enum(['ADMIN', 'HOST', 'USER', 'PAYMENT'], {
            required_error: 'Valid notification type is required',
        }),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    }),
});
exports.NotificationValidation = {
    createNotification,
};
