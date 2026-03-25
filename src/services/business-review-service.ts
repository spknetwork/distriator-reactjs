/* eslint-disable @typescript-eslint/no-explicit-any */
const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import CryptoJS from "crypto-js";
import {
    type ActionListDataResponse,
    type ActionSingleDataResponse,
    createActionListResponse,
    createActionSingleResponse
} from '../types/responses';
import { type BusinessReviewModel, createBusinessReviewModel } from '../types/business-review';
import { type BusinessHistoryModel, createBusinessHistoryModel } from '../types/business-history';
import { handleTokenExpiration } from '../utils/auth-utils';

const REVIEWS_CACHE_KEY_PREFIX = "cached_reviews_";
const LAST_MODIFIED_TIMESTAMP_KEY_PREFIX = "last_modified_timestamp_reviews_";
const OLDEST_POSSIBLE_TIMESTAMP = "1970-01-01T00:00:00.000Z";

export class BusinessReviewService {

  private static getCachedReviews(businessId: string): BusinessReviewModel[] {
    try {
      const cachedData = localStorage.getItem(`${REVIEWS_CACHE_KEY_PREFIX}${businessId}`);
      if (!cachedData) return [];
      return JSON.parse(cachedData) as BusinessReviewModel[];
    } catch (error) {
      console.error("Error reading cached reviews:", error);
      return [];
    }
  }

  private static storeCachedReviews(businessId: string, reviews: BusinessReviewModel[]): void {
    try {
      localStorage.setItem(`${REVIEWS_CACHE_KEY_PREFIX}${businessId}`, JSON.stringify(reviews));
    } catch (error) {
      console.error("Error storing cached reviews:", error);
    }
  }

  private static storeLastModifiedTimestamp(businessId: string, timestamp: string): void {
    try {
      localStorage.setItem(`${LAST_MODIFIED_TIMESTAMP_KEY_PREFIX}${businessId}`, timestamp);
    } catch (error) {
      console.error("Error storing timestamp:", error);
    }
  }

  private static findMaxDateFromReviews(reviews: BusinessReviewModel[]): string {
    if (reviews.length === 0) return OLDEST_POSSIBLE_TIMESTAMP;

    let maxDate = new Date(OLDEST_POSSIBLE_TIMESTAMP);

    reviews.forEach(review => {
      const reviewDate = review.modifiedAt ? new Date(review.modifiedAt) : (review.created ? new Date(review.created) : null);
      if (reviewDate && reviewDate > maxDate) {
        maxDate = reviewDate;
      }
    });

    return maxDate.toISOString();
  };

  private static async fetchReviewsModifiedAfter(businessId: string, modifiedAfter: string, signal?: AbortSignal): Promise<BusinessReviewModel[]> {
    const response = await fetch(`${HD_API_SERVER}/review/v2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ businessId, modifiedAfter }),
      signal,
    });

    if (signal?.aborted) {
      throw new Error("Request was aborted");
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const jsonData = await response.json();
    if (!jsonData.reviews) {
      return [];
    }

    return jsonData.reviews.map(createBusinessReviewModel);
  }

  static async getBusinessReviews(businessId: string, signal?: AbortSignal): Promise<ActionListDataResponse<BusinessReviewModel>> {
    if (signal?.aborted) {
      return createActionListResponse({ valid: false, error: 'Request was aborted', data: [] }, createBusinessReviewModel);
    }

    try {
      // Always fetch the full set from the server to ensure deleted reviews are not shown
      const allReviews = await this.fetchReviewsModifiedAfter(businessId, OLDEST_POSSIBLE_TIMESTAMP, signal);

      // Update cache with fresh server data
      this.storeCachedReviews(businessId, allReviews);
      const maxTimestamp = this.findMaxDateFromReviews(allReviews);
      this.storeLastModifiedTimestamp(businessId, maxTimestamp);

      return createActionListResponse({ valid: true, error: '', data: allReviews }, createBusinessReviewModel);

    } catch (error) {
      // Fallback to cache only on fetch failure
      const cachedReviews = this.getCachedReviews(businessId);
      if (cachedReviews.length > 0) {
        return createActionListResponse({ valid: true, error: 'Failed to fetch new reviews, returning cached data.', data: cachedReviews }, createBusinessReviewModel);
      }
      return createActionListResponse({ valid: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] }, createBusinessReviewModel);
    }
  }

  static clearReviewsCache(businessId: string): void {
    localStorage.removeItem(`${REVIEWS_CACHE_KEY_PREFIX}${businessId}`);
    localStorage.removeItem(`${LAST_MODIFIED_TIMESTAMP_KEY_PREFIX}${businessId}`);
  }

  // ===== Business History Caching (similar to BusinessApi) =====
  private static readonly HISTORY_CACHE_KEY_PREFIX = "cached_business_history_new_";
  private static readonly HISTORY_LAST_MODIFIED_PREFIX = "last_modified_timestamp_business_history_new_";
  private static readonly HISTORY_FETCHED_AT_PREFIX = "fetched_at_business_history_new_";
  private static readonly OLDEST_TS = OLDEST_POSSIBLE_TIMESTAMP;

  private static getCachedBusinessHistory(businessUserName: string): BusinessHistoryModel[] {
    try {
      const cachedEncrypted = localStorage.getItem(`${this.HISTORY_CACHE_KEY_PREFIX}${businessUserName}`);
      if (!cachedEncrypted) return [];
      const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
      const decryptedText = CryptoJS.AES.decrypt(cachedEncrypted, apiKey).toString(CryptoJS.enc.Utf8);
      const raw = JSON.parse(decryptedText) as any[];
      return (Array.isArray(raw) ? raw : []).map(createBusinessHistoryModel);
    } catch (e) {
      console.error("Error reading cached business history:", e);
      return [];
    }
  }

  private static storeCachedBusinessHistory(businessUserName: string, history: BusinessHistoryModel[]): void {
    try {
      const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(history), apiKey).toString();
      localStorage.setItem(`${this.HISTORY_CACHE_KEY_PREFIX}${businessUserName}`, encrypted);
    } catch (e) {
      console.error("Error storing cached business history:", e);
    }
  }
  
  private static storeLastModifiedHistoryTimestamp(businessUserName: string, timestamp: string): void {
    try {
      localStorage.setItem(`${this.HISTORY_LAST_MODIFIED_PREFIX}${businessUserName}`, timestamp);
    } catch (e) {
      console.error("Error storing history timestamp:", e);
    }
  }

  private static storeFetchedAtTimestamp(businessUserName: string, fetchedAt: number): void {
    try {
      localStorage.setItem(`${this.HISTORY_FETCHED_AT_PREFIX}${businessUserName}`, String(fetchedAt));
    } catch (e) {
      console.error("Error storing fetched-at timestamp:", e);
    }
  }

  private static getFetchedAtTimestamp(businessUserName: string): number | null {
    const v = localStorage.getItem(`${this.HISTORY_FETCHED_AT_PREFIX}${businessUserName}`);
    return v ? Number(v) : null;
  }

  private static findMaxDateFromBusinessHistory(items: BusinessHistoryModel[]): string {
    if (items.length === 0) return this.OLDEST_TS;
    let maxDate = new Date(this.OLDEST_TS);
    items.forEach(item => {
      const d = item.date instanceof Date ? item.date : new Date(item.date);
      if (!isNaN(d.getTime()) && d > maxDate) {
        maxDate = d;
      }
    });
    return maxDate.toISOString();
  }

  private static async fetchBusinessHistory(token: string, businessUserName: string, signal?: AbortSignal): Promise<BusinessHistoryModel[]> {
    const response = await fetch(`${HD_API_SERVER}/business/history/${businessUserName}`, {
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
      throw new Error('Token expired');
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch business history: ${response.status} ${response.statusText} ${text}`);
    }

    const data = await response.json();
    return (Array.isArray(data) ? data : []).map(createBusinessHistoryModel);
  }

  static async getBusinessHistory(token: string, businessUserName: string, signal?: AbortSignal): Promise<ActionListDataResponse<BusinessHistoryModel>> {
    if (!token || !businessUserName) {
      return createActionListResponse(
        { valid: false, error: 'Missing token or business username', data: [] },
        createBusinessHistoryModel
      );
    }

    try {
      const cached = this.getCachedBusinessHistory(businessUserName);
      const fresh = await this.fetchBusinessHistory(token, businessUserName, signal);

      // Merge fresh into cached by id to mirror business flow safety (even if API returns full set)
      const merged = [...cached];
      fresh.forEach(newItem => {
        const idx = merged.findIndex(e => e.id === newItem.id);
        if (idx !== -1) merged[idx] = newItem; else merged.push(newItem);
      });

      // Persist cache and timestamp
      const toStore = merged.length >= fresh.length ? merged : fresh;
      this.storeCachedBusinessHistory(businessUserName, toStore);
      const newMax = this.findMaxDateFromBusinessHistory(fresh);
      this.storeLastModifiedHistoryTimestamp(businessUserName, newMax);
      this.storeFetchedAtTimestamp(businessUserName, Date.now());

      return createActionListResponse(
        { valid: true, error: '', data: toStore },
        createBusinessHistoryModel
      );
    } catch (error) {
      console.error("Error fetching business history:", error);
      const cached = this.getCachedBusinessHistory(businessUserName);
      if (cached.length > 0) {
        return createActionListResponse(
          { valid: true, error: 'Returning cached business history', data: cached },
          createBusinessHistoryModel
        );
      }
      return createActionListResponse(
        { valid: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] },
        createBusinessHistoryModel
      );
    }
  }

  static clearBusinessHistoryCache(businessUserName: string): void {
    localStorage.removeItem(`${this.HISTORY_CACHE_KEY_PREFIX}${businessUserName}`);
    localStorage.removeItem(`${this.HISTORY_LAST_MODIFIED_PREFIX}${businessUserName}`);
    localStorage.removeItem(`${this.HISTORY_FETCHED_AT_PREFIX}${businessUserName}`);
  }

  // Public helpers for cache-first hooks/components
  static getCachedHistory(businessUserName: string): BusinessHistoryModel[] {
    return this.getCachedBusinessHistory(businessUserName);
  }

  static getHistoryLastModified(businessUserName: string): string {
    return localStorage.getItem(`${this.HISTORY_LAST_MODIFIED_PREFIX}${businessUserName}`) || this.OLDEST_TS;
  }

  static getHistoryLastFetchedAt(businessUserName: string): number | null {
    return this.getFetchedAtTimestamp(businessUserName);
  }

  static async updateReviewStatus(
    username: string,
    permlink: string,
    token: string,
    hide: boolean,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<boolean>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/review/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        body: JSON.stringify({ username, permlink, hide }),
        signal,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
            data: false,
          },
        );
      }

      if (response.status === 200) {
        const data = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            error: '',
            data: data.success,
          },
        );
      } else {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Something went wrong',
            data: false,
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: false,
        },
      );
    }
  }

  static async saveCustomBusinessReview(
    businessId: string,
    questions: Array<{
      type: string;
      title: string;
      order: number;
      options?: string[];
    }>,
    token: string,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<boolean>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/customBusinessReview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessId,
          questions,
        }),
        signal,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
            data: false,
          },
        );
      }

      if (response.ok) {
        const data = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            error: '',
            data: data.success !== false, // Treat any response as success unless explicitly false
          },
        );
      } else {
        const errorText = await response.text();
        return createActionSingleResponse(
          {
            valid: false,
            error: `Failed to save custom business review: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
            data: false,
          },
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: false,
        },
      );
    }
  }

  static async getCustomBusinessReview(
    businessId: string,
    signal?: AbortSignal
  ): Promise<ActionListDataResponse<import('../types/business').ReviewField>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/customBusinessReview/${businessId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (!response.ok) {
        const txt = await response.text();
        return createActionListResponse(
          { valid: false, error: `Failed to fetch custom review: ${response.status} ${response.statusText} ${txt}`, data: [] },
          (x: any) => x as import('../types/business').ReviewField
        );
      }

      const json = await response.json();
      // Accept either { questions: [...] } or an array directly
      const rawQuestions: any[] = Array.isArray(json) ? json : (Array.isArray(json?.questions) ? json.questions : []);

      const mapType = (t: string): 'rating' | 'yesNo' | 'multiChoice' | 'singleChoice' | 'text' => {
        switch (t) {
          case 'rating': return 'rating';
          case 'yes-no': return 'yesNo';
          case 'multi': return 'multiChoice';
          case 'single': return 'singleChoice';
          case 'text': return 'text';
          default: return 'rating';
        }
      };

      const fields = rawQuestions
        .filter((q) => q && q.type && q.title)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((q, idx) => ({
          id: `srv_${idx}_${q.title}`,
          title: q.title as string,
          type: mapType(String(q.type)),
          choices: Array.isArray(q.options) ? q.options as string[] : undefined,
        }));

      return createActionListResponse(
        { valid: true, error: '', data: fields },
        (x: any) => x as import('../types/business').ReviewField
      );
    } catch (error) {
      return createActionListResponse(
        { valid: false, error: error instanceof Error ? error.message : 'Unknown error', data: [] },
        (x: any) => x as import('../types/business').ReviewField
      );
    }
  }

  static async getCustomBusinessReviewMeta(
    businessId: string,
    signal?: AbortSignal
  ): Promise<{
    valid: boolean;
    errorMessage: string;
    id?: string;
    fields: import('../types/business').ReviewField[];
  }> {
    try {
      const response = await fetch(`${HD_API_SERVER}/customBusinessReview/${businessId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal,
      });

      if (!response.ok) {
        // Try to parse JSON error first
        let errorText = '';
        try {
          const maybeJson = await response.clone().json();
          if (maybeJson && typeof maybeJson.message === 'string') {
            errorText = maybeJson.message;
          }
        } catch {
          errorText = await response.text();
        }

        // Treat the specific "no review found" case as an empty, valid state
        if (typeof errorText === 'string' && errorText.toLowerCase().includes('no custom business review found')) {
          return { valid: true, errorMessage: '', id: undefined, fields: [] };
        }

        return { valid: false, errorMessage: `Failed to fetch: ${response.status} ${response.statusText} ${errorText}`.trim(), fields: [] };
      }

      const json = await response.json();
      const docId: string | undefined = typeof json === 'object' && json ? (json.id || json._id) : undefined;
      const rawQuestions: any[] = Array.isArray(json) ? json : (Array.isArray(json?.questions) ? json.questions : []);

      const mapType = (t: string): 'rating' | 'yesNo' | 'multiChoice' | 'singleChoice' | 'text' => {
        switch (t) {
          case 'rating': return 'rating';
          case 'yes-no': return 'yesNo';
          case 'multi': return 'multiChoice';
          case 'single': return 'singleChoice';
          case 'text': return 'text';
          default: return 'rating';
        }
      };

      const fields = rawQuestions
        .filter((q) => q && q.type && q.title)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((q, idx) => ({
          id: `srv_${idx}_${q.title}`,
          title: q.title as string,
          type: mapType(String(q.type)),
          choices: Array.isArray(q.options) ? (q.options as string[]) : undefined,
        }));

      return { valid: true, errorMessage: '', id: docId, fields };
    } catch (e) {
      return { valid: false, errorMessage: e instanceof Error ? e.message : 'Unknown error', fields: [] };
    }
  }

  static async updateCustomBusinessReview(
    businessId: string,
    id: string,
    questions: Array<{ type: string; title: string; order: number; options?: string[] }>,
    token: string,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<boolean>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/customBusinessReview/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ businessId, id, questions }),
        signal,
      });

      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse({ valid: false, error: 'Token expired', data: false });
      }

      if (response.ok) {
        const data = await response.json();
        // this.getCustomBusinessReview(id);
        return createActionSingleResponse({ valid: true, error: '', data: data.success !== false });
      } else {
        const errorText = await response.text();
        return createActionSingleResponse({ valid: false, error: `Failed to update: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`, data: false });
      }
    } catch (error) {
      return createActionSingleResponse({ valid: false, error: error instanceof Error ? error.message : 'Unknown error', data: false });
    }
  }
}