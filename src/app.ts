import cors from 'cors';
import express, { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import router from './routes';
import { Morgan } from './shared/morgen';
import responseInterceptor from './app/middlewares/responseInterceptor';
// import { PaymentController } from './app/modules/payment/payment.controller';

const app = express();

// Morgan
app.use(Morgan.successHandler);
app.use(Morgan.errorHandler);

// CORS
app.use(
  cors({
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
  })
);

app.use(responseInterceptor);

// Webhook route (before body parser)
// app.post(
//   '/webhook',
//   express.raw({ type: 'application/json' }),
//   PaymentController.stripeWebhookController
// );

// Body parser with increased limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving
app.use(express.static('uploads'));

// Routes
app.use('/api/v1', router);

// Home route
app.get('/', (req: Request, res: Response) => {
  res.send(
    '<h1 style="text-align:center; color:#A55FEF; font-family:Verdana;">Hey Frontend Developer, How can I assist you today!</h1>'
  );
});

// Error handling
app.use(globalErrorHandler);

// Handle not found routes
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
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

export default app;
