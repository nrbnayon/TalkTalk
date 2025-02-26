"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), '.env') });
exports.default = {
    ip_address: process.env.IP_ADDRESS,
    database_url: process.env.DATABASE_URL,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
    stripe_api_secret: process.env.STRIPE_SECRET_KEY,
    google_maps: process.env.GOOGLE_MAPS,
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
    },
    apple: {
        clientId: process.env.APPLE_CLIENT_ID,
        teamId: process.env.APPLE_TEAM_ID,
        keyId: process.env.APPLE_KEY_ID,
        privateKey: process.env.APPLE_PRIVATE_KEY,
    },
    jwt: {
        jwt_secret: process.env.JWT_SECRET,
        jwt_expire_in: process.env.JWT_EXPIRE_IN,
        jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
        jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    payment: {
        stripe_secret_key: process.env.STRIPE_SECRET_KEY,
        stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
        card_encryption_key: process.env.CARD_ENCRYPTION_KEY,
    },
    email: {
        from: process.env.EMAIL_FROM,
        user: process.env.EMAIL_USER,
        port: process.env.EMAIL_PORT,
        host: process.env.EMAIL_HOST,
        pass: process.env.EMAIL_PASS,
    },
    admin: {
        email: process.env.ADMIN_EMAIL,
        password: process.env.ADMIN_PASSWORD,
    },
    security: {
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
            max: parseInt(process.env.RATE_LIMIT_MAX || '10'),
            message: '🚫 Whoa there! Too many login attempts with same ip. Take a coffee break ☕ and try again in 15 minutes!',
            standardHeaders: true,
            legacyHeaders: false,
        },
    },
};
