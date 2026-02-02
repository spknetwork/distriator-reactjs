import { create } from 'zustand';
import { BusinessRatingService } from '../services/business-rating-service';
import type { BusinessRatingModel } from '../types/business-rating';

interface BusinessRatingsState {
  ratings: BusinessRatingModel[];
  isLoading: boolean;
  error: string | null;
  businessId: string | null;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest';
  hasMore: boolean;
  currentPage: number;
  currentAbortController: AbortController | null;

  setBusinessId: (businessId: string) => void;

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

  // ----------------------------------------
  // Fetch only PAGE 1 → show LOADER
  // ----------------------------------------
  fetchFirstPage: async (signal?: AbortSignal) => {
    const { businessId, sortBy, currentAbortController } = get();
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

        set({
          ratings: data.data,
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
    const { businessId, currentPage, hasMore, sortBy, currentAbortController } = get();
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

        set(state => ({
          ratings: [...state.ratings, ...data.data],
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
