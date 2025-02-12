// src\app\modules\messages\messages.validation.ts
import { z } from 'zod';

const messageIdParamSchema = z.object({
  params: z.object({
    messageId: z.string({
      required_error: 'Message ID is required',
    }),
  }),
});

const getChatMessagesZodSchema = z.object({
  params: z.object({
    chatId: z.string({
      required_error: 'Chat ID is required',
    }),
  }),
});

const sendMessageZodSchema = z.object({
  body: z.object({
    content: z.string({
      required_error: 'Message content is required',
    }),
    chatId: z.string({
      required_error: 'Chat ID is required',
    }),
    replyToId: z.string().optional(),
  }),
});

const editMessageZodSchema = z.object({
  params: z.object({
    messageId: z.string({
      required_error: 'Message ID is required',
    }),
  }),
  body: z.object({
    content: z.string({
      required_error: 'Message content is required',
    }),
  }),
});

const searchMessagesZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    chatId: z.string().optional(),
    isPinned: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

export const MessageValidation = {
  messageIdParamSchema,
  getChatMessagesZodSchema,
  sendMessageZodSchema,
  editMessageZodSchema,
  searchMessagesZodSchema,
};