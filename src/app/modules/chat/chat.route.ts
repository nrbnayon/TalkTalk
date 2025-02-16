// src\app\modules\chat\chat.model.ts

import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ChatController } from './chat.controller';
import { ChatValidation } from './chat.validation';

const router = express.Router();

router.post(
  '/new',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.accessChatZodSchema),
  ChatController.accessChat
);

router.get(
  '/',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  ChatController.getAllChats
);

router.post(
  '/group',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.createGroupChatZodSchema),
  ChatController.createGroupChat
);

router.patch(
  '/rename',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.renameGroupZodSchema),
  ChatController.renameGroup
);

router.patch(
  '/groupremove',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.groupActionZodSchema),
  ChatController.removeFromGroup
);

router.patch(
  '/groupadd',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.groupActionZodSchema),
  ChatController.addToGroup
);

router.patch(
  '/:chatId/pin',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.chatActionZodSchema),
  ChatController.updateChatPin
);

router.patch(
  '/:chatId/delete',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.chatActionZodSchema),
  ChatController.markChatAsDeleted
);

router.patch(
  '/:chatId/block',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  validateRequest(ChatValidation.chatActionZodSchema),
  ChatController.blockUnblockUser
);

export const ChatRoutes = router;
