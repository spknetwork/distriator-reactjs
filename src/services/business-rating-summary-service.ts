/* eslint-disable @typescript-eslint/no-explicit-any */
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import {
  type ActionSingleDataResponse,
  createActionSingleResponse
} from '../types/responses';
import {
  type BusinessRatingSummaryResponse,
  createBusinessRatingSummaryResponse
} from '../types/business-rating';

export class BusinessRatingSummaryService {

  static async getBusinessRatingSummary(
    businessId: string,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<BusinessRatingSummaryResponse>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/businessRatings/summary/${businessId}`, {
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
            data:   createBusinessRatingSummaryResponse(data),
          },
        );
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        return createActionSingleResponse(
          {
            valid: false,
            errorMessage: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
            data: createBusinessRatingSummaryResponse({
              businessId: '',
              averageRating: 0,
              totalRatings: 0,
              ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
            }),
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          data: createBusinessRatingSummaryResponse({
            businessId: '',
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 }
          }),
        },
      );
    }
  }
}
