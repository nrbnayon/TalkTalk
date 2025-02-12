import { z } from 'zod';

const createNotification = z.object({
  body: z.object({
    message: z.string({
      required_error: 'Message is required',
    }),
    receiver: z.string({
      required_error: 'Receiver is required',
    }),
    type: z.enum(['ADMIN', 'HOST', 'USER', 'PAYMENT'], {
      required_error: 'Valid notification type is required',
    }),
    metadata: z.record(z.any()).optional(),
  }),
});

export const NotificationValidation = {
  createNotification,
};
