"use strict";
// src\app\modules\user\user.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const locationSchema = zod_1.z.object({
    locationName: zod_1.z.string().min(1).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
});
const createUserZodSchema = zod_1.z.object({
    name: zod_1.z.string({
        required_error: 'Name is required',
    }),
    email: zod_1.z
        .string({
        required_error: 'Email is required',
    })
        .email('Invalid email address'),
    role: zod_1.z
        .enum(['USER', 'ADMIN', 'HOST'], {
        required_error: 'Role is required',
    })
        .default('USER'),
    password: zod_1.z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .optional(),
    phone: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    address: zod_1.z
        .object({
        locationName: zod_1.z.string().optional(),
        latitude: zod_1.z.number().optional(),
        longitude: zod_1.z.number().optional(),
    })
        .optional(),
    postCode: zod_1.z.string().optional(),
    gender: zod_1.z.enum(['male', 'female', 'both']).optional(),
    dateOfBirth: zod_1.z
        .string()
        .refine(val => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    })
        .optional(),
});
const setPasswordZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email('Invalid email address'),
        address: zod_1.z
            .object({
            locationName: zod_1.z.string().optional(),
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
        })
            .optional(),
        password: zod_1.z
            .string({
            required_error: 'Password is required',
        })
            .min(8, 'Password must be at least 8 characters'),
    }),
});
const updateZodSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    address: locationSchema.optional(),
    postCode: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    dateOfBirth: zod_1.z
        .string()
        .refine(val => !isNaN(Date.parse(val)), {
        message: 'Invalid date format. Use ISO 8601 format.',
    })
        .optional(),
});
const updateLocationZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        longitude: zod_1.z.string({ required_error: 'Longitude is required' }),
        latitude: zod_1.z.string({ required_error: 'Latitude is required' }),
    }),
});
exports.UserValidation = {
    createUserZodSchema,
    updateZodSchema,
    setPasswordZodSchema,
    updateLocationZodSchema,
};
