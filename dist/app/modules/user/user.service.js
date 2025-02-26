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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
// src\app\modules\user\user.service.ts
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../../../enums/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const colors_1 = __importDefault(require("colors"));
const user_model_1 = require("./user.model");
const notificationHelper_1 = require("../../../helpers/notificationHelper");
const unlinkFile_1 = __importDefault(require("../../../shared/unlinkFile"));
const logger_1 = require("../../../shared/logger");
const config_1 = __importDefault(require("../../../config"));
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const createUserIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const existingUser = yield user_model_1.User.findOne({ email: payload.email });
    if (existingUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'An account with this email already exists. Please use a different email address.');
    }
    try {
        const session = yield mongoose_1.default.startSession();
        let result;
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            if (!payload.role)
                payload.role = user_1.USER_ROLES.USER;
            if (!payload.password)
                payload.password = config_1.default.admin.password;
            result = yield user_model_1.User.create([payload], { session });
            result = result[0];
            if (!result) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Failed to create user account. Please try again.');
            }
            console.log('User created successfully::', result);
            // Generate and send OTP
            const otp = (0, generateOTP_1.default)();
            const emailValues = {
                name: result.name,
                otp,
                email: result.email,
            };
            const accountEmailTemplate = emailTemplate_1.emailTemplate.createAccount(emailValues);
            yield emailHelper_1.emailHelper.sendEmail(accountEmailTemplate);
            // Update user authentication details
            const authentication = {
                oneTimeCode: otp,
                expireAt: new Date(Date.now() + 3 * 60000),
            };
            const updatedUser = yield user_model_1.User.findOneAndUpdate({ _id: result._id }, {
                $set: {
                    authentication,
                    status: 'pending',
                    verified: false,
                },
            }, { new: true, session });
            if (!updatedUser) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update user authentication details');
            }
        }));
        yield session.endSession();
        return {
            email: result.email,
            status: 'success',
            message: 'Registration successful. Please check your email for verification code.',
        };
    }
    catch (error) {
        if (error instanceof Error) {
            const mongoError = error;
            if (mongoError.code === 11000) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'An account with this email already exists. Please use a different email address.');
            }
        }
        logger_1.logger.error('User creation error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user account. Please try again later.');
    }
});
const setUserNewPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password, address } = payload;
    const user = yield user_model_1.User.findOne({ email });
    if (!user) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
    }
    if (!user.verified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please verify your email first');
    }
    const hashedPassword = yield bcrypt_1.default.hash(password, Number(config_1.default.bcrypt_salt_rounds));
    const session = yield mongoose_1.default.startSession();
    let updatedUser;
    try {
        yield session.withTransaction(() => __awaiter(void 0, void 0, void 0, function* () {
            // Update user with password and set status to active
            updatedUser = yield user_model_1.User.findByIdAndUpdate(user._id, {
                password: hashedPassword,
                address,
                status: 'active',
            }, { new: true, session }).select('-password');
            if (!updatedUser) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to update user');
            }
            // Send admin notifications since the user registration is now complete
            const adminUsers = yield user_model_1.User.find({ role: user_1.USER_ROLES.ADMIN }).select('_id');
            // Create notifications for each admin
            const notificationPromises = adminUsers.map(admin => {
                const notificationData = {
                    message: `New ${user.role.toLowerCase()}, Name: ${user.name}, Email: (${user.email}) has completed registration.`,
                    type: 'ADMIN',
                    receiver: admin._id,
                    metadata: {
                        userId: user._id,
                        userEmail: user.email,
                        userName: user.name,
                        userRole: user.role,
                        action: `new_${user.role.toLowerCase()}_registration_completed`,
                    },
                };
                return (0, notificationHelper_1.sendNotifications)(notificationData); // send notification using socketIO or other notification system
                // return NotificationService.createNotification(notificationData);
            });
            yield Promise.all(notificationPromises);
        }));
        yield session.endSession();
        // Generate access token after successful password set
        const accessToken = jwtHelper_1.jwtHelper.createToken({
            id: user._id,
            role: user.role,
            email: user.email,
            name: user.name,
        }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
        return {
            accessToken,
            data: updatedUser,
        };
    }
    catch (error) {
        yield session.endSession();
        logger_1.logger.error('Set password error:', error);
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to set password. Please try again later.');
    }
});
const getAllUsers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = query, filterData = __rest(query, ["searchTerm", "page", "limit", "sortBy", "order"]);
    // Search conditions
    const conditions = [];
    if (searchTerm) {
        const cleanedSearchTerm = searchTerm.toString().replace(/[+\s-]/g, '');
        conditions.push({
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { email: { $regex: searchTerm, $options: 'i' } },
                {
                    phone: {
                        $regex: cleanedSearchTerm,
                        $options: 'i',
                    },
                },
            ],
        });
    }
    // Add filter conditions
    if (Object.keys(filterData).length > 0) {
        const filterConditions = Object.entries(filterData).map(([field, value]) => ({
            [field]: value,
        }));
        conditions.push({ $and: filterConditions });
    }
    const whereConditions = conditions.length ? { $and: conditions } : {};
    // Pagination setup
    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;
    // Sorting setup
    const sortOrder = order === 'desc' ? -1 : 1;
    const sortCondition = {
        [sortBy]: sortOrder,
    };
    // Query the database
    const [users, total, genderStats] = yield Promise.all([
        user_model_1.User.find(whereConditions)
            .sort(sortCondition)
            .skip(skip)
            .limit(pageSize)
            .lean(),
        user_model_1.User.countDocuments(whereConditions),
        user_model_1.User.aggregate([
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 },
                },
            },
        ]),
    ]);
    // Calculate gender ratios
    const totalUsers = genderStats.reduce((acc, curr) => acc + curr.count, 0);
    const genderRatio = genderStats.reduce((acc, { _id, count }) => {
        if (_id) {
            acc[_id] = {
                count,
                percentage: ((count / totalUsers) * 100).toFixed(2) + '%',
            };
        }
        return acc;
    }, {});
    // Format the updatedAt field
    const formattedUsers = users === null || users === void 0 ? void 0 : users.map(user => (Object.assign(Object.assign({}, user), { updatedAt: user.updatedAt
            ? new Date(user.updatedAt).toISOString().split('T')[0]
            : null })));
    // Meta information for pagination and gender stats
    return {
        meta: {
            total,
            limit: pageSize,
            totalPages: Math.ceil(total / pageSize),
            currentPage,
            genderRatio,
        },
        result: formattedUsers,
    };
});
const getUserProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.findById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    return isExistUser;
});
const updateProfileToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = user;
    const isExistUser = yield user_model_1.User.isExistUserById(id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Check if email or phone is being updated
    const needsVerification = payload.email || payload.phone;
    if (needsVerification) {
        // Check if new email already exists
        if (payload.email) {
            const emailExists = yield user_model_1.User.findOne({
                email: payload.email,
                _id: { $ne: id }, // Exclude current user
            });
            if (emailExists) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Email already exists. Please use a different email address.');
            }
        }
        // Check if new phone already exists
        if (payload.phone) {
            const phoneExists = yield user_model_1.User.findOne({
                phone: payload.phone,
                _id: { $ne: id }, // Exclude current user
            });
            if (phoneExists) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'Phone number already exists. Please use a different number.');
            }
        }
        // Generate OTP for verification
        const otp = (0, generateOTP_1.default)();
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes
            isResetPassword: false,
        };
        // Store the pending changes and authentication data
        const pendingChanges = Object.assign(Object.assign(Object.assign({}, (payload.email && { email: payload.email })), (payload.phone && { phone: payload.phone })), { authentication, verified: false, status: 'pending' });
        // Send OTP to new email if email is being updated
        if (payload.email) {
            const emailValues = {
                name: isExistUser.name,
                otp,
                email: payload.email,
            };
            const verificationEmailTemplate = emailTemplate_1.emailTemplate.createAccount(emailValues);
            yield emailHelper_1.emailHelper.sendEmail(verificationEmailTemplate);
        }
        // Update user with pending changes
        yield user_model_1.User.findOneAndUpdate({ _id: id }, pendingChanges, { new: true });
        return {
            verificationRequired: true,
            message: 'Please verify your new contact information with the OTP sent to your email.',
        };
    }
    // Handle image update
    if (payload.image && isExistUser.image) {
        (0, unlinkFile_1.default)(isExistUser.image);
    }
    // Process normal update without verification
    const updateDoc = yield user_model_1.User.findOneAndUpdate({ _id: id }, payload, {
        new: true,
    });
    return updateDoc;
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findById(id);
    return result;
});
const getOnlineUsers = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const onlineUsers = yield user_model_1.User.find({
            onlineStatus: true,
            // lastActiveAt: {
            //   $gte: new Date(Date.now() - 5 * 60 * 1000),
            // },
        }).select('name email profileImage');
        logger_1.logger.info(colors_1.default.green(`[UserService] Retrieved ${onlineUsers.length} online users`));
        return onlineUsers;
    }
    catch (error) {
        logger_1.logger.error(colors_1.default.red('[UserService] Error retrieving online users:'), error);
        throw error;
    }
});
const updateUserOnlineStatus = (userId, isOnline) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield user_model_1.User.findByIdAndUpdate(userId, {
            onlineStatus: isOnline,
            lastActiveAt: new Date(),
        }, { new: true });
        if (!user) {
            throw new Error('User not found');
        }
        logger_1.logger.info(colors_1.default.green(`[UserService] User ${userId} online status updated to ${isOnline}`));
        return user;
    }
    catch (error) {
        logger_1.logger.error(colors_1.default.red(`[UserService] Error updating user ${userId} online status:`), error);
        throw error;
    }
});
exports.UserService = {
    createUserIntoDB,
    setUserNewPassword,
    getUserProfileFromDB,
    updateProfileToDB,
    getAllUsers,
    getSingleUser,
    getOnlineUsers,
    updateUserOnlineStatus,
};
