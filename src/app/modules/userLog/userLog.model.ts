import { Schema, model } from 'mongoose';
import { IUserLog } from './userLog.interface';

const userLogSchema = new Schema<IUserLog>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
    },
    device: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    location: {
      ip: {
        type: String,
        required: true,
      },
      zip: String,
      region: String,
      city: String,
      country: String,
      regionName: String,
      latitude: Number,
      longitude: Number,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
    logoutTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'logged_out'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

export const UserLog = model<IUserLog>('UserLog', userLogSchema);
