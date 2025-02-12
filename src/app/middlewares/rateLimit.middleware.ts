import { Request, Response, NextFunction } from 'express';
import rateLimit, {
  RateLimitRequestHandler,
  Options,
  ValueDeterminingMiddleware,
} from 'express-rate-limit';
import { JwtPayload } from 'jsonwebtoken';
import config from '../../config';

// Enhanced JWT Payload interface that includes required fields
interface EnhancedJwtPayload extends JwtPayload {
  id: string;
  role?: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

// Updated Request interface that properly extends Express Request
interface UserRequest extends Request {
  user: EnhancedJwtPayload;
}

interface RateLimitMessage {
  status: string;
  message: string;
  tryAfterMinutes: number;
}

interface RateLimitConfig extends Partial<Options> {
  windowMs: number;
  max: number;
  message: RateLimitMessage;
}

// Constants
const MINUTES_TO_MS = 60 * 1000;
const DEFAULT_WINDOW_MS = 10 * MINUTES_TO_MS;
const DEFAULT_MAX_ATTEMPTS = 5;

// Base configuration
const baseConfig: Partial<Options> = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipFailedRequests: false, // Count failed requests against the rate limit
  skipSuccessfulRequests: false, // Count successful requests against the rate limit
};

/**
 * Type-safe key generator function for rate limiting based on user identification
 */
const generateKey: ValueDeterminingMiddleware<string> = (
  req: Request
): string => {
  try {
    const userReq = req as UserRequest;
    if (userReq.user?.id) {
      return `${req.ip}-${userReq.user.id}`;
    }

    if (req.body?.email) {
      return `${req.ip}-${req.body.email}`;
    }

    return req.ip || 'unknown-ip';
  } catch (error) {
    console.error('Error in generateKey:', error);
    return req.ip || 'unknown-ip'; // Fallback to IP in case of error
  }
};

/**
 * Creates a rate limiter with custom configuration
 * @param config Rate limit configuration
 * @returns Rate limit middleware
 */
const createRateLimiter = (
  config: RateLimitConfig
): RateLimitRequestHandler => {
  return rateLimit({
    ...baseConfig,
    ...config,
    keyGenerator: generateKey,
  });
};

// Rate Limiter Configurations
const rateLimiters = {
  auth: createRateLimiter({
    windowMs: config.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
    max: config.security.rateLimit.max || DEFAULT_MAX_ATTEMPTS,
    message: {
      status: 'error',
      message: '🚫 Too many login/register attempts. Please try again later.',
      tryAfterMinutes: 10,
    },
  }),

  otp: createRateLimiter({
    windowMs: config.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
    max: 3,
    message: {
      status: 'error',
      message: '🚫 Too many OTP verification attempts. Please try again later.',
      tryAfterMinutes: 10,
    },
  }),

  otpRequest: createRateLimiter({
    windowMs: config.security.rateLimit.windowMs || DEFAULT_WINDOW_MS,
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
const rateLimitErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof Error && err.message.includes('Rate limit exceeded')) {
    res.status(429).json({
      status: 'error',
      message: '🚫 Too many requests. Please try again later.',
      tryAfterMinutes: 10,
    });
  } else {
    next(err);
  }
};

// Export individual rate limiters and types
export {
  UserRequest,
  EnhancedJwtPayload,
  RateLimitMessage,
  RateLimitConfig,
  rateLimitErrorHandler,
  generateKey,
  createRateLimiter,
};

// Export rate limiters
export const {
  auth: authLimiter,
  otp: otpLimiter,
  otpRequest: otpRequestLimiter,
  passwordReset: passwordResetLimiter,
  api: apiLimiter,
} = rateLimiters;

// Example usage in routes:
/*
import { authLimiter, otpLimiter } from './middleware/rateLimit';

router.post('/login', authLimiter, loginController);
router.post('/verify-otp', otpLimiter, verifyOTPController);
*/
