// src\app\modules\auth\auth.service.ts
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import {
  IAuthResetPassword,
  IChangePassword,
  ILoginData,
  ISocialLoginData,
  IVerifyEmail,
} from '../../../types/auth';
import cryptoToken from '../../../util/cryptoToken';
import generateOTP from '../../../util/generateOTP';

import { User } from '../user/user.model';
import { ResetToken } from '../resetToken/resetToken.model';
import { UserLogService } from '../userLog/userLog.service';
import { Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import { startSession } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(config.google.clientId);

//login
const loginUserFromDB = async (payload: ILoginData) => {
  const { email, password } = payload;
  const isExistUser = await User.findOne({ email }).select('+password');
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //check verified and status
  if (!isExistUser.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please verify your account, then try to login again'
    );
  }

  //check user status
  if (isExistUser.status === 'delete') {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'You don’t have permission to access this content.It looks like your account has been deactivated.'
    );
  }

  //check match password
  if (
    !password ||
    !(await User.isMatchPassword(password, isExistUser.password as string))
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
  }

  //create token
  const accessToken = jwtHelper.createToken(
    {
      id: isExistUser._id,
      role: isExistUser.role,
      email: isExistUser.email,
      name: isExistUser.name,
    },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  //create token
  const refreshToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwtRefreshSecret as Secret,
    config.jwt.jwtRefreshExpiresIn as string
  );

  return { accessToken, refreshToken };
};

// social login

const loginUserSocial = async (payload: ISocialLoginData) => {
  const { email, name, appId, role, type, fcmToken, image } = payload;

  if (!Object.values(USER_ROLES).includes(role)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user role');
  }

  // Validate login type specific requirements
  if (type === 'GOOGLE' && !fcmToken) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'FCM token is required for Google login'
    );
  }

  if (type === 'APPLE' && !appId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'App ID is required for Apple login'
    );
  }

  const session = await startSession();
  let user: any | null;

  try {
    session.startTransaction();

    user = await User.findOne({ email });

    if (!user) {
      if (role === USER_ROLES.ADMIN) {
        throw new ApiError(
          StatusCodes.FORBIDDEN,
          'Cannot create admin user through social login'
        );
      }

      const userData = {
        name,
        email,
        role,
        verified: true,
        image:
          image ||
          'https://www.shutterstock.com/shutterstock/photos/1153673752/display_1500/stock-vector-profile-placeholder-image-gray-silhouette-no-photo-1153673752.jpg',
        status: 'active',
        onlineStatus: true,
        lastActiveAt: new Date(),
        address: {
          locationName: '',
          latitude: null,
          longitude: null,
        },
      };

      // Add login type specific fields
      if (type === 'GOOGLE') {
        Object.assign(userData, { fcmToken });
      } else if (type === 'APPLE') {
        Object.assign(userData, { appId });
      }

      const [newUser] = await User.create([userData], { session });

      if (!newUser) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to create user'
        );
      }

      user = newUser;
    } else {
      if (user.role !== role) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'User exists with different role'
        );
      }

      // Update based on login type
      if (type === 'GOOGLE') {
        user.fcmToken = fcmToken;
      } else if (type === 'APPLE') {
        user.appId = appId;
      }

      user.onlineStatus = true;
      user.lastActiveAt = new Date();
      await user.save({ session });
    }

    await session.commitTransaction();

    const accessToken = jwtHelper.createToken(
      {
        id: user._id,
        role: user.role as USER_ROLES,
        email: user.email,
        name: user.name,
      },
      config.jwt.jwt_secret as Secret,
      '7d'
    );

    const refreshToken = jwtHelper.createToken(
      {
        id: user._id,
        role: user.role as USER_ROLES,
        email: user.email,
      },
      config.jwt.jwtRefreshSecret as Secret,
      '15d'
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role as USER_ROLES,
        image: user.image,
        verified: user.verified,
        status: user.status,
        loginType: type,
      },
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};
//forget password
const forgetPasswordToDB = async (email: string) => {
  const isExistUser = await User.isExistUserByEmail(email);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //send mail
  const otp = generateOTP();
  const value = {
    otp,
    email: isExistUser.email,
  };
  const forgetPassword = emailTemplate.resetPassword(value);
  emailHelper.sendEmail(forgetPassword);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate({ email }, { $set: { authentication } });
};

//verify email
const verifyEmailToDB = async (payload: IVerifyEmail) => {
  const { email, oneTimeCode } = payload;

  // Find user by email
  const isExistUser = await User.findOne({ email }).select('+authentication');

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Check if the authentication object exists
  if (!isExistUser.authentication) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Authentication details not found for the user.'
    );
  }

  // Validate if oneTimeCode is provided
  if (!oneTimeCode) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please provide the OTP. Check your email for the code.'
    );
  }

  // Validate the oneTimeCode
  if (isExistUser.authentication.oneTimeCode !== Number(oneTimeCode)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'You provided the wrong OTP.');
  }

  // Check if OTP has expired
  const currentDate = new Date();
  if (
    !isExistUser.authentication.expireAt ||
    currentDate > isExistUser.authentication.expireAt
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'OTP has expired. Please request a new one.'
    );
  }

  let message;
  let data;

  if (!isExistUser.verified) {
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        verified: true,
        // status: 'active',
        authentication: { oneTimeCode: null, expireAt: null },
      }
    );
    message =
      'Your email has been successfully verified. Now set your strong password for your account fully activated.';
  } else {
    await User.findOneAndUpdate(
      { _id: isExistUser._id },
      {
        authentication: {
          isResetPassword: true,
          oneTimeCode: null,
          expireAt: null,
        },
      }
    );

    // Create reset token
    const createToken = cryptoToken();
    await ResetToken.create({
      user: isExistUser._id,
      token: createToken,
      expireAt: new Date(Date.now() + 5 * 60000),
    });
    message =
      'Verification Successful: Please securely store and utilize this code for resetting your password.';
    data = createToken;
  }

  return { data, message };
};

//forget password
const resetPasswordToDB = async (
  token: string,
  payload: IAuthResetPassword
) => {
  // console.log('object', token, payload);
  const { newPassword, confirmPassword } = payload;
  //isExist token
  const isExistToken = await ResetToken.isExistToken(token);
  if (!isExistToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
  }

  //user permission check
  const isExistUser = await User.findById(isExistToken.user).select(
    '+authentication'
  );
  if (!isExistUser?.authentication?.isResetPassword) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "You don't have permission to change the password. Please click again to 'Forgot Password'"
    );
  }

  //validity check
  const isValid = await ResetToken.isExpireToken(token);
  if (!isValid) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Token expired, Please click again to the forget password'
    );
  }

  //check password
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "New password and Confirm password doesn't match!"
    );
  }

  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updateData = {
    password: hashPassword,
    authentication: {
      isResetPassword: false,
    },
  };

  await User.findOneAndUpdate({ _id: isExistToken.user }, updateData, {
    new: true,
  });
};

const changePasswordToDB = async (
  user: JwtPayload,
  payload: IChangePassword
) => {
  const { currentPassword, newPassword, confirmPassword } = payload;
  const isExistUser = await User.findById(user.id).select('+password');
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  //current password match
  if (
    currentPassword &&
    !User.isMatchPassword(currentPassword, isExistUser.password as string)
  ) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
  }

  //newPassword and current password
  if (currentPassword === newPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please give different password from current password'
    );
  }
  //new password and confirm password check
  if (newPassword !== confirmPassword) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Password and Confirm password doesn't matched"
    );
  }

  //hash password
  const hashPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  const updateData = {
    password: hashPassword,
  };
  await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
};

const deleteAccountToDB = async (user: JwtPayload) => {
  const result = await User.findByIdAndDelete(user?.id);
  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No User found');
  }

  return result;
};

const newAccessTokenToUser = async (token: string) => {
  // Check if the token is provided
  if (!token) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Token is required!');
  }

  const verifyUser = jwtHelper.verifyToken(
    token,
    config.jwt.jwtRefreshSecret as Secret
  );

  const isExistUser = await User.findById(verifyUser?.id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Unauthorized access');
  }

  //create token
  const accessToken = jwtHelper.createToken(
    { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as string
  );

  return { accessToken };
};

const resendVerificationEmailToDB = async (email: string) => {
  // console.log('Email from resendVerificationEmailToDB: ', email);
  // Find the user by email
  const existingUser: any = await User.findOne({ email: email }).lean();

  if (!existingUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'User with this email does not exist!'
    );
  }

  if (existingUser?.isVerified) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already verified!');
  }

  // Generate OTP and prepare email
  const otp = generateOTP();
  const emailValues = {
    name: existingUser.firstName,
    otp,
    email: existingUser.email,
  };
  const accountEmailTemplate = emailTemplate.createAccount(emailValues);

  try {
    // Send email and handle potential errors
    await emailHelper.sendEmail(accountEmailTemplate);

    // Update user with authentication details
    const authentication = {
      oneTimeCode: otp,
      expireAt: new Date(Date.now() + 3 * 60000),
    };

    await User.findOneAndUpdate(
      { email: email },
      { $set: { authentication } },
      { new: true }
    );

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to send OTP email'
    );
  }
};

const logoutUser = async (
  userId: string,
  res: Response<any, Record<string, any>>
) => {
  const result = await User.findByIdAndUpdate(userId, {
    $set: {
      onlineStatus: false,
      lastActiveAt: new Date(),
    },
  });

  if (!userId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'User with this id does not exist!'
    );
  }

  // Update UserLog and clear cookies
  const userLogRemove = await UserLogService.updateLogoutTime(userId, res);

  return result;
};

export const AuthService = {
  verifyEmailToDB,
  loginUserFromDB,
  loginUserSocial,
  forgetPasswordToDB,
  resetPasswordToDB,
  changePasswordToDB,
  deleteAccountToDB,
  newAccessTokenToUser,
  resendVerificationEmailToDB,
  logoutUser,
};
