// src\helpers\paginationHelper.ts
import { IPaginationOptions } from '../types/pagination';

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

export const paginationHelper = {
  calculatePagination,
};
