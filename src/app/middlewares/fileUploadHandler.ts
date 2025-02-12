// src/app/middlewares/fileUploadHandler.ts
import { Request } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import ApiError from '../../errors/ApiError';

const fileUploadHandler = () => {
  // Create upload folder
  const baseUploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir);
  }

  // Folder create for different file
  const createDir = (dirPath: string) => {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath);
    }
  };

  // Create filename
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      let uploadDir: string | undefined;
      switch (file.fieldname) {
        case 'image':
        case 'images': // Support for multi-image uploads
          uploadDir = path.join(baseUploadDir, 'images');
          break;
        case 'media':
          uploadDir = path.join(baseUploadDir, 'medias');
          break;
        case 'doc':
          uploadDir = path.join(baseUploadDir, 'docs');
          break;
        default:
          return cb(
            new ApiError(StatusCodes.BAD_REQUEST, 'File is not supported'),
            ''
          );
      }
      createDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const fileExt = path.extname(file.originalname);
      const fileName =
        file.originalname
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
  const filterFilter = (req: Request, file: any, cb: FileFilterCallback) => {
    try {
      if (file.fieldname === 'image' || file.fieldname === 'images') {
        if (
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/jpg'
        ) {
          cb(null, true);
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .jpeg, .png, .jpg files are supported'
            )
          );
        }
      } else if (file.fieldname === 'media') {
        if (file.mimetype === 'video/mp4' || file.mimetype === 'audio/mpeg') {
          cb(null, true);
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .mp4, .mp3 files are supported'
            )
          );
        }
      } else if (file.fieldname === 'doc') {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'application/msword' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/webp' ||
          file.mimetype === 'image/jpg'
        ) {
          cb(null, true);
        } else {
          cb(
            new ApiError(
              StatusCodes.BAD_REQUEST,
              'Only .PDF, .docx or Image .jpeg, .png, .jpg .webp files are supported'
            )
          );
        }
      } else {
        cb(
          new ApiError(
            StatusCodes.BAD_REQUEST,
            'This file type is not supported'
          )
        );
      }
    } catch (error) {
      cb(error as Error);
    }
  };

  const upload = multer({
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

export default fileUploadHandler;
