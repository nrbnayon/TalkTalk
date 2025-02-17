// src/helpers/statisticsHelper.ts

import { Model } from 'mongoose';

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

  // Get total count
  const total = await model.countDocuments(queryConditions);

  // Calculate stats for each field
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

    // Calculate ratios
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

  // Combine all stats into one object
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

export const statisticsHelper = {
  calculateStatistics,
};


// Example 1: Using in Banner Service
// import { statisticsHelper } from '../helpers/statisticsHelper';

// const getAllBanners = async (query: Record<string, unknown>) => {
//   // ... your existing query processing code ...

//   const [banners, stats] = await Promise.all([
//     Banner.find(whereConditions)
//       .sort(sortConditions)
//       .skip(skip)
//       .limit(limitData)
//       .lean(),
//     statisticsHelper.calculateStatistics(
//       Banner,
//       whereConditions,
//       { page: pageData, limit: limitData },
//       [
//         { field: 'type', name: 'typeRatio' },
//         { field: 'status', name: 'statusRatio' }
//       ]
//     ),
//   ]);

//   return {
//     meta: stats,
//     data: formattedBanners,
//   };
// };

// // Example 2: Using in Category Service
// const getAllCategories = async (query: Record<string, unknown>) => {
//   // ... your existing query processing code ...

//   const [categories, stats] = await Promise.all([
//     Category.find(whereConditions)
//       .sort(sortConditions)
//       .skip(skip)
//       .limit(limitData)
//       .lean(),
//     statisticsHelper.calculateStatistics(
//       Category,
//       whereConditions,
//       { page: pageData, limit: limitData },
//       [
//         { field: 'status', name: 'statusRatio' }
//       ]
//     ),
//   ]);

//   return {
//     meta: stats,
//     data: formattedCategories,
//   };
// };

// // Example 3: Using in User Service with more complex stats
// const getAllUsers = async (query: Record<string, unknown>) => {
//   // ... your existing query processing code ...

//   const [users, stats] = await Promise.all([
//     User.find(whereConditions)
//       .sort(sortConditions)
//       .skip(skip)
//       .limit(limitData)
//       .lean(),
//     statisticsHelper.calculateStatistics(
//       User,
//       whereConditions,
//       { page: pageData, limit: limitData },
//       [
//         { field: 'gender', name: 'genderRatio' },
//         { field: 'role', name: 'roleRatio' },
//         { field: 'status', name: 'statusRatio' }
//       ]
//     ),
//   ]);

//   return {
//     meta: stats,
//     data: formattedUsers,
//   };
// };

// // Example 4: Using in Order Service with custom conditions
// const getAllOrders = async (query: Record<string, unknown>) => {
//   // ... your existing query processing code ...

//   const [orders, stats] = await Promise.all([
//     Order.find(whereConditions)
//       .sort(sortConditions)
//       .skip(skip)
//       .limit(limitData)
//       .lean(),
//     statisticsHelper.calculateStatistics(
//       Order,
//       { ...whereConditions, status: { $ne: 'deleted' } }, // Additional condition
//       { page: pageData, limit: limitData },
//       [
//         { field: 'status', name: 'statusRatio' },
//         { field: 'paymentStatus', name: 'paymentRatio' }
//       ]
//     ),
//   ]);

//   return {
//     meta: stats,
//     data: formattedOrders,
//   };
// };

// Key benefits of this approach:

// Reusability: The same function can be used across different models
// Flexibility: Can calculate statistics for any field in your models
// Maintainability: Statistics logic is centralized in one place
// Performance: Uses MongoDB aggregation pipeline
// Type Safety: Fully typed with TypeScript
// Extensibility: Easy to add new types of statistics

// Usage tips:

// For simple stats:

// typescriptCopyconst stats = await statisticsHelper.calculateStatistics(
//   Model,
//   conditions,
//   { page, limit },
//   [{ field: 'status', name: 'statusRatio' }]
// );

// For multiple stats:

// typescriptCopyconst stats = await statisticsHelper.calculateStatistics(
//   Model,
//   conditions,
//   { page, limit },
//   [
//     { field: 'status', name: 'statusRatio' },
//     { field: 'type', name: 'typeRatio' }
//   ]
// );

// With custom conditions:

// typescriptCopyconst stats = await statisticsHelper.calculateStatistics(
//   Model,
//   { ...conditions, status: 'active' },
//   { page, limit },
//   [{ field: 'category', name: 'categoryRatio' }]
// );
// Would you like me to add any additional functionality or explain any part in more detail?