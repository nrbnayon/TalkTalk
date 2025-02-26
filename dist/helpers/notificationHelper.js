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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotifications = void 0;
const notification_model_1 = require("../app/modules/notification/notification.model");
const logger_1 = require("../shared/logger");
var NotificationType;
(function (NotificationType) {
    NotificationType["ADMIN"] = "ADMIN";
    NotificationType["HOST"] = "HOST";
    NotificationType["USER"] = "USER";
    NotificationType["PAYMENT"] = "PAYMENT";
})(NotificationType || (NotificationType = {}));
const sendNotifications = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield notification_model_1.Notification.create(data);
        const socketIo = global.io;
        if (!socketIo) {
            logger_1.logger.error('Socket.io instance not found');
            return result;
        }
        const channel = data.type in NotificationType
            ? `get-notification::${data.type}`
            : `get-notification::${data.receiver}`;
        socketIo.emit(channel, result);
        logger_1.logger.info(`Notification sent: ${JSON.stringify(result)}`);
        return result;
    }
    catch (error) {
        logger_1.logger.error(`Failed to send notification: ${error}`);
        throw error;
    }
});
exports.sendNotifications = sendNotifications;
