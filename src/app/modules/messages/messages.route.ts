// src\app\modules\messages\messages.route.ts
import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { MessageController } from './messages.controller';
import { MessageValidation } from './messages.validation';
import multer from 'multer';
const upload = multer();
const router = express.Router();

router.post(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  upload.array('files'),
  // validateRequest(MessageValidation.sendMessageZodSchema),
  MessageController.sendMessage
);

router.get(
  '/:chatId',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.getChatMessagesZodSchema),
  MessageController.getAllMessages
);

router.patch(
  '/:messageId/edit',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.editMessageZodSchema),
  MessageController.editMessage
);

router.delete(
  '/:messageId',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.messageIdParamSchema),
  MessageController.deleteMessage
);

router.patch(
  '/:messageId/read',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.messageIdParamSchema),
  MessageController.markMessageAsRead
);

router.patch(
  '/:messageId/pin',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.messageIdParamSchema),
  MessageController.togglePinMessage
);

router.get(
  '/search',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.searchMessagesZodSchema),
  MessageController.searchMessages
);

router.get(
  '/:chatId/unseen',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.getChatMessagesZodSchema),
  MessageController.getUnseenMessageCount
);

router.post(
  '/:messageId/react',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(MessageValidation.reactionZodSchema),
  MessageController.toggleReaction
);

export const MessageRoutes = router;
