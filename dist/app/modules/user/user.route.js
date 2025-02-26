"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_1 = require("../../../enums/user");
const auth_1 = __importDefault(require("../../middlewares/auth"));
const fileUploadHandler_1 = __importDefault(require("../../middlewares/fileUploadHandler"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_controller_1 = require("./user.controller");
const user_validation_1 = require("./user.validation");
const getFilePath_1 = __importDefault(require("../../../shared/getFilePath"));
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const router = express_1.default.Router();
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
router.post('/create-user', rateLimit_middleware_1.authLimiter, (0, fileUploadHandler_1.default)(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = Object.assign({}, req.body);
        if (req.files) {
            const imagePath = (0, getFilePath_1.default)(req.files, 'images');
            if (imagePath) {
                userData.image = imagePath;
            }
        }
        const validatedData = user_validation_1.UserValidation.createUserZodSchema.parse(userData);
        req.body = validatedData;
        return user_controller_1.UserController.createUser(req, res, next);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * @route   POST /users/set-password
 * @desc    Set user password during registration
 * @access  Public
 * @rateLimit 5 attempts per 10 minutes
 */
router.post('/set-password', rateLimit_middleware_1.authLimiter, (0, validateRequest_1.default)(user_validation_1.UserValidation.setPasswordZodSchema), user_controller_1.UserController.setPassword);
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
router.patch('/update-profile', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST, user_1.USER_ROLES.ADMIN), rateLimit_middleware_1.apiLimiter, (0, fileUploadHandler_1.default)(), (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let validatedData = Object.assign({}, req.body);
        if (req.files) {
            const imagePath = (0, getFilePath_1.default)(req.files, 'images');
            if (imagePath) {
                validatedData.image = imagePath;
            }
        }
        const validatedUserData = user_validation_1.UserValidation.updateZodSchema.parse(validatedData);
        req.body = validatedUserData;
        yield user_controller_1.UserController.updateProfile(req, res, next);
    }
    catch (error) {
        next(error);
    }
}));
/**
 * @route   GET /users/user
 * @desc    Get user's own profile
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get('/user', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.getUserProfile);
/**
 * @route   GET /users/profile
 * @desc    Alias for getting user's own profile
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.get('/profile', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.getUserProfile);
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
router.get('/get-all-users', (0, auth_1.default)(user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.USER, user_1.USER_ROLES.HOST), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.getAllUser);
/**
 * @route   GET /users/get-all-users/:id
 * @desc    Get single user details
 * @access  Private - Admin only
 * @rateLimit Standard API limit
 */
router.get('/get-all-users/:id', (0, auth_1.default)(user_1.USER_ROLES.ADMIN), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.getSingleUser);
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
router.get('/online-users', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), 
// apiLimiter,
user_controller_1.UserController.getOnlineUsers);
/**
 * @route   PATCH /users/online-status
 * @desc    Update user's online status
 * @access  Private - All authenticated users
 * @rateLimit Standard API limit
 */
router.patch('/online-status', (0, auth_1.default)(user_1.USER_ROLES.USER, user_1.USER_ROLES.ADMIN, user_1.USER_ROLES.HOST), rateLimit_middleware_1.apiLimiter, user_controller_1.UserController.updateOnlineStatus);
exports.UserRoutes = router;
