import type { PaginatedResult } from '../types/api';

export function paginateArray<T>(
  items: T[],
  page = 1,
  limit = 10,
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const start = (currentPage - 1) * limit;
  const data = items.slice(start, start + limit);

  return {
    data,
    totalItems,
    totalPages,
    currentPage,
    itemsPerPage: limit,
  };
}
