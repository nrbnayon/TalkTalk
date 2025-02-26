"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
// src\app\modules\user\user.model.ts
const bcrypt_1 = __importDefault(require("bcrypt"));
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const config_1 = __importDefault(require("../../../config"));
const user_1 = require("../../../enums/user");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const locationSchema = new mongoose_1.Schema({
    locationName: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
});
const userSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: Object.values(user_1.USER_ROLES),
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
        default: 'https://www.shutterstock.com/shutterstock/photos/1153673752/display_1500/stock-vector-profile-placeholder-image-gray-silhouette-no-photo-1153673752.jpg',
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
}, { timestamps: true });
// Static methods
userSchema.statics.isExistUserById = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findById(id);
    });
};
userSchema.statics.isExistUserByEmail = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email });
    });
};
userSchema.statics.isAccountCreated = function (id) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserExist = yield this.findById(id);
        return !!isUserExist;
    });
};
userSchema.statics.isMatchPassword = function (password, hashPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(password, hashPassword);
    });
};
userSchema.statics.findByEmailWithPassword = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield this.findOne({ email }).select('+password');
    });
};
// Middleware
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!this.isModified('password')) {
            return next();
        }
        const isExist = yield exports.User.findOne({ email: this.email });
        if (isExist) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Email already exists!');
        }
        if (this.password) {
            try {
                const hashedPassword = yield bcrypt_1.default.hash(this.password, Number(config_1.default.bcrypt_salt_rounds));
                this.password = hashedPassword;
            }
            catch (error) {
                return next(new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error hashing password'));
            }
        }
        next();
    });
});
exports.User = (0, mongoose_1.model)('User', userSchema);
