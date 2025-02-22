// src\app\modules\user\user.service.ts
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import mongoose, { SortOrder } from 'mongoose';
import bcrypt from 'bcrypt';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import generateOTP from '../../../util/generateOTP';
import colors from 'colors';
import { IUser, SetPasswordPayload } from './user.interface';
import { User } from './user.model';
import { sendNotifications } from '../../../helpers/notificationHelper';
import unlinkFile from '../../../shared/unlinkFile';
import { logger } from '../../../shared/logger';
import config from '../../../config';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { INotification } from '../notification/notification.interface';

const createUserIntoDB = async (payload: IUser) => {
  const existingUser = await User.findOne({ email: payload.email });
  if (existingUser) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'An account with this email already exists. Please use a different email address.'
    );
  }

  try {
    const session = await mongoose.startSession();
    let result: any;

    await session.withTransaction(async () => {
      if (!payload.role) payload.role = USER_ROLES.USER;
      if (!payload.password) payload.password = config.admin.password;

      result = await User.create([payload], { session });
      result = result[0];

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Failed to create user account. Please try again.'
        );
      }

      console.log('User created successfully::', result);

      // Generate and send OTP
      const otp = generateOTP();
      const emailValues = {
        name: result.name,
        otp,
        email: result.email,
      };

      const accountEmailTemplate = emailTemplate.createAccount(emailValues);
      await emailHelper.sendEmail(accountEmailTemplate);

      // Update user authentication details
      const authentication = {
        oneTimeCode: otp,
        expireAt: new Date(Date.now() + 3 * 60000),
      };

      const updatedUser = await User.findOneAndUpdate(
        { _id: result._id },
        {
          $set: {
            authentication,
            status: 'pending',
            verified: false,
          },
        },
        { new: true, session }
      );

      if (!updatedUser) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to update user authentication details'
        );
      }
    });

    await session.endSession();

    return {
      email: result.email,
      status: 'success',
      message:
        'Registration successful. Please check your email for verification code.',
    };
  } catch (error) {
    if (error instanceof Error) {
      const mongoError = error as any;
      if (mongoError.code === 11000) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'An account with this email already exists. Please use a different email address.'
        );
      }
    }

    logger.error('User creation error:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to create user account. Please try again later.'
    );
  }
};

const setUserNewPassword = async (payload: SetPasswordPayload) => {
  const { email, password, address } = payload;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  if (!user.verified) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Please verify your email first'
    );
  }

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds)
  );

  const session = await mongoose.startSession();
  let updatedUser;

  try {
    await session.withTransaction(async () => {
      // Update user with password and set status to active
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          password: hashedPassword,
          address,
          status: 'active',
        },
        { new: true, session }
      ).select('-password');

      if (!updatedUser) {
        throw new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Failed to update user'
        );
      }

      // Send admin notifications since the user registration is now complete
      const adminUsers = await User.find({ role: USER_ROLES.ADMIN }).select(
        '_id'
      );

      // Create notifications for each admin
      const notificationPromises = adminUsers.map(admin => {
        const notificationData: Partial<INotification> = {
          message: `New ${user.role.toLowerCase()}, Name: ${
            user.name
          }, Email: (${user.email}) has completed registration.`,
          type: 'ADMIN',
          receiver: admin._id,
          metadata: {
            userId: user._id,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            action: `new_${user.role.toLowerCase()}_registration_completed`,
          },
        };
        return sendNotifications(notificationData); // send notification using socketIO or other notification system
        // return NotificationService.createNotification(notificationData);
      });

      await Promise.all(notificationPromises);
    });

    await session.endSession();

    // Generate access token after successful password set
    const accessToken = jwtHelper.createToken(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
      },
      config.jwt.jwt_secret as Secret,
      config.jwt.jwt_expire_in as string
    );

    return {
      accessToken,
      data: updatedUser,
    };
  } catch (error) {
    await session.endSession();
    logger.error('Set password error:', error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Failed to set password. Please try again later.'
    );
  }
};

const getAllUsers = async (query: Record<string, unknown>) => {
  const {
    searchTerm,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    order = 'desc',
    ...filterData
  } = query;

  // Search conditions
  const conditions: any[] = [];

  if (searchTerm) {
    const cleanedSearchTerm = searchTerm.toString().replace(/[+\s-]/g, '');

    conditions.push({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        {
          phone: {
            $regex: cleanedSearchTerm,
            $options: 'i',
          },
        },
      ],
    });
  }

  // Add filter conditions
  if (Object.keys(filterData).length > 0) {
    const filterConditions = Object.entries(filterData).map(
      ([field, value]) => ({
        [field]: value,
      })
    );
    conditions.push({ $and: filterConditions });
  }

  const whereConditions = conditions.length ? { $and: conditions } : {};

  // Pagination setup
  const currentPage = Number(page);
  const pageSize = Number(limit);
  const skip = (currentPage - 1) * pageSize;

  // Sorting setup
  const sortOrder = order === 'desc' ? -1 : 1;
  const sortCondition: { [key: string]: SortOrder } = {
    [sortBy as string]: sortOrder,
  };

  // Query the database
  const [users, total, genderStats] = await Promise.all([
    User.find(whereConditions)
      .sort(sortCondition)
      .skip(skip)
      .limit(pageSize)
      .lean<IUser[]>(),
    User.countDocuments(whereConditions),
    User.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Calculate gender ratios
  const totalUsers = genderStats.reduce((acc, curr) => acc + curr.count, 0);
  const genderRatio = genderStats.reduce((acc, { _id, count }) => {
    if (_id) {
      acc[_id] = {
        count,
        percentage: ((count / totalUsers) * 100).toFixed(2) + '%',
      };
    }
    return acc;
  }, {} as Record<string, { count: number; percentage: string }>);

  // Format the updatedAt field
  const formattedUsers = users?.map(user => ({
    ...user,
    updatedAt: user.updatedAt
      ? new Date(user.updatedAt).toISOString().split('T')[0]
      : null,
  }));

  // Meta information for pagination and gender stats
  return {
    meta: {
      total,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize),
      currentPage,
      genderRatio,
    },
    result: formattedUsers,
  };
};

const getUserProfileFromDB = async (
  user: JwtPayload
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.findById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>
): Promise<
  Partial<IUser | null> | { verificationRequired: boolean; message: string }
> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);

  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  // Check if email or phone is being updated
  const needsVerification = payload.email || payload.phone;

  if (needsVerification) {
    // Check if new email already exists
    if (payload.email) {
      const emailExists = await User.findOne({
        email: payload.email,
        _id: { $ne: id }, // Exclude current user
      });

      if (emailExists) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'Email already exists. Please use a different email address.'
        );
      }
    }

    // Check if new phone already exists
    if (payload.phone) {
      const phoneExists = await User.findOne({
        phone: payload.phone,
        _id: { $ne: id }, // Exclude current user
      });

      if (phoneExists) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          'Phone number already exists. Please use a different number.'
        );
      }
    }

    // Generate OTP for verification
    const otp = generateOTP();
    const authentication = {
      oneTimeCode: otp,
      expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes
      isResetPassword: false,
    };

    // Store the pending changes and authentication data
    const pendingChanges = {
      ...(payload.email && { email: payload.email }),
      ...(payload.phone && { phone: payload.phone }),
      authentication,
      verified: false,
      status: 'pending',
    };

    // Send OTP to new email if email is being updated
    if (payload.email) {
      const emailValues = {
        name: isExistUser.name,
        otp,
        email: payload.email,
      };
      const verificationEmailTemplate =
        emailTemplate.createAccount(emailValues);
      await emailHelper.sendEmail(verificationEmailTemplate);
    }

    // Update user with pending changes
    await User.findOneAndUpdate({ _id: id }, pendingChanges, { new: true });

    return {
      verificationRequired: true,
      message:
        'Please verify your new contact information with the OTP sent to your email.',
    };
  }

  // Handle image update
  if (payload.image && isExistUser.image) {
    unlinkFile(isExistUser.image);
  }

  // Process normal update without verification
  const updateDoc = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  return updateDoc;
};

const getSingleUser = async (id: string): Promise<IUser | null> => {
  const result = await User.findById(id);
  return result;
};

const getOnlineUsers = async () => {
  try {
    const onlineUsers = await User.find({
      onlineStatus: true,
      // lastActiveAt: {
      //   $gte: new Date(Date.now() - 5 * 60 * 1000),
      // },
    }).select('name email profileImage');

    logger.info(
      colors.green(`[UserService] Retrieved ${onlineUsers.length} online users`)
    );

    return onlineUsers;
  } catch (error) {
    logger.error(
      colors.red('[UserService] Error retrieving online users:'),
      error
    );
    throw error;
  }
};

const updateUserOnlineStatus = async (userId: string, isOnline: boolean) => {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      {
        onlineStatus: isOnline,
        lastActiveAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    logger.info(
      colors.green(
        `[UserService] User ${userId} online status updated to ${isOnline}`
      )
    );

    return user;
  } catch (error) {
    logger.error(
      colors.red(`[UserService] Error updating user ${userId} online status:`),
      error
    );
    throw error;
  }
};

export const UserService = {
  createUserIntoDB,
  setUserNewPassword,
  getUserProfileFromDB,
  updateProfileToDB,
  getAllUsers,
  getSingleUser,
  getOnlineUsers,
  updateUserOnlineStatus,
};
