"use strict";
// src/helpers/statisticsHelper.ts
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
exports.statisticsHelper = void 0;
const calculateStatistics = (model, queryConditions, paginationOptions, statFields) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = paginationOptions;
    // Get total count
    const total = yield model.countDocuments(queryConditions);
    // Calculate stats for each field
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
        // Calculate ratios
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
    // Combine all stats into one object
    const combinedStats = statsResults.reduce((acc, stat) => (Object.assign(Object.assign({}, acc), stat)), {});
    return Object.assign({ page,
        limit,
        total, totalPages: Math.ceil(total / limit) }, combinedStats);
});
exports.statisticsHelper = {
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
