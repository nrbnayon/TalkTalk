"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const http_status_codes_1 = require("http-status-codes");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const fileUploadHandler = () => {
    // Create upload folder
    const baseUploadDir = path_1.default.join(process.cwd(), 'uploads');
    if (!fs_1.default.existsSync(baseUploadDir)) {
        fs_1.default.mkdirSync(baseUploadDir);
    }
    // Folder create for different file
    const createDir = (dirPath) => {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath);
        }
    };
    // Create filename
    const storage = multer_1.default.diskStorage({
        destination: (req, file, cb) => {
            let uploadDir;
            switch (file.fieldname) {
                case 'image':
                case 'images': // Support for multi-image uploads
                    uploadDir = path_1.default.join(baseUploadDir, 'images');
                    break;
                case 'media':
                    uploadDir = path_1.default.join(baseUploadDir, 'media');
                    break;
                case 'doc':
                    uploadDir = path_1.default.join(baseUploadDir, 'docs');
                    break;
                default:
                    return cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'File is not supported'), '');
            }
            createDir(uploadDir);
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const fileExt = path_1.default.extname(file.originalname);
            const fileName = file.originalname
                .replace(fileExt, '')
                .toLowerCase()
                .split(' ')
                .join('-') +
                '-' +
                Date.now();
            cb(null, fileName + fileExt);
        },
    });
    // File filter
    const filterFilter = (req, file, cb) => {
        try {
            if (file.fieldname === 'image' || file.fieldname === 'images') {
                if (file.mimetype === 'image/jpeg' ||
                    file.mimetype === 'image/png' ||
                    file.mimetype === 'image/jpg') {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .jpeg, .png, .jpg files are supported'));
                }
            }
            else if (file.fieldname === 'media') {
                if (file.mimetype === 'video/mp4' ||
                    file.mimetype === 'audio/mpeg' ||
                    file.mimetype === 'audio/mp3' ||
                    file.mimetype === 'audio/webm') {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only .mp4, .mp3, .webm files are supported'));
                }
            }
            else if (file.fieldname === 'doc') {
                if (file.mimetype.startsWith('video/') ||
                    file.mimetype.startsWith('audio/') ||
                    file.mimetype === 'application/pdf' ||
                    file.mimetype === 'application/msword' ||
                    file.mimetype ===
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                    file.mimetype === 'text/plain' ||
                    file.mimetype === 'application/vnd.ms-excel' ||
                    file.mimetype ===
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    file.mimetype === 'application/zip' ||
                    file.mimetype === 'application/x-rar-compressed' ||
                    file.mimetype === 'image/jpeg' ||
                    file.mimetype === 'image/png' ||
                    file.mimetype === 'image/webp' ||
                    file.mimetype === 'image/jpg') {
                    cb(null, true);
                }
                else {
                    cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'Only video, audio, PDF, DOC, DOCX, TXT, XLS, XLSX, ZIP, RAR, and image files (JPEG, PNG, JPG, WEBP) are supported'));
                }
            }
            else {
                cb(new ApiError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, 'This file type is not supported'));
            }
        }
        catch (error) {
            cb(error);
        }
    };
    const upload = (0, multer_1.default)({
        storage: storage,
        fileFilter: filterFilter,
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    }).fields([
        { name: 'image', maxCount: 3 },
        { name: 'images', maxCount: 5 },
        { name: 'media', maxCount: 3 },
        { name: 'doc', maxCount: 3 },
    ]);
    return upload;
};
exports.default = fileUploadHandler;
