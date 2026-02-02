/* eslint-disable @typescript-eslint/no-explicit-any */
import type { CartModel } from './cart';

export interface PaginatedCartsResponse {
  carts: CartModel[];
  page: number;
  limit: number;
  totalPages: number;
  totalItems?: number;
}

export function createPaginatedCartsResponse(json: any): PaginatedCartsResponse {
  const data = typeof json === 'object' && json != null
    ? (json.data ?? json)
    : {};

  const items = Array.isArray(data.carts)
    ? data.carts
    : Array.isArray(data.items)
      ? data.items
      : Array.isArray(json.carts)
        ? json.carts
        : [];

  const page = Number(data.page ?? json.page ?? 1) || 1;
  const limit = Number(data.limit ?? json.limit ?? 10) || 10;
  const totalPages = Number(data.totalPages ?? json.totalPages ?? 1) || 1;
  const totalItems = data.totalItems ?? json.totalItems;

  return {
    carts: items,
    page,
    limit,
    totalPages,
    totalItems,
  } as PaginatedCartsResponse;
}

