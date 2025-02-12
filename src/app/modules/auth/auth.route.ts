import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import {
  authLimiter,
  otpLimiter,
  otpRequestLimiter,
  passwordResetLimiter,
} from '../../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * Authentication Routes
 * ===========================================
 * This module handles all authentication-related routes including:
 * - Login (both traditional and social)
 * - Email verification
 * - Password management
 * - Account management
 */

/**
 * Authentication Routes - Public Access
 * -------------------------------------------
 * These routes are accessible without authentication
 */

/**
 * @route   POST /auth/login
 * @desc    Login user with email and password
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post(
  '/login',
  authLimiter,
  validateRequest(AuthValidation.createLoginZodSchema),
  AuthController.loginUser
);

/**
 * @route   POST /auth/login-for-social
 * @desc    Login user with social media credentials
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post(
  '/login-for-social',
  authLimiter,
  AuthController.loginUserForSocial
);

/**
 * @route   POST /auth/verify-email
 * @desc    Verify user's email with OTP
 * @access  Public
 * @rateLimit 3 attempts per 10 minutes
 */
router.post(
  '/verify-email',
  otpLimiter,
  validateRequest(AuthValidation.createVerifyEmailZodSchema),
  AuthController.verifyEmail
);

/**
 * @route   POST /auth/resend-otp
 * @desc    Resend email verification OTP
 * @access  Public
 * @rateLimit 2 attempts per 10 minutes
 */
router.post(
  '/resend-otp',
  otpRequestLimiter,
  AuthController.resendVerificationEmail
);

/**
 * @route   POST /auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', AuthController.newAccessToken);

/**
 * Password Management Routes
 * -------------------------------------------
 * Routes for handling password reset and recovery
 */

/**
 * @route   POST /auth/forgot-password
 * @desc    Initialize password reset process
 * @access  Public
 * @rateLimit 3 attempts per 10 minutes
 */
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validateRequest(AuthValidation.createForgetPasswordZodSchema),
  AuthController.forgetPassword
);

/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @rateLimit 3 attempts per 10 minutes
 */
router.post(
  '/reset-password',
  passwordResetLimiter,
  validateRequest(AuthValidation.createResetPasswordZodSchema),
  AuthController.resetPassword
);

/**
 * Protected Routes
 * -------------------------------------------
 * These routes require authentication
 */

/**
 * @route   DELETE /auth/delete-account
 * @desc    Delete user account
 * @access  Private - User & Host only
 */
router.delete(
  '/delete-account',
  auth(USER_ROLES.USER, USER_ROLES.HOST),
  AuthController.deleteAccount
);

/**
 * @route   POST /auth/change-password
 * @desc    Change user password
 * @access  Private - All authenticated users
 * @rateLimit 3 attempts per 10 minutes
 */
router.post(
  '/change-password',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  passwordResetLimiter,
  validateRequest(AuthValidation.createChangePasswordZodSchema),
  AuthController.changePassword
);

/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private - All authenticated users
 */
router.post(
  '/logout',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  AuthController.logout
);

export const AuthRoutes = router;
