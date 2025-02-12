import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

router.post('/login-for-social', AuthController.loginUserForSocial);

router.post(
  '/verify-email',
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

router.post('/resend-otp', AuthController.resendVerificationEmail);

router.post('/refresh-token', AuthController.newAccessToken);

router.post(
  '/forgot-password',
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

router.post(
  '/reset-password',
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

router.delete(
  '/delete-account',
  auth(USER_ROLES.USER, USER_ROLES.HOST),
  AuthController.deleteAccount
);

router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);
router.post(
  '/logout',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  AuthController.logout
);
export const AuthRoutes = router;
