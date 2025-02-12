  import { z } from 'zod';

  const accessChatZodSchema = z.object({
    body: z.object({
      userId: z.string({
        required_error: 'User ID is required',
      }),
    }),
  });

  const createGroupChatZodSchema = z.object({
    body: z.object({
      name: z.string({
        required_error: 'Group name is required',
      }),
      users: z.array(
        z.string({
          required_error: 'Users array is required',
        })
      ),
    }),
  });

  const renameGroupZodSchema = z.object({
    body: z.object({
      chatId: z.string({
        required_error: 'Chat ID is required',
      }),
      chatName: z.string({
        required_error: 'Chat name is required',
      }),
    }),
  });

  const groupActionZodSchema = z.object({
    body: z.object({
      chatId: z.string({
        required_error: 'Chat ID is required',
      }),
      userId: z.string({
        required_error: 'User ID is required',
      }),
    }),
  });

  export const ChatValidation = {
    accessChatZodSchema,
    createGroupChatZodSchema,
    renameGroupZodSchema,
    groupActionZodSchema,
  };
