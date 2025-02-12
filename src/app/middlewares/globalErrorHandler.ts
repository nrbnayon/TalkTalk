import { ErrorRequestHandler } from 'express';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import handleValidationError from '../../errors/handleValidationError';
import handleZodError from '../../errors/handleZodError';
import { errorLogger } from '../../shared/logger';
import { IErrorMessage } from '../../types/errors.types';
import { StatusCodes } from 'http-status-codes';

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

const getFunnyErrorFact = (): string => {
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

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Logging with a touch of humor
  const logMessage = `🎪 Error Circus:: ${
    funnyPhrases[Math.floor(Math.random() * funnyPhrases.length)]
  }`;

  config.node_env === 'development'
    ? console.log('🚨 globalErrorHandler ~~ ', logMessage, error)
    : errorLogger.error('🚨 globalErrorHandler ~~ ', logMessage, error);

  let statusCode = 500;
  let message = `${errorEmojis.server} Something went wrong`;
  let errorMessages: IErrorMessage[] = [];

  if (error.name === 'ZodError') {
    const simplifiedError = handleZodError(error);
    statusCode = simplifiedError.statusCode;
    message = `${errorEmojis.zod} Zod's crystal ball found some issues:: ${simplifiedError.message}`;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === 'ValidationError') {
    const simplifiedError = handleValidationError(error);
    statusCode = simplifiedError.statusCode;
    message = `${errorEmojis.validation} Validation went wild! ${simplifiedError.message}`;
    errorMessages = simplifiedError.errorMessages;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = `${errorEmojis.jwt} ⏳ Token took an early retirement!`;
    errorMessages = error?.message
      ? [
          {
            path: '',
            message:
              'Your session has expired. Please log in again to continue.',
          },
        ]
      : [];
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = StatusCodes.UNAUTHORIZED;
    message = `${errorEmojis.jwt} Token playing hide and seek!`;
    errorMessages = error?.message
      ? [
          {
            path: '',
            message: 'Your token is invalid. Please log in again to continue.',
          },
        ]
      : [];
  } else if (error instanceof ApiError) {
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
  } else if (error instanceof Error) {
    message = `${errorEmojis.default} Generic Error Parade:: ${error.message}`;
    errorMessages = error.message
      ? [
          {
            path: '',
            message: error?.message,
          },
        ]
      : [];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorMessages,
    stack: config.node_env !== 'production' ? error?.stack : undefined,
    funFact: getFunnyErrorFact(),
  });
};

export default globalErrorHandler;
