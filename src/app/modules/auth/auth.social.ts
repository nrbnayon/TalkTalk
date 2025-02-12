// // src/types/auth.ts
// export interface ISocialLoginData {
//   email: string;
//   name?: string;
//   type: 'social';
//   appId: string;
//   fcmToken?: string;
//   role: string;
//   image?: string;
// }

// // src/app/modules/auth/auth.service.ts
// import { OAuth2Client } from 'google-auth-library';
// import { StatusCodes } from 'http-status-codes';
// import jwt from 'jsonwebtoken';
// import AppleAuth from 'apple-auth';
// import config from '../../../config';
// import ApiError from '../../../errors/ApiError';
// import { User } from '../user/user.model';
// import { ISocialLoginData } from '../../../types/auth';
// import { startSession } from 'mongoose';
// import { jwtHelper } from '../../../helpers/jwtHelper';

// const googleClient = new OAuth2Client(config.google.clientId);

// const verifySocialToken = async (
//   provider: 'google' | 'apple',
//   token: string
// ): Promise<{ email: string; name?: string }> => {
//   try {
//     if (provider === 'google') {
//       const ticket = await googleClient.verifyIdToken({
//         idToken: token,
//         audience: config.google.clientId,
//       });
//       const payload = ticket.getPayload();
//       if (!payload) throw new Error('Invalid token payload');
      
//       return {
//         email: payload.email!,
//         name: payload.name,
//       };
//     } else if (provider === 'apple') {
//       const appleAuth = new AppleAuth({
//         client_id: config.apple.clientId,
//         team_id: config.apple.teamId,
//         key_id: config.apple.keyId,
//         private_key: config.apple.privateKey,
//       });

//       const response = await appleAuth.accessToken(token);
//       const decoded = jwt.decode(response.id_token) as any;
      
//       return {
//         email: decoded.email,
//         name: decoded.email.split('@')[0], // Use email prefix as name if not provided
//       };
//     }
//     throw new Error('Invalid provider');
//   } catch (error) {
//     throw new ApiError(
//       StatusCodes.UNAUTHORIZED,
//       'Failed to verify social token'
//     );
//   }
// };

// const userSocialLogin = async (payload: ISocialLoginData) => {
//   const { email, appId, role, type, fcmToken, name, image } = payload;

//   if (type !== 'social') {
//     throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid login type');
//   }

//   const session = await startSession();
//   try {
//     session.startTransaction();

//     // Check if user exists
//     let user = await User.findOne({ email });

//     if (!user) {
//       // Create new user
//       const userData = {
//         email,
//         name: name || email.split('@')[0],
//         role,
//         verified: true,
//         status: 'active',
//         appId,
//         fcmToken,
//         image: image || undefined, // Use default image from schema if not provided
//         onlineStatus: true,
//         lastActiveAt: new Date(),
//       };

//       const [newUser] = await User.create([userData], { session });
//       if (!newUser) {
//         throw new ApiError(
//           StatusCodes.INTERNAL_SERVER_ERROR,
//           'Failed to create user'
//         );
//       }
//       user = newUser;
//     } else {
//       // Update existing user's social credentials
//       user.appId = appId;
//       user.fcmToken = fcmToken;
//       user.onlineStatus = true;
//       user.lastActiveAt = new Date();
//       await user.save({ session });
//     }

//     // Generate tokens
//     const accessToken = jwtHelper.createToken(
//       {
//         id: user._id,
//         role: user.role,
//         email: user.email,
//         name: user.name,
//       },
//       config.jwt.jwt_secret as string,
//       config.jwt.jwt_expire_in as string
//     );

//     const refreshToken = jwtHelper.createToken(
//       {
//         id: user._id,
//         role: user.role,
//         email: user.email,
//       },
//       config.jwt.jwtRefreshSecret as string,
//       config.jwt.jwtRefreshExpiresIn as string
//     );

//     await session.commitTransaction();
//     return { accessToken, refreshToken, user };
//   } catch (error) {
//     await session.abortTransaction();
//     throw error;
//   } finally {
//     await session.endSession();
//   }
// };

// export const AuthService = {
//   userSocialLogin,
//   // ... other existing services
// };

// // src/app/modules/auth/auth.controller.ts
// import { Request, Response } from 'express';
// import catchAsync from '../../../shared/catchAsync';
// import { AuthService } from './auth.service';
// import { StatusCodes } from 'http-status-codes';
// import sendResponse from '../../../shared/sendResponse';

// const loginUserForSocial = catchAsync(async (req: Request, res: Response) => {
//   const { ...loginData } = req.body;
//   const result = await AuthService.userSocialLogin(loginData);

//   // Set refresh token in cookie
//   res.cookie('refreshToken', result.refreshToken, {
//     secure: config.node_env === 'production',
//     httpOnly: true,
//   });

//   sendResponse(res, {
//     success: true,
//     statusCode: StatusCodes.OK,
//     message: 'User login successfully',
//     data: {
//       accessToken: result.accessToken,
//       user: result.user,
//     },
//   });
// });

// export const AuthController = {
//   loginUserForSocial,
//   // ... other existing controllers
// };

// // src/config/index.ts
// export default {
//   // ... existing config
//   google: {
//     clientId: process.env.GOOGLE_CLIENT_ID,
//   },
//   apple: {
//     clientId: process.env.APPLE_CLIENT_ID,
//     teamId: process.env.APPLE_TEAM_ID,
//     keyId: process.env.APPLE_KEY_ID,
//     privateKey: process.env.APPLE_PRIVATE_KEY,
//   },
// };

// // .env additions
// GOOGLE_CLIENT_ID=your_google_client_id
// APPLE_CLIENT_ID=your_apple_client_id
// APPLE_TEAM_ID=your_apple_team_id
// APPLE_KEY_ID=your_apple_key_id
// APPLE_PRIVATE_KEY=your_apple_private_key


// POST /api/v1/auth/login-for-social
// Content-Type: application/json

// {
//     "email": "user@example.com",
//     "name": "John Doe",
//     "type": "social",
//     "appId": "google-or-apple-id",
//     "fcmToken": "firebase-cloud-messaging-token",
//     "role": "user",
//     "image": "optional-profile-image-url"
// }