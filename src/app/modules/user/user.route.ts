import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import getFilePath from '../../../shared/getFilePath';
import {
  apiLimiter,
  authLimiter,
} from '../../middlewares/rateLimit.middleware';

const router = express.Router();

/**
 * User Management Routes
 * ===========================================
 * Handles all user-related operations including:
 * - User registration
 * - Profile management
 * - Admin user management
 * - Online status tracking
 */

/**
 * User Registration
 * -------------------------------------------
 * Public routes for user registration and setup
 */

/**
 * @route   POST /users/create-user
 * @desc    Register a new user with profile image
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post(
  '/create-user',
  authLimiter,
  fileUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userData = {
        ...req.body,
      };

      if (req.files) {
        const imagePath = getFilePath(req.files, 'images');
        if (imagePath) {
          userData.image = imagePath;
        }
      }

      const validatedData = UserValidation.createUserZodSchema.parse(userData);
      req.body = validatedData;

      return UserController.createUser(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /users/set-password
 * @desc    Set user password during registration
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post(
  '/set-password',
  authLimiter,
  validateRequest(UserValidation.setPasswordZodSchema),
  UserController.setPassword
);

/**
 * Profile Management
 * -------------------------------------------
 * Protected routes for user profile operations
 */

/**
 * @route   PATCH /users/update-profile
 * @desc    Update user profile including profile image
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.patch(
  '/update-profile',
  auth(USER_ROLES.USER, USER_ROLES.HOST, USER_ROLES.ADMIN),
  apiLimiter,
  fileUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let validatedData = { ...req.body };

      if (req.files) {
        const imagePath = getFilePath(req.files, 'images');
        if (imagePath) {
          validatedData.image = imagePath;
        }
      }
      const validatedUserData =
        UserValidation.updateZodSchema.parse(validatedData);

      req.body = validatedUserData;

      await UserController.updateProfile(req, res, next);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /users/user
 * @desc    Get user's own profile
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get(
  '/user',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  apiLimiter,
  UserController.getUserProfile
);

/**
 * @route   GET /users/profile
 * @desc    Alias for getting user's own profile
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get(
  '/profile',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  apiLimiter,
  UserController.getUserProfile
);

/**
 * Admin User Management
 * -------------------------------------------
 * Protected routes for admin user management
 */

/**
 * @route   GET /users/get-all-users
 * @desc    Get list of all users
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get(
  '/get-all-users',
  auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.HOST),
  apiLimiter,
  UserController.getAllUser
);

/**
 * @route   GET /users/get-all-users/:id
 * @desc    Get single user details
 * @access  Private - Admin only
 * @rateLimit Standard API limit
 */
router.get(
  '/get-all-users/:id',
  auth(USER_ROLES.ADMIN),
  apiLimiter,
  UserController.getSingleUser
);

/**
 * Online Status Management
 * -------------------------------------------
 * Protected routes for managing user online status
 */

/**
 * @route   GET /users/online-users
 * @desc    Get list of currently online users
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get(
  '/online-users',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.HOST),
  // apiLimiter,
  UserController.getOnlineUsers
);

/**
 * @route   PATCH /users/online-status
 * @desc    Update user's online status
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.patch(
  '/online-status',
  auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.HOST),
  apiLimiter,
  UserController.updateOnlineStatus
);

export const UserRoutes = router;
