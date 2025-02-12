import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { UserLogRoutes } from '../app/modules/userLog/userLog.route';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { PaymentRoutes } from '../app/modules/payment/payment.route';
import { BannerRoutes } from '../app/modules/banner/banner.route';
import { ReviewRoutes } from '../app/modules/review/review.route';
import { WishlistRoutes } from '../app/modules/wishList/wishList.route';
import { NotificationRoutes } from '../app/modules/notification/notification.route';
import { MessageRoutes } from '../app/modules/messages/messages.route';
import { ChatRoutes } from '../app/modules/chat/chat.route';
import { SalonRoutes } from '../app/modules/salons/salon.route';
import { ServiceRoutes } from '../app/modules/services/services.route';
import { AppointmentRoutes } from '../app/modules/appointment/appointment.route';
import { CardRoutes } from '../app/modules/cardPayment/card.route';
import { ProductRoutes } from '../app/modules/product/product.route';
import { CartRoutes } from '../app/modules/cart/cart.route';
import { OrderRoutes } from '../app/modules/order/order.route';
import { IncomeRoutes } from '../app/modules/income/income.route';

const router = express.Router();

const apiRoutes = [
  { path: '/user', route: UserRoutes },
  { path: '/auth', route: AuthRoutes },
  { path: '/device', route: UserLogRoutes },
  { path: '/category', route: CategoryRoutes },
  { path: '/banner', route: BannerRoutes },
  { path: '/salon', route: SalonRoutes },
  { path: '/service', route: ServiceRoutes },
  { path: '/products', route: ProductRoutes },
  { path: '/cart', route: CartRoutes },
  { path: '/wishlist', route: WishlistRoutes },
  { path: '/appointment', route: AppointmentRoutes },
  { path: '/payment', route: PaymentRoutes },
  { path: '/cards', route: CardRoutes },
  { path: '/reviews', route: ReviewRoutes },
  { path: '/notifications', route: NotificationRoutes },
  { path: '/wishList', route: WishlistRoutes },
  { path: '/notification', route: NotificationRoutes },
  { path: '/message', route: MessageRoutes },
  { path: '/chat', route: ChatRoutes },
  { path: '/orders', route: OrderRoutes },
  { path: '/incomes', route: IncomeRoutes },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
