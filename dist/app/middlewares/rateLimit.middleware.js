"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiLimiter = exports.passwordResetLimiter = exports.otpRequestLimiter = exports.otpLimiter = exports.authLimiter = exports.createRateLimiter = exports.generateKey = exports.rateLimitErrorHandler = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../../config"));
// Constants
const MINUTES_TO_MS = 60 * 1000;
const DEFAULT_WINDOW_MS = 10 * MINUTES_TO_MS;
const DEFAULT_MAX_ATTEMPTS = 5;
// Base configuration
const baseConfig = {
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipFailedRequests: false, // Count failed requests against the rate limit
    skipSuccessfulRequests: false, // Count successful requests against the rate limit
};
/**
 * Type-safe key generator function for rate limiting based on user identification
 */
const generateKey = (req) => {
    var _a, _b;
    try {
        const userReq = req;
        if ((_a = userReq.user) === null || _a === void 0 ? void 0 : _a.id) {
            return `${req.ip}-${userReq.user.id}`;
        }
        if ((_b = req.body) === null || _b === void 0 ? void 0 : _b.email) {
            return `${req.ip}-${req.body.email}`;
        }
        return req.ip || 'unknown-ip';
    }
    catch (error) {
        console.error('Error in generateKey:', error);
        return req.ip || 'unknown-ip'; // Fallback to IP in case of error
    }
};
exports.generateKey = generateKey;
/**
 * Creates a rate limiter with custom configuration
 * @param config Rate limit configuration
 * @returns Rate limit middleware
 */
const createRateLimiter = (config) => {
    return (0, express_rate_limit_1.default)(Object.assign(Object.assign(Object.assign({}, baseConfig), config), { keyGenerator: generateKey }));
};
exports.createRateLimiter = createRateLimiter;
// Rate Limiter Configurations
const rateLimiters = {
    auth: createRateLimiter({
        windowMs: config_1.default.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
        max: config_1.default.security.rateLimit.max || DEFAULT_MAX_ATTEMPTS,
        message: {
            status: 'error',
            message: '🚫 Too many login/register attempts. Please try again later.',
            tryAfterMinutes: 10,
        },
    }),
    otp: createRateLimiter({
        windowMs: config_1.default.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
        max: 3,
        message: {
            status: 'error',
            message: '🚫 Too many OTP verification attempts. Please try again later.',
            tryAfterMinutes: 10,
        },
    }),
    otpRequest: createRateLimiter({
        windowMs: config_1.default.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
        max: 2,
        message: {
            status: 'error',
            message: '🚫 Too many OTP requests. Please try again later.',
            tryAfterMinutes: 10,
        },
    }),
    passwordReset: createRateLimiter({
        windowMs: DEFAULT_WINDOW_MS,
        max: 3,
        message: {
            status: 'error',
            message: '🚫 Too many password reset attempts. Please try again later.',
            tryAfterMinutes: 10,
        },
    }),
    api: createRateLimiter({
        windowMs: DEFAULT_WINDOW_MS,
        max: 100,
        message: {
            status: 'error',
            message: '🚫 Too many requests. Please try again later.',
            tryAfterMinutes: 10,
        },
    }),
};
/**
 * Error handler middleware for rate limit errors
 */
const rateLimitErrorHandler = (err, req, res, next) => {
    if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
        res.status(429).json({
            status: 'error',
            message: '🚫 Too many requests. Please try again later.',
            tryAfterMinutes: 10,
        });
    }
    else {
        next(err);
    }
};
exports.rateLimitErrorHandler = rateLimitErrorHandler;
// Export rate limiters
exports.authLimiter = rateLimiters.auth, exports.otpLimiter = rateLimiters.otp, exports.otpRequestLimiter = rateLimiters.otpRequest, exports.passwordResetLimiter = rateLimiters.passwordReset, exports.apiLimiter = rateLimiters.api;
// Example usage in routes:
/*
import { authLimiter, otpLimiter } from './middleware/rateLimit';

router.post('/login', authLimiter, loginController);
router.post('/verify-otp', otpLimiter, verifyOTPController);
*/
