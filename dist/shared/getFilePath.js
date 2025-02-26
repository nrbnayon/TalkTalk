"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilePathMultiple = void 0;
const getFilePathMultiple = (files, fieldname, folderName) => {
    if (!files || !files[fieldname]) {
        return undefined;
    }
    return files[fieldname].map((file) => `/${folderName}s/${file.filename}`);
};
exports.getFilePathMultiple = getFilePathMultiple;
const getFilePath = (files, folderName) => {
    if (!files || !('image' in files) || !files.image[0]) {
        return null;
    }
    return `/${folderName}/${files.image[0].filename}`;
};
exports.default = getFilePath;
