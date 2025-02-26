"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generateOTP = () => {
    return Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
};
exports.default = generateOTP;
