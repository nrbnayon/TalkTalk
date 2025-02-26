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
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const jwtHelper_1 = require("../../helpers/jwtHelper");
const user_model_1 = require("../modules/user/user.model");
const auth = (...roles) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tokenWithBearer = req.headers.authorization;
        const refreshToken = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.refreshToken;
        if (!(tokenWithBearer === null || tokenWithBearer === void 0 ? void 0 : tokenWithBearer.startsWith('Bearer '))) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid or missing token');
        }
        const accessToken = tokenWithBearer.split(' ')[1];
        try {
            // Verify the access token
            const verifyUser = jwtHelper_1.jwtHelper.verifyToken(accessToken, config_1.default.jwt.jwt_secret);
            req.user = verifyUser;
            // Role-based authorization check
            if (roles.length && !roles.includes(verifyUser.role)) {
                throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
            }
            return next();
        }
        catch (error) {
            // Handle token expiration and refresh
            if (error instanceof Error &&
                error.name === 'TokenExpiredError' &&
                refreshToken) {
                try {
                    // Verify refresh token
                    const decodedRefresh = jsonwebtoken_1.default.verify(refreshToken, config_1.default.jwt.jwtRefreshSecret);
                    // Check if user still exists
                    const user = yield user_model_1.User.findById(decodedRefresh.id);
                    if (!user) {
                        throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'User not found');
                    }
                    // Generate new access token
                    const newAccessToken = jwtHelper_1.jwtHelper.createToken({
                        id: user._id,
                        role: user.role,
                        email: user.email,
                        name: user.name,
                    }, config_1.default.jwt.jwt_secret, config_1.default.jwt.jwt_expire_in);
                    // Set new access token in response header
                    res.setHeader('New-Access-Token', newAccessToken);
                    // Assign new token payload to request user
                    req.user = jwtHelper_1.jwtHelper.verifyToken(newAccessToken, config_1.default.jwt.jwt_secret);
                    // Role-based authorization check again
                    if (roles.length && !roles.includes(user.role)) {
                        throw new ApiError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You don't have permission to access this API");
                    }
                    return next();
                }
                catch (refreshError) {
                    throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Session expired, please log in again');
                }
            }
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Invalid access token');
        }
    }
    catch (error) {
        next(error);
    }
});
exports.default = auth;
