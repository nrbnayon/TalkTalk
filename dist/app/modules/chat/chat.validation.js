"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatValidation = void 0;
const zod_1 = require("zod");
const accessChatZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }),
    }),
});
const createGroupChatZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: 'Group name is required',
        }),
        users: zod_1.z.array(zod_1.z.string({
            required_error: 'Users array is required',
        })),
    }),
});
const renameGroupZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
        chatName: zod_1.z.string({
            required_error: 'Chat name is required',
        }),
    }),
});
const groupActionZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
        userId: zod_1.z.string({
            required_error: 'User ID is required',
        }),
    }),
});
const chatActionZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
    }),
});
exports.ChatValidation = {
    accessChatZodSchema,
    createGroupChatZodSchema,
    renameGroupZodSchema,
    groupActionZodSchema,
    chatActionZodSchema,
};
