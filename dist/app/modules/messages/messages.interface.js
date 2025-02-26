"use strict";
// src/app/modules/messages/messages.interface.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["IMAGE"] = "image";
    MessageType["FILE"] = "file";
    MessageType["AUDIO"] = "audio";
    MessageType["VIDEO"] = "video";
    MessageType["STICKER"] = "sticker";
    MessageType["GIF"] = "gif";
    MessageType["DOCUMENT"] = "document";
    MessageType["MIXED"] = "mixed";
})(MessageType || (exports.MessageType = MessageType = {}));
