
import { create } from 'zustand';
import { ApiService } from '../services/api';
import { ViewState } from '../types/enums';

interface PendingReviewsState {
  pendingReviewsCount: number;
  isLoading: boolean;
  fetchPendingReviews: (token: string) => Promise<void>;
  hasFetched: boolean;
}

let activeAbortController: AbortController | null = null;

const usePendingReviewsStore = create<PendingReviewsState>((set) => ({
  pendingReviewsCount: 0,
  isLoading: false,
  hasFetched: false,
  fetchPendingReviews: async (token: string) => {
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      
      set({ isLoading: true, hasFetched: false });

      const response = await ApiService.getPendingCashbacks(token, controller.signal); // Assuming getPendingCashbacks accepts a signal
      
      if (response.viewState === ViewState.DATA && response.data) {
        set({
          pendingReviewsCount: response.data.length,
          isLoading: false,
          hasFetched: true,
        });
      } else {
        set({
          pendingReviewsCount: 0,
          isLoading: false,
          hasFetched: true,
        });
      }
    } catch (error: any) { // Use 'any' for error to check 'name'
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Failed to fetch pending reviews', error);
      set({ isLoading: false, hasFetched: true, pendingReviewsCount: 0 });
    } finally {
      activeAbortController = null;
    }
  },
}));

export default usePendingReviewsStore;
