/* eslint-disable @typescript-eslint/no-explicit-any */
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import {
  type ActionSingleDataResponse,
  createActionSingleResponse
} from '../types/responses';
import {
  type BusinessRatingCheckResponse,
  type BusinessRatingSubmitResponse,
  type BusinessRatingsListResponse,
  createBusinessRatingCheckResponse,
  createBusinessRatingSubmitResponse,
  createBusinessRatingsListResponse
} from '../types/business-rating';
import { handleTokenExpiration } from '../utils/auth-utils';

export class BusinessRatingService {

  static async checkBusinessRating(
    token: string,
    businessId: string,
    invoiceId: string,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<BusinessRatingCheckResponse>> {
    try {
      const params = new URLSearchParams({
        'businessId': businessId,
        'trxnId': invoiceId,
        'invoiceId': invoiceId,
      });

      const response = await fetch(`${HD_API_SERVER}/businessRatings/check?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        signal,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
            data: { exists: false },
          },
        );
      }

      if (response.ok) {
        const data = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            errorMessage: '',
            data: createBusinessRatingCheckResponse(data),
          },
        );
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return createActionSingleResponse(
          {
            valid: false,
            errorMessage: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            data: { exists: false },
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          data: { exists: false },
        },
      );
    }
  }

  static async submitBusinessRating(
    token: string,
    businessId: string,
    invoiceId: string,
    trxnId: string,
    rating: number,
    ratingText: string,
    ratingAuthor: string,
    ratingPermlink: string,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<BusinessRatingSubmitResponse>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/businessRatings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        body: JSON.stringify({
          businessId,
          invoiceId,
          trxnId,
          rating,
          ratingText,
          ratingAuthor,
          ratingPermlink,
        }),
        signal,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            errorMessage: 'Token expired',
            data: {} as BusinessRatingSubmitResponse,
          },
        );
      }

      if (response.ok) {
        const data = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            errorMessage: '',
            data: createBusinessRatingSubmitResponse(data),
          },
        );
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return createActionSingleResponse(
          {
            valid: false,
            errorMessage: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            data: {} as BusinessRatingSubmitResponse,
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          data: {} as BusinessRatingSubmitResponse,
        },
      );
    }
  }

  static async getBusinessRatings(
    businessId: string,
    page = 1,
    limit = 20,
    sortBy: 'date-recent' | 'date-old' | 'rating-low' | 'rating-high' = 'date-recent',
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<BusinessRatingsListResponse>> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        sortBy: sortBy,
      });

      const response = await fetch(`${HD_API_SERVER}/businessRatings/${businessId}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            errorMessage: '',
            data: createBusinessRatingsListResponse(data),
          },
        );
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return createActionSingleResponse(
          {
            valid: false,
            errorMessage: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            data: createBusinessRatingsListResponse({
              data: [],
              pagination: {
                currentPage: page,
                pageSize: limit,
                totalRatings: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
              },
            }),
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          data: createBusinessRatingsListResponse({
            data: [],
            pagination: {
              currentPage: page,
              pageSize: limit,
              totalRatings: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPrevPage: false,
            },
          }),
        },
      );
    }
  }
}
