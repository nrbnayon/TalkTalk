import { USER_ROLES } from "../enums/user";
export type SocialLoginType = 'GOOGLE' | 'APPLE';

export type IVerifyEmail = {
  email: string;
  oneTimeCode: number;
};

export type ILoginData = {
  email: string;
  password: string;
};


export interface ISocialLoginData {
  email?: string;
  name?: string;
  type: SocialLoginType;
  appId?: string; 
  fcmToken?: string; 
  role: USER_ROLES;
  image?: string;
}


export type IAuthResetPassword = {
  newPassword: string;
  confirmPassword: string;
};

export type IChangePassword = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
