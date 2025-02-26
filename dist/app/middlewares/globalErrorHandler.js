"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("../../config"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const handleValidationError_1 = __importDefault(require("../../errors/handleValidationError"));
const handleZodError_1 = __importDefault(require("../../errors/handleZodError"));
const logger_1 = require("../../shared/logger");
const http_status_codes_1 = require("http-status-codes");
const errorEmojis = {
    default: '🤯',
    validation: '🧐',
    jwt: '🕵️',
    zod: '🔍',
    api: '⚡',
    server: '💥',
};
const funnyPhrases = [
    'Oops! Something went sideways 🙃',
    'Looks like our code had too much coffee ☕',
    'Whoopsie-daisy! 🌼',
    'Houston, we have a problem 🚀',
    'Error: Reality check failed 🤖',
    'Quantum uncertainty detected 🌌',
    'Code went on an unexpected vacation 🏖️',
];
const getFunnyErrorFact = () => {
    const funFacts = [
        'Did you know? Errors are just undocumented features! 🤓',
        'Error handling: Where code goes to think about its mistakes 🤔',
        "Bugs are not a bug, they're a feature in progress! 🐛",
        'Every error is just an opportunity for a creative solution 🚀',
        "Code doesn't break. It just takes an unexpected detour 🛣️",
        'TypeScript: Because JavaScript needs adult supervision 👀',
        'Error messages are just love notes from your compiler 💌',
    ];
    return funFacts[Math.floor(Math.random() * funFacts.length)];
};
const globalErrorHandler = (error, req, res, next) => {
    // Logging with a touch of humor
    const logMessage = `🎪 Error Circus:: ${funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]}`;
    config_1.default.node_env === 'development'
        ? console.log('🚨 globalErrorHandler ~~ ', logMessage, error)
        : logger_1.errorLogger.error('🚨 globalErrorHandler ~~ ', logMessage, error);
    let statusCode = 500;
    let message = `${errorEmojis.server} Something went wrong`;
    let errorMessages = [];
    if (error.name === 'ZodError') {
        const simplifiedError = (0, handleZodError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = `${errorEmojis.zod} Zod's crystal ball found some issues:: ${simplifiedError.message}`;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error.name === 'ValidationError') {
        const simplifiedError = (0, handleValidationError_1.default)(error);
        statusCode = simplifiedError.statusCode;
        message = `${errorEmojis.validation} Validation went wild! ${simplifiedError.message}`;
        errorMessages = simplifiedError.errorMessages;
    }
    else if (error.name === 'TokenExpiredError') {
        statusCode = http_status_codes_1.StatusCodes.UNAUTHORIZED;
        message = `${errorEmojis.jwt} ⏳ Token took an early retirement!`;
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [
                {
                    path: '',
                    message: 'Your session has expired. Please log in again to continue.',
                },
            ]
            : [];
    }
    else if (error.name === 'JsonWebTokenError') {
        statusCode = http_status_codes_1.StatusCodes.UNAUTHORIZED;
        message = `${errorEmojis.jwt} Token playing hide and seek!`;
        errorMessages = (error === null || error === void 0 ? void 0 : error.message)
            ? [
                {
                    path: '',
                    message: 'Your token is invalid. Please log in again to continue.',
                },
            ]
            : [];
    }
    else if (error instanceof ApiError_1.default) {
        statusCode = error.statusCode;
        message = `${errorEmojis.api} Custom Error Rollercoaster:: ${error.message}`;
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error.message,
                },
            ]
            : [];
    }
    else if (error instanceof Error) {
        message = `${errorEmojis.default} Generic Error Parade:: ${error.message}`;
        errorMessages = error.message
            ? [
                {
                    path: '',
                    message: error === null || error === void 0 ? void 0 : error.message,
                },
            ]
            : [];
    }
    res.status(statusCode).json({
        success: false,
        message,
        errorMessages,
        stack: config_1.default.node_env !== 'production' ? error === null || error === void 0 ? void 0 : error.stack : undefined,
        funFact: getFunnyErrorFact(),
    });
};
exports.default = globalErrorHandler;
