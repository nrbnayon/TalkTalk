// src/app/middlewares/responseInterceptor.ts
import { Request, Response, NextFunction } from 'express';

const responseInterceptor = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const originalJson = res.json;

  res.json = function (body) {
    const newAccessToken = res.getHeader('New-Access-Token');

    if (newAccessToken) {
      // Ensure body is an object before modifying it
      if (typeof body !== 'object' || body === null) {
        body = { data: { newAccessToken } };
      } else {
        if (!body.data || typeof body.data !== 'object') {
          body.data = {};
        }
        body.data.newAccessToken = newAccessToken;
      }

      res.removeHeader('New-Access-Token');
    }

    return originalJson.call(this, body);
  };

  next();
};

export default responseInterceptor;
