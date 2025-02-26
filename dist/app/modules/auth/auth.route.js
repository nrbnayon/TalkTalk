"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_controller_1 = require("./auth.controller");
const auth_validation_1 = require("./auth.validation");
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const router = express_1.default.Router();
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
router.post('/login', rateLimit_middleware_1.authLimiter, (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createLoginZodSchema), auth_controller_1.AuthController.loginUser);
/**
 * @route   POST /auth/login-for-social
 * @desc    Login user with social media credentials
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post('/login-for-social', rateLimit_middleware_1.authLimiter, auth_controller_1.AuthController.loginUserForSocial);
/**
 * @route   POST /auth/verify-email
 * @desc    Verify user's email with OTP
 * @access  Public
 * @rateLimit 3 attempts per 10 minutes
 */
router.post('/verify-email', rateLimit_middleware_1.otpLimiter, (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createVerifyEmailZodSchema), auth_controller_1.AuthController.verifyEmail);
/**
 * @route   POST /auth/resend-otp
 * @desc    Resend email verification OTP
 * @access  Public
 * @rateLimit 2 attempts per 10 minutes
 */
router.post('/resend-otp', rateLimit_middleware_1.otpRequestLimiter, auth_controller_1.AuthController.resendVerificationEmail);
/**
 * @route   POST /auth/refresh-token
 * @desc    Get new access token using refresh token
 * @access  Public
 */
router.post('/refresh-token', auth_controller_1.AuthController.newAccessToken);
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
router.post('/forgot-password', rateLimit_middleware_1.passwordResetLimiter, (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createForgetPasswordZodSchema), auth_controller_1.AuthController.forgetPassword);
/**
 * @route   POST /auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 * @rateLimit 3 attempts per 10 minutes
 */
router.post('/reset-password', rateLimit_middleware_1.passwordResetLimiter, (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createResetPasswordZodSchema), auth_controller_1.AuthController.resetPassword);
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
router.delete('/delete-account', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), auth_controller_1.AuthController.deleteAccount);
/**
 * @route   POST /auth/change-password
 * @desc    Change user password
 * @access  Private - All authenticated users
 * @rateLimit 3 attempts per 10 minutes
 */
router.post('/change-password', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), rateLimit_middleware_1.passwordResetLimiter, (0, validateRequest_1.default)(auth_validation_1.AuthValidation.createChangePasswordZodSchema), auth_controller_1.AuthController.changePassword);
/**
 * @route   POST /auth/logout
 * @desc    Logout user
 * @access  Private - All authenticated users
 */
router.post('/logout', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), auth_controller_1.AuthController.logout);
exports.AuthRoutes = router;
