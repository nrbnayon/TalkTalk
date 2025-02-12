import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import config from '../../config';
import ApiError from '../../errors/ApiError';
import { jwtHelper } from '../../helpers/jwtHelper';
import { User } from '../modules/user/user.model';

const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokenWithBearer = req.headers.authorization;
      const refreshToken = req.cookies?.refreshToken;

      if (!tokenWithBearer?.startsWith('Bearer ')) {
        throw new ApiError(
          StatusCodes.UNAUTHORIZED,
          'Invalid or missing token'
        );
      }

      const accessToken = tokenWithBearer.split(' ')[1];

      try {
        // Verify the access token
        const verifyUser = jwtHelper.verifyToken(
          accessToken,
          config.jwt.jwt_secret as Secret
        ) as JwtPayload;

        req.user = verifyUser;

        // Role-based authorization check
        if (roles.length && !roles.includes(verifyUser.role)) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this API"
          );
        }

        return next();
      } catch (error) {
        // Handle token expiration and refresh
        if (
          error instanceof Error &&
          error.name === 'TokenExpiredError' &&
          refreshToken
        ) {
          try {
            // Verify refresh token
            const decodedRefresh = jwt.verify(
              refreshToken,
              config.jwt.jwtRefreshSecret as Secret
            ) as JwtPayload;

            // Check if user still exists
            const user = await User.findById(decodedRefresh.id);
            if (!user) {
              throw new ApiError(StatusCodes.UNAUTHORIZED, 'User not found');
            }

            // Generate new access token
            const newAccessToken = jwtHelper.createToken(
              {
                id: user._id,
                role: user.role,
                email: user.email,
                name: user.name,
              },
              config.jwt.jwt_secret as Secret,
              config.jwt.jwt_expire_in as string
            );

            // Set new access token in response header
            res.setHeader('New-Access-Token', newAccessToken);

            // Assign new token payload to request user
            req.user = jwtHelper.verifyToken(
              newAccessToken,
              config.jwt.jwt_secret as Secret
            ) as JwtPayload;

            // Role-based authorization check again
            if (roles.length && !roles.includes(user.role)) {
              throw new ApiError(
                StatusCodes.FORBIDDEN,
                "You don't have permission to access this API"
              );
            }

            return next();
          } catch (refreshError) {
            throw new ApiError(
              StatusCodes.UNAUTHORIZED,
              'Session expired, please log in again'
            );
          }
        }

        throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid access token');
      }
    } catch (error) {
      next(error);
    }
  };

export default auth;
