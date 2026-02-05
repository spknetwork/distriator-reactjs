import { create } from 'zustand';
import { BusinessRatingService } from '../services/business-rating-service';
import type { BusinessRatingModel } from '../types/business-rating';
import { type ReportedReview } from '../types/responses';

interface BusinessRatingsState {
  ratings: BusinessRatingModel[];
  isLoading: boolean;
  error: string | null;
  businessId: string | null;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  hasMore: boolean;
  currentPage: number;
  currentAbortController: AbortController | null;
  reportedUsers: string[];
  reportedReviews: ReportedReview[];

  setBusinessId: (businessId: string) => void;
  setReportedContent: (users: string[], reviews: ReportedReview[]) => void;

  fetchFirstPage: (signal?: AbortSignal) => Promise<void>;
  fetchNextPage: (signal?: AbortSignal) => Promise<void>;
  setSortBy: (sortBy: 'newest' | 'oldest' | 'highest' | 'lowest') => void;
  reset: () => void;
}

export const useBusinessRatingsStore = create<BusinessRatingsState>((set, get) => ({
  ratings: [],
  isLoading: false,
  error: null,
  businessId: null,
  sortBy: 'newest',
  hasMore: false,
  currentPage: 1,
  currentAbortController: null,
  reportedUsers: [],
  reportedReviews: [],

  setBusinessId: (businessId: string) => {
    const { currentAbortController } = get();
    if (currentAbortController) {
      currentAbortController.abort();
    }
    set({
      businessId,
      ratings: [],
      currentPage: 1,
      hasMore: true,
      error: null,
      currentAbortController: null,
    });
  },

  setReportedContent: (users: string[], reviews: ReportedReview[]) => {
    set({ reportedUsers: users, reportedReviews: reviews });
    // Re-filter existing ratings if any
    const { ratings } = get();
    if (ratings.length > 0) {
      const filtered = filterRatings(ratings, users, reviews);
      set({ ratings: filtered });
    }
  },

  // ----------------------------------------
  // Fetch only PAGE 1 → show LOADER
  // ----------------------------------------
  fetchFirstPage: async (signal?: AbortSignal) => {
    const { businessId, sortBy, currentAbortController, reportedUsers, reportedReviews } = get();
    if (!businessId) return;

    // Abort any ongoing request
    if (currentAbortController) {
      currentAbortController.abort();
    }

    const abortController = new AbortController();
    set({ currentAbortController: abortController, isLoading: true, ratings: [], currentPage: 1, hasMore: true, error: null });

    const apiSort = mapSortByToApi(sortBy);

    try {
      const response = await BusinessRatingService.getBusinessRatings(
        businessId,
        1,
        20,
        apiSort,
        abortController.signal
      );

      if (response.data) {
        const data = response.data;
        const filteredData = filterRatings(data.data, reportedUsers, reportedReviews);

        set({
          ratings: filteredData,
          currentPage: 1,
          hasMore: data.pagination.hasNextPage,
          isLoading: false,
          currentAbortController: null,
        });

        // Now load next pages silently (no loader)
        get().fetchNextPage(abortController.signal);
      } else {
        set({ error: response.errorMessage || "Failed to load ratings", isLoading: false, currentAbortController: null });
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        set({ error: "Error loading ratings", isLoading: false, currentAbortController: null });
      }
    }
  },

  // ----------------------------------------
  // Load Page 2, 3, 4… silently (NO LOADER)
  // ----------------------------------------
  fetchNextPage: async (signal?: AbortSignal) => {
    const { businessId, currentPage, hasMore, sortBy, currentAbortController, reportedUsers, reportedReviews } = get();
    if (!businessId || !hasMore) return;

    const apiSort = mapSortByToApi(sortBy);
    let page = currentPage + 1;

    try {
      const response = await BusinessRatingService.getBusinessRatings(
        businessId,
        page,
        20,
        apiSort,
        signal || currentAbortController?.signal
      );

      if (response.data) {
        const data = response.data;
        const filteredData = filterRatings(data.data, reportedUsers, reportedReviews);

        set(state => ({
          ratings: [...state.ratings, ...filteredData],
          currentPage: page,
          hasMore: data.pagination.hasNextPage
        }));

        // Continue loading next pages in background
        if (data.pagination.hasNextPage) {
          get().fetchNextPage(signal || currentAbortController?.signal);
        }
      }
    } catch (err) {
      if (!(signal || currentAbortController?.signal)?.aborted) {
        set({ error: "Error loading more ratings" });
      }
    }
  },

  // ----------------------------------------
  // Sorting changed → reload from PAGE 1
  // ----------------------------------------
  setSortBy: (sortBy) => {
    set({ sortBy, currentPage: 1, ratings: [], hasMore: true });

    const { fetchFirstPage } = get();
    fetchFirstPage();
  },

  reset: () => {
    const { currentAbortController } = get();
    if (currentAbortController) {
      currentAbortController.abort();
    }
    set({
      ratings: [],
      isLoading: false,
      error: null,
      businessId: null,
      sortBy: 'newest',
      hasMore: false,
      currentPage: 1,
      currentAbortController: null,
    });
  }
}));

function mapSortByToApi(sortBy: 'newest' | 'oldest' | 'highest' | 'lowest') {
  switch (sortBy) {
    case 'newest': return 'date-recent';
    case 'oldest': return 'date-old';
    case 'highest': return 'rating-high';
    case 'lowest': return 'rating-low';
    default: return 'date-recent';
  }
}

function filterRatings(ratings: BusinessRatingModel[], reportedUsers: string[], reportedReviews: ReportedReview[]) {
  return ratings.filter(rating => {
    const isUserReported = reportedUsers.includes(rating.ratingAuthor);
    const isReviewReported = reportedReviews.some(r => {
      const author = r.author ?? (r as { name?: string }).name;
      return r.permlink === rating.ratingPermlink && author === rating.ratingAuthor;
    });
    return !isUserReported && !isReviewReported;
  });
}
