"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageValidation = void 0;
// src\app\modules\messages\messages.validation.ts
const zod_1 = require("zod");
const messageIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        messageId: zod_1.z.string({
            required_error: 'Message ID is required',
        }),
    }),
});
const messageIdPinSchema = zod_1.z.object({
    params: zod_1.z.object({
        messageId: zod_1.z.string({
            required_error: 'Message ID is required',
        }),
    }),
    body: zod_1.z.object({
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
        isPinned: zod_1.z.boolean().optional(),
    }),
});
const getChatMessagesZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
    }),
});
const sendMessageZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        content: zod_1.z.string({
            required_error: 'Message content is required',
        }),
        chatId: zod_1.z.string({
            required_error: 'Chat ID is required',
        }),
        replyToId: zod_1.z.string().optional(),
    }),
});
const editMessageZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        messageId: zod_1.z.string({
            required_error: 'Message ID is required',
        }),
    }),
    body: zod_1.z.object({
        content: zod_1.z.string({
            required_error: 'Message content is required',
        }),
    }),
});
const searchMessagesZodSchema = zod_1.z.object({
    query: zod_1.z.object({
        searchTerm: zod_1.z.string().optional(),
        chatId: zod_1.z.string().optional(),
        isPinned: zod_1.z.boolean().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
    }),
});
const reactionZodSchema = zod_1.z.object({
    params: zod_1.z.object({
        messageId: zod_1.z.string({
            required_error: 'Message ID is required',
        }),
    }),
    body: zod_1.z.object({
        emoji: zod_1.z.string({
            required_error: 'Emoji is required',
        }),
    }),
});
exports.MessageValidation = {
    messageIdParamSchema,
    getChatMessagesZodSchema,
    sendMessageZodSchema,
    editMessageZodSchema,
    searchMessagesZodSchema,
    reactionZodSchema,
    messageIdPinSchema,
};
