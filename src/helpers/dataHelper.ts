import { Model } from 'mongoose';
import { IPaginationOptions } from '../types/pagination';

interface IStatisticRatio {
  count: number;
  percentage: string;
}

interface IStatisticsMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: any;
}

type StatField = {
  field: string;
  name: string;
};

const calculatePagination = (options: IPaginationOptions) => {
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

const calculateStatistics = async <T>(
  model: Model<T>,
  queryConditions: any,
  paginationOptions: {
    page: number;
    limit: number;
  },
  statFields: StatField[]
): Promise<IStatisticsMeta> => {
  const { page, limit } = paginationOptions;
  const total = await model.countDocuments(queryConditions);

  const statsPromises = statFields.map(async ({ field, name }) => {
    const stats = await model.aggregate([
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
    }, {} as Record<string, IStatisticRatio>);

    return { [name]: ratioStats };
  });

  const statsResults = await Promise.all(statsPromises);
  const combinedStats = statsResults.reduce(
    (acc, stat) => ({ ...acc, ...stat }),
    {}
  );

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    ...combinedStats,
  };
};

export const dataHelper = {
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
