// src\app\modules\user\user.model.ts
import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IUser, UserModal } from './user.interface';

const locationSchema = new Schema({
  locationName: { type: String },
  latitude: { type: Number },
  longitude: { type: Number },
});

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      select: 0,
      minlength: 8,
    },
    phone: {
      type: String,
    },
    postCode: {
      type: String,
    },
    address: { type: locationSchema },
    country: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'active',
        'deactivate',
        'delete',
        'block',
        'pending',
        'inactive',
        'approved',
      ],
      default: 'active',
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'both'],
    },
    dateOfBirth: {
      type: Date,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
      default:
        'https://www.shutterstock.com/shutterstock/photos/1153673752/display_1500/stock-vector-profile-placeholder-image-gray-silhouette-no-photo-1153673752.jpg',
    },
    appId: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    onlineStatus: {
      type: Boolean,
      default: false,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
  },
  { timestamps: true }
);

// Static methods
userSchema.statics.isExistUserById = async function (
  id: string
): Promise<IUser | null> {
  return await this.findById(id);
};

userSchema.statics.isExistUserByEmail = async function (
  email: string
): Promise<IUser | null> {
  return await this.findOne({ email });
};

userSchema.statics.isAccountCreated = async function (
  id: string
): Promise<boolean> {
  const isUserExist = await this.findById(id);
  return !!isUserExist;
};

userSchema.statics.isMatchPassword = async function (
  password: string,
  hashPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashPassword);
};

userSchema.statics.findByEmailWithPassword = async function (
  email: string
): Promise<IUser | null> {
  return await this.findOne({ email }).select('+password');
};

// Middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exists!');
  }

  if (this.password) {
    try {
      const hashedPassword = await bcrypt.hash(
        this.password,
        Number(config.bcrypt_salt_rounds)
      );
      this.password = hashedPassword;
    } catch (error) {
      return next(
        new ApiError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          'Error hashing password'
        )
      );
    }
  }

  next();
});

export const User = model<IUser, UserModal>('User', userSchema);