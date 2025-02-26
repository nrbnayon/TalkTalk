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
exports.AuthService = void 0;
// src\app\modules\auth\auth.service.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../../../config"));
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const emailHelper_1 = require("../../../helpers/emailHelper");
const jwtHelper_1 = require("../../../helpers/jwtHelper");
const emailTemplate_1 = require("../../../shared/emailTemplate");
const cryptoToken_1 = __importDefault(require("../../../util/cryptoToken"));
const generateOTP_1 = __importDefault(require("../../../util/generateOTP"));
const user_model_1 = require("../user/user.model");
const resetToken_model_1 = require("../resetToken/resetToken.model");
const userLog_service_1 = require("../userLog/userLog.service");
const user_1 = require("../../../enums/user");
const mongoose_1 = require("mongoose");
const google_auth_library_1 = require("google-auth-library");
const googleClient = new google_auth_library_1.OAuth2Client(config_1.default.google.clientId);
//login
const loginUserFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = payload;
    const isExistUser = yield user_model_1.User.findOne({ email }).select('+password');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //check verified and status
    if (!isExistUser.verified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please verify your account, then try to login again');
    }
    //check user status
    if (isExistUser.status === 'delete') {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You don’t have permission to access this content.It looks like your account has been deactivated.');
    }
    //check match password
    if (!password ||
        !(yield user_model_1.User.isMatchPassword(password, isExistUser.password))) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect!');
    }
    //create token
    const accessToken = jwtHelper_1.jwtHelper.createToken({
        id: isExistUser._id,
        role: isExistUser.role,
        email: isExistUser.email,
        name: isExistUser.name,
    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    //create token
    const refreshToken = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwtRefreshSecret, config_1.default.jwt.jwtRefreshExpiresIn);
    return { accessToken, refreshToken };
});
// social login
const loginUserSocial = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, appId, role, type, fcmToken, image } = payload;
    if (!Object.values(user_1.USER_ROLES).includes(role)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid user role');
    }
    // Validate login type specific requirements
    if (type === 'GOOGLE' && !fcmToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'FCM token is required for Google login');
    }
    if (type === 'APPLE' && !appId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'App ID is required for Apple login');
    }
    const session = yield (0, mongoose_1.startSession)();
    let user;
    try {
        session.startTransaction();
        user = yield user_model_1.User.findOne({ email });
        if (!user) {
            if (role === user_1.USER_ROLES.ADMIN) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, 'Cannot create admin user through social login');
            }
            const userData = {
                name,
                email,
                role,
                verified: true,
                image: image ||
                    'https://www.shutterstock.com/shutterstock/photos/1153673752/display_1500/stock-vector-profile-placeholder-image-gray-silhouette-no-photo-1153673752.jpg',
                status: 'active',
                onlineStatus: true,
                lastActiveAt: new Date(),
                address: {
                    locationName: '',
                    latitude: null,
                    longitude: null,
                },
            };
            // Add login type specific fields
            if (type === 'GOOGLE') {
                Object.assign(userData, { fcmToken });
            }
            else if (type === 'APPLE') {
                Object.assign(userData, { appId });
            }
            const [newUser] = yield user_model_1.User.create([userData], { session });
            if (!newUser) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to create user');
            }
            user = newUser;
        }
        else {
            if (user.role !== role) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.CONFLICT, 'User exists with different role');
            }
            // Update based on login type
            if (type === 'GOOGLE') {
                user.fcmToken = fcmToken;
            }
            else if (type === 'APPLE') {
                user.appId = appId;
            }
            user.onlineStatus = true;
            user.lastActiveAt = new Date();
            yield user.save({ session });
        }
        yield session.commitTransaction();
        const accessToken = jwtHelper_1.jwtHelper.createToken({
            id: user._id,
            role: user.role,
            email: user.email,
            name: user.name,
        }, config_1.default.jwt.jwt_secret, '7d');
        const refreshToken = jwtHelper_1.jwtHelper.createToken({
            id: user._id,
            role: user.role,
            email: user.email,
        }, config_1.default.jwt.jwtRefreshSecret, '15d');
        return {
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                verified: user.verified,
                status: user.status,
                loginType: type,
            },
        };
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        yield session.endSession();
    }
});
//forget password
const forgetPasswordToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    const isExistUser = yield user_model_1.User.isExistUserByEmail(email);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //send mail
    const otp = (0, generateOTP_1.default)();
    const value = {
        otp,
        email: isExistUser.email,
    };
    const forgetPassword = emailTemplate_1.emailTemplate.resetPassword(value);
    emailHelper_1.emailHelper.sendEmail(forgetPassword);
    //save to DB
    const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
    };
    yield user_model_1.User.findOneAndUpdate({ email }, { $set: { authentication } });
});
//verify email
const verifyEmailToDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, oneTimeCode } = payload;
    // Find user by email
    const isExistUser = yield user_model_1.User.findOne({ email }).select('+authentication');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    // Check if the authentication object exists
    if (!isExistUser.authentication) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Authentication details not found for the user.');
    }
    // Validate if oneTimeCode is provided
    if (!oneTimeCode) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please provide the OTP. Check your email for the code.');
    }
    // Validate the oneTimeCode
    if (isExistUser.authentication.oneTimeCode !== Number(oneTimeCode)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'You provided the wrong OTP.');
    }
    // Check if OTP has expired
    const currentDate = new Date();
    if (!isExistUser.authentication.expireAt ||
        currentDate > isExistUser.authentication.expireAt) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'OTP has expired. Please request a new one.');
    }
    let message;
    let data;
    if (!isExistUser.verified) {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            verified: true,
            // status: 'active',
            authentication: { oneTimeCode: null, expireAt: null },
        });
        message =
            'Your email has been successfully verified. Now set your strong password for your account fully activated.';
    }
    else {
        yield user_model_1.User.findOneAndUpdate({ _id: isExistUser._id }, {
            authentication: {
                isResetPassword: true,
                oneTimeCode: null,
                expireAt: null,
            },
        });
        // Create reset token
        const createToken = (0, cryptoToken_1.default)();
        yield resetToken_model_1.ResetToken.create({
            user: isExistUser._id,
            token: createToken,
            expireAt: new Date(Date.now() + 5 * 60000),
        });
        message =
            'Verification Successful: Please securely store and utilize this code for resetting your password.';
        data = createToken;
    }
    return { data, message };
});
//forget password
const resetPasswordToDB = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    // console.log('object', token, payload);
    const { newPassword, confirmPassword } = payload;
    //isExist token
    const isExistToken = yield resetToken_model_1.ResetToken.isExistToken(token);
    if (!isExistToken) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'You are not authorized');
    }
    //user permission check
    const isExistUser = yield user_model_1.User.findById(isExistToken.user).select('+authentication');
    if (!((_a = isExistUser === null || isExistUser === void 0 ? void 0 : isExistUser.authentication) === null || _a === void 0 ? void 0 : _a.isResetPassword)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
    }
    //validity check
    const isValid = yield resetToken_model_1.ResetToken.isExpireToken(token);
    if (!isValid) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
    }
    //check password
    if (newPassword !== confirmPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
    }
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
        authentication: {
            isResetPassword: false,
        },
    };
    yield user_model_1.User.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
        new: true,
    });
});
const changePasswordToDB = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { currentPassword, newPassword, confirmPassword } = payload;
    const isExistUser = yield user_model_1.User.findById(user.id).select('+password');
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User doesn't exist!");
    }
    //current password match
    if (currentPassword &&
        !user_model_1.User.isMatchPassword(currentPassword, isExistUser.password)) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Password is incorrect');
    }
    //newPassword and current password
    if (currentPassword === newPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Please give different password from current password');
    }
    //new password and confirm password check
    if (newPassword !== confirmPassword) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
    }
    //hash password
    const hashPassword = yield bcrypt_1.default.hash(newPassword, Number(config_1.default.bcrypt_salt_rounds));
    const updateData = {
        password: hashPassword,
    };
    yield user_model_1.User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
});
const deleteAccountToDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findByIdAndDelete(user === null || user === void 0 ? void 0 : user.id);
    if (!result) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'No User found');
    }
    return result;
});
const newAccessTokenToUser = (token) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if the token is provided
    if (!token) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Token is required!');
    }
    const verifyUser = jwtHelper_1.jwtHelper.verifyToken(token, config_1.default.jwt.jwtRefreshSecret);
    const isExistUser = yield user_model_1.User.findById(verifyUser === null || verifyUser === void 0 ? void 0 : verifyUser.id);
    if (!isExistUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
    }
    //create token
    const accessToken = jwtHelper_1.jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
    return { accessToken };
});
const resendVerificationEmailToDB = (email) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('Email from resendVerificationEmailToDB: ', email);
    // Find the user by email
    const existingUser = yield user_model_1.User.findOne({ email: email }).lean();
    if (!existingUser) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User with this email does not exist!');
    }
    if (existingUser === null || existingUser === void 0 ? void 0 : existingUser.isVerified) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'User is already verified!');
    }
    // Generate OTP and prepare email
    const otp = (0, generateOTP_1.default)();
    const emailValues = {
        name: existingUser.firstName,
        otp,
        email: existingUser.email,
    };
    const accountEmailTemplate = emailTemplate_1.emailTemplate.createAccount(emailValues);
    try {
        // Send email and handle potential errors
        yield emailHelper_1.emailHelper.sendEmail(accountEmailTemplate);
        // Update user with authentication details
        const authentication = {
            oneTimeCode: otp,
            expireAt: new Date(Date.now() + 3 * 60000),
        };
        yield user_model_1.User.findOneAndUpdate({ email: email }, { $set: { authentication } }, { new: true });
        return {
            success: true,
            message: 'OTP sent successfully',
        };
    }
    catch (error) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to send OTP email');
    }
});
const logoutUser = (userId, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findByIdAndUpdate(userId, {
        $set: {
            onlineStatus: false,
            lastActiveAt: new Date(),
        },
    });
    if (!userId) {
        throw new ApiError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, 'User with this id does not exist!');
    }
    // Update UserLog and clear cookies
    const userLogRemove = yield userLog_service_1.UserLogService.updateLogoutTime(userId, res);
    return result;
});
exports.AuthService = {
    verifyEmailToDB,
    loginUserFromDB,
    loginUserSocial,
    forgetPasswordToDB,
    resetPasswordToDB,
    changePasswordToDB,
    deleteAccountToDB,
    newAccessTokenToUser,
    resendVerificationEmailToDB,
    logoutUser,
};
