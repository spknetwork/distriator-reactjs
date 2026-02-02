import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { type BusinessHistoryModel } from '../types/business-history';
import { BusinessReviewService } from '../services/business-review-service';

interface BusinessHistoryState {
  history: BusinessHistoryModel[];
  viewState: ViewState;
  lastFetchedAt: number | null;

  // Actions
  fetchBusinessHistory: (token: string, businessUserName: string, signal?: AbortSignal) => Promise<BusinessHistoryModel[]>;
  loadCachedFirst: (businessUserName: string) => void;
  setHistoryData: (data: BusinessHistoryModel[]) => void;
  setViewState: (state: ViewState) => void;
}

export const useBusinessHistoryStore = create<BusinessHistoryState>((set) => ({
  history: [],
  viewState: ViewState.LOADING,
  lastFetchedAt: null,

  setHistoryData: (data) => set({
    history: data,
    viewState: data.length > 0 ? ViewState.DATA : ViewState.EMPTY,
  }),

  setViewState: (viewState) => set({ viewState }),

  loadCachedFirst: (businessUserName: string) => {
    const cached = BusinessReviewService.getCachedHistory(businessUserName);
    const lastFetchedAt = BusinessReviewService.getHistoryLastFetchedAt(businessUserName);
    if (cached.length > 0) {
      set({
        history: cached,
        viewState: ViewState.DATA,
        lastFetchedAt: lastFetchedAt ?? null,
      });
    } else {
      set({
        history: [],
        viewState: ViewState.LOADING,
        lastFetchedAt: lastFetchedAt ?? null,
      });
    }
  },

  fetchBusinessHistory: async (token: string, businessUserName: string, signal?: AbortSignal) => {
    const response = await BusinessReviewService.getBusinessHistory(token, businessUserName, signal);
    if (response.isSuccess && response.data) {
      set({
        history: response.data,
        viewState: response.data.length > 0 ? ViewState.DATA : ViewState.EMPTY,
        lastFetchedAt: BusinessReviewService.getHistoryLastFetchedAt(businessUserName),
      });
      return response.data;
    }
    // On failure, preserve existing state to avoid error flicker
    return [];
  },
}));


