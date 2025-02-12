// src\app\modules\user\user.interface.ts
import { Model } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';

export type Location = {
  locationName: string;
  latitude: number;
  longitude: number;
};

export interface SetPasswordPayload {
  email: string;
  password: string;
  address?: Location;
}

export type IUser = {
  role: USER_ROLES;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  postCode: string;
  address?: Location;
  country?: string;
  appId?: string;
  fcmToken?: string;
  status:
    | 'active'
    | 'deactivate'
    | 'delete'
    | 'block'
    | 'pending'
    | 'inactive'
    | 'approved';
  verified: boolean;
  gender: 'male' | 'female' | 'both';
  dateOfBirth: Date;
  profileImage: string;
  image: string;
  onlineStatus?: boolean;
  lastActiveAt?: Date;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

export type UserModal = {
  isExistUserById(id: string): Promise<IUser | null>;
  isExistUserByEmail(email: string): Promise<IUser | null>;
  isAccountCreated(id: string): Promise<boolean>;
  isMatchPassword(password: string, hashPassword: string): Promise<boolean>;
  findByEmailWithPassword(email: string): Promise<IUser | null>;
} & Model<IUser>;
