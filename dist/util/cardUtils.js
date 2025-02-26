"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpiryDateValid = exports.validateCardNumber = exports.getLastFourDigits = exports.decryptCardNumber = exports.encryptCardNumber = void 0;
const crypto_1 = __importDefault(require("crypto"));
const encryptCardNumber = (cardNumber) => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.CARD_ENCRYPTION_KEY || '', 'hex');
    const iv = crypto_1.default.randomBytes(16);
    const cipher = crypto_1.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(cardNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};
exports.encryptCardNumber = encryptCardNumber;
const decryptCardNumber = (encryptedData) => {
    const algorithm = 'aes-256-cbc';
    const key = Buffer.from(process.env.CARD_ENCRYPTION_KEY || '', 'hex');
    const [ivHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
exports.decryptCardNumber = decryptCardNumber;
const getLastFourDigits = (cardNumber) => {
    return cardNumber.slice(-4);
};
exports.getLastFourDigits = getLastFourDigits;
const validateCardNumber = (cardNumber, cardType) => {
    var _a;
    const cardPatterns = {
        visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
        mastercard: /^5[1-5][0-9]{14}$/,
        paypal: /^[0-9]{16}$/,
    };
    return (((_a = cardPatterns[cardType]) === null || _a === void 0 ? void 0 : _a.test(cardNumber)) ||
        false);
};
exports.validateCardNumber = validateCardNumber;
const isExpiryDateValid = (expiryDate) => {
    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    const today = new Date();
    return expiry > today;
};
exports.isExpiryDateValid = isExpiryDateValid;
