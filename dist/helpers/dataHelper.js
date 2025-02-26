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
exports.dataHelper = void 0;
const calculatePagination = (options) => {
    const defaultLimit = 100000000000000;
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 10 || defaultLimit);
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
    };
};
const calculateStatistics = (model, queryConditions, paginationOptions, statFields) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = paginationOptions;
    const total = yield model.countDocuments(queryConditions);
    const statsPromises = statFields.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ field, name }) {
        const stats = yield model.aggregate([
            { $match: queryConditions },
            {
                $group: {
                    _id: `$${field}`,
                    count: { $sum: 1 },
                },
            },
        ]);
        const ratioStats = stats.reduce((acc, { _id, count }) => {
            if (_id) {
                acc[_id] = {
                    count,
                    percentage: ((count / total) * 100).toFixed(2) + '%',
                };
            }
            return acc;
        }, {});
        return { [name]: ratioStats };
    }));
    const statsResults = yield Promise.all(statsPromises);
    const combinedStats = statsResults.reduce((acc, stat) => (Object.assign(Object.assign({}, acc), stat)), {});
    return Object.assign({ page,
        limit,
        total, totalPages: Math.ceil(total / limit) }, combinedStats);
});
exports.dataHelper = {
    calculatePagination,
    calculateStatistics,
};
// uses example
// User.ts
// import mongoose, { Schema, Document, Model } from 'mongoose';
// interface IUser extends Document {
//   name: string;
//   email: string;
//   role: string;
//   status: string;
//   createdAt: Date;
// }
// const UserSchema = new Schema<IUser>(
//   {
//     name: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     role: {
//       type: String,
//       enum: ['admin', 'user', 'moderator'],
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['active', 'inactive', 'banned'],
//       required: true,
//     },
//   },
//   { timestamps: true }
// );
// const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
// export default User;
// userService.ts;
// import User from '../models/User';
// import { dataHelper } from '../helpers/dataHelper';
// import { IPaginationOptions } from '../types/pagination';
// export const getUserStatistics = async (
//   query: any,
//   paginationOptions: IPaginationOptions
// ) => {
//   // Step 1: Calculate pagination
//   const pagination = dataHelper.calculatePagination(paginationOptions);
//   // Step 2: Fetch paginated users
//   const users = await User.find(query)
//     .skip(pagination.skip)
//     .limit(pagination.limit)
//     .sort({ [pagination.sortBy]: pagination.sortOrder === 'desc' ? -1 : 1 });
//   // Step 3: Calculate statistics based on roles & status
//   const statistics = await dataHelper.calculateStatistics(
//     User,
//     query,
//     pagination,
//     [
//       { field: 'role', name: 'roleDistribution' },
//       { field: 'status', name: 'statusDistribution' },
//     ]
//   );
//   return { users, statistics };
// };
// userController.ts;
// import { Request, Response } from 'express';
// import { getUserStatistics } from '../services/userService';
// export const getUsers = async (req: Request, res: Response) => {
//   try {
//     const query = {}; // Add any necessary filters from req.query
//     const paginationOptions = {
//       page: req.query.page ? parseInt(req.query.page as string) : 1,
//       limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
//       sortBy: (req.query.sortBy as string) || 'createdAt',
//       sortOrder: (req.query.sortOrder as string) || 'desc',
//     };
//     const result = await getUserStatistics(query, paginationOptions);
//     return res.status(200).json({
//       success: true,
//       data: result.users,
//       statistics: result.statistics,
//     });
//   } catch (error) {
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };
// GET /api/users?page=1&limit=5&sortBy=createdAt&sortOrder=desc
