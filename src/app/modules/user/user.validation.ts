// src\app\modules\user\user.validation.ts

import { z } from 'zod';

const locationSchema = z.object({
  locationName: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

const createUserZodSchema = z.object({
  name: z.string({
    required_error: 'Name is required',
  }),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email address'),
  role: z
    .enum(['USER', 'ADMIN', 'HOST'], {
      required_error: 'Role is required',
    })
    .default('USER'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .optional(),
  phone: z.string().optional(),
  image: z.string().optional(),
  address: z
    .object({
      locationName: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  postCode: z.string().optional(),
  gender: z.enum(['male', 'female', 'both']).optional(),
  dateOfBirth: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    })
    .optional(),
});

const setPasswordZodSchema = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email('Invalid email address'),
    address: z
      .object({
        locationName: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
      .optional(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .min(8, 'Password must be at least 8 characters'),
  }),
});

const updateZodSchema = z.object({
  name: z.string().optional(),
  phone: z.string().optional(),
  address: locationSchema.optional(),
  postCode: z.string().optional(),
  country: z.string().optional(),
  image: z.string().optional(),
  dateOfBirth: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: 'Invalid date format. Use ISO 8601 format.',
    })
    .optional(),
});

const updateLocationZodSchema = z.object({
  body: z.object({
    longitude: z.string({ required_error: 'Longitude is required' }),
    latitude: z.string({ required_error: 'Latitude is required' }),
  }),
});

export const UserValidation = {
  createUserZodSchema,
  updateZodSchema,
  setPasswordZodSchema,
  updateLocationZodSchema,
};
