"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const handleZodError = (error) => {
    console.log(error.errors);
    const errorMessages = error.errors.map(el => {
        return {
            path: el.path[el.path.length - 1],
            message: el.message,
        };
    });
    const statusCode = 400;
    return {
        statusCode,
        message: '❌ Validation Error: Please check the provided data.',
        errorMessages,
    };
};
exports.default = handleZodError;
