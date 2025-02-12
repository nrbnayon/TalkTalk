
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, z } from 'zod';

// Create a type that accepts both plain Zod objects and refined schemas
type ZodSchema = z.ZodType<any, any>;

const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
        cookies: req.cookies,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation Error',
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

export default validateRequest;

// import { NextFunction, Request, Response } from 'express';
// import { AnyZodObject } from 'zod';

// const validateRequest =
//   (schema: AnyZodObject) =>
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       await schema.parseAsync({
//         body: req.body,
//         params: req.params,
//         query: req.query,
//         cookies: req.cookies,
//       });
//       next();
//     } catch (error) {
//       next(error);
//     }
//   };

// export default validateRequest;