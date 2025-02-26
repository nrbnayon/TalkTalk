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
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const http_status_codes_1 = require("http-status-codes");
const config_1 = __importDefault(require("../config"));
function sendEmail(email, subject, text) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transporter = nodemailer_1.default.createTransport({
                host: config_1.default.email.host,
                port: Number(config_1.default.email.port),
                secure: false,
                auth: {
                    user: config_1.default.email.user,
                    pass: config_1.default.email.pass,
                },
            });
            const info = yield transporter.sendMail({
                from: `"PET-CLOTH" ${config_1.default.email.from}`, // Sender address
                to: email, // Recipient's email
                subject: `${subject}`, // Subject line
                text: text, // Plain text version
                html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Promotional Email</title>
          <style>
            /* Reset styles */
            body, html {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
    
            /* Container styles */
            .container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              border: 1px solid #ccc;
              border-radius: 10px;
              background-color: #fff;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
    
            /* Header styles */
            .header {
              background-color: #caccd1; /* New blue background */
              padding: 20px;
              border-radius: 10px 10px 0 0;
              color: #000000;
              text-align: center;
            }
            .header h1 {
              margin: 0;
            }
    
            /* Content styles */
            .content {
              padding: 20px;
              text-align: left;
              font-size: 16px;
              line-height: 1.6;
              color: #333;
            }
    
            /* Footer styles */
            .footer {
              background-color: #caccd1; /* New green background */
              padding: 15px;
              border-radius: 0 0 10px 10px;
              text-align: center;
              color: #000000;
              font-size: 12px;
            }
    
            /* Button styles */
            .btn {
              display: inline-block;
              padding: 10px 20px;
              margin-top: 10px;
              background-color: #FF6600;
              color: #fff;
              text-decoration: none;
              border-radius: 5px;
              font-weight: bold;
            }
    
            /* Responsive styles */
            @media (max-width: 600px) {
              .container {
                padding: 10px;
              }
              .content {
                font-size: 14px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${subject}</h1>
            </div>
            <div class="content">
              <p>${text}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} FARBABYZ-DRIP. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
            });
            return info;
        }
        catch (error) {
            throw new ApiError_1.default(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Error sending email');
        }
    });
}
