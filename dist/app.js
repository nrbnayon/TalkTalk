"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const http_status_codes_1 = require("http-status-codes");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const routes_1 = __importDefault(require("./routes"));
const morgen_1 = require("./shared/morgen");
const responseInterceptor_1 = __importDefault(require("./app/middlewares/responseInterceptor"));
// import { PaymentController } from './app/modules/payment/payment.controller';
const app = (0, express_1.default)();
// Morgan
app.use(morgen_1.Morgan.successHandler);
app.use(morgen_1.Morgan.errorHandler);
// CORS
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://192.168.10.19:3000',
        'http://192.168.10.18:3030',
        'http://192.168.10.19:3030',
        'http://10.0.70.173:5173',
        'http://10.0.70.172:5173',
        'http://10.0.70.173:50262',
    ],
    credentials: true,
}));
app.use(responseInterceptor_1.default);
// Webhook route (before body parser)
// app.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   PaymentController.stripeWebhookController
// );
// Body parser with increased limits
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Static file serving
app.use(express_1.default.static('uploads'));
// Routes
app.use('/api/v1', routes_1.default);
// Home route
app.get('/', (req, res) => {
    res.send('<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>');
});
// Error handling
app.use(globalErrorHandler_1.default);
// Handle not found routes
app.use((req, res) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: '❌ API Not Found',
        errorMessages: [
            {
                path: req.originalUrl,
                message: "🚫 API DOESN'T EXIST",
            },
        ],
    });
});
exports.default = app;
