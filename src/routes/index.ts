import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { UserLogRoutes } from '../app/modules/userLog/userLog.route';
import { MessageRoutes } from '../app/modules/messages/messages.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';

const router = express.Router();

const apiRoutes = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/device', route: UserLogRoutes },
  { path: '/messages', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
