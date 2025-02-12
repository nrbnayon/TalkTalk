import { ZodError } from 'zod';
import { IErrorMessage } from '../types/errors.types';

const handleZodError = (error: ZodError) => {
  console.log(error.errors);
  const errorMessages: IErrorMessage[] = error.errors.map(el => {
    return {
      path: el.path[el.path.length - 1],
      message: el.message,
    };
  });

  const statusCode = 400;
  return {
    statusCode,
    message: '❌ Validation Error: Please check the provided data.',
    errorMessages,
  };
};

export default handleZodError;
