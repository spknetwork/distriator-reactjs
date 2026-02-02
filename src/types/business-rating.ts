/* eslint-disable @typescript-eslint/no-explicit-any */

export interface BusinessRatingCheckResponse {
  exists: boolean;
  rating?: BusinessRatingModel;
}

export interface BusinessRatingModel {
  id: string;
  hiveUsername: string;
  businessId: string;
  invoiceId: string;
  trxnId: string;
  rating: number;
  ratingText: string;
  ratingAuthor: string;
  ratingPermlink: string;
  createdDateTime: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface BusinessRatingSubmitResponse {
  id: string;
  hiveUsername: string;
  businessId: string;
  invoiceId: string;
  trxnId: string;
  rating: number;
  ratingText: string;
  ratingAuthor: string;
  ratingPermlink: string;
  createdDateTime: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface BusinessRatingSummaryResponse {
  businessId: string;
  averageRating: number;
  totalRatings: number;
  ratingDistribution: { [key: string]: number };
}

export interface BusinessRatingsPagination {
  currentPage: number;
  pageSize: number;
  totalRatings: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BusinessRatingsListResponse {
  data: BusinessRatingModel[];
  pagination: BusinessRatingsPagination;
}

export function createBusinessRatingCheckResponse(json: any): BusinessRatingCheckResponse {
  return {
    exists: json.exists || false,
    rating: json.rating ? createBusinessRatingModel(json.rating) : undefined,
  };
}

export function createBusinessRatingModel(json: any): BusinessRatingModel {
  return {
    id: json.id || '',
    hiveUsername: json.hiveUsername || '',
    businessId: json.businessId || '',
    invoiceId: json.invoiceId || '',
    trxnId: json.trxnId || '',
    rating: json.rating || 0,
    ratingText: json.ratingText || '',
    // Prefer explicit ratingAuthor, otherwise fall back to hiveUsername
    ratingAuthor: json.ratingAuthor || json.hiveUsername || '',
    // Support both ratingPermlink and ratingPermalink, or empty string
    ratingPermlink: json.ratingPermlink || json.ratingPermalink || '',
    createdDateTime: json.createdDateTime || '',
    createdAt: json.createdAt || '',
    updatedAt: json.updatedAt || '',
    isDeleted: json.isDeleted || false,
  };
}

export function createBusinessRatingSubmitResponse(json: any): BusinessRatingSubmitResponse {
  return {
    id: json.id || '',
    hiveUsername: json.hiveUsername || '',
    businessId: json.businessId || '',
    invoiceId: json.invoiceId || '',
    trxnId: json.trxnId || '',
    rating: json.rating || 0,
    ratingText: json.ratingText || undefined,
    ratingAuthor: json.ratingAuthor || '',
    ratingPermlink: json.ratingPermalink || '',
    createdDateTime: json.createdDateTime || '',
    createdAt: json.createdAt || '',
    updatedAt: json.updatedAt || '',
    isDeleted: json.isDeleted || false,
  };
}

export function createBusinessRatingSummaryResponse(json: any): BusinessRatingSummaryResponse {
  return {
    businessId: json.businessId || '',
    averageRating: json.averageRating || 0,
    totalRatings: json.totalRatings || 0,
    ratingDistribution: json.ratingDistribution || { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}

export function createBusinessRatingsListResponse(json: any): BusinessRatingsListResponse {
  const pagination = json.pagination || {};

  return {
    data: Array.isArray(json.data)
      ? json.data.map((item: any) => createBusinessRatingModel(item))
      : [],
    pagination: {
      currentPage: pagination.currentPage ?? 1,
      pageSize: pagination.pageSize ?? 0,
      totalRatings: pagination.totalRatings ?? 0,
      totalPages: pagination.totalPages ?? 0,
      hasNextPage: pagination.hasNextPage ?? false,
      hasPrevPage: pagination.hasPrevPage ?? false,
    },
  };
}
