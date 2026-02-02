import { create } from 'zustand';
import { ApiService } from '../services/api';
import { getToken } from '../utils/auth-utils';
import type { ClaimStatusDTO } from '../types/cashback-status';
import { useAuthStore } from 'hive-authentication';

interface CashbackState {
  approvedCount: number;
  fetchApprovedCount: (force?: boolean) => Promise<void>;
  clearCount: () => void;
}

let activeAbortController: AbortController | null = null;

export const useCashbackStore = create<CashbackState>((set, get) => ({
  approvedCount: 0,
  fetchApprovedCount: async (force = false) => {
    // Abort any previous ongoing request
    if (activeAbortController) {
      activeAbortController.abort();
    }
    const controller = new AbortController();
    activeAbortController = controller;

    const { currentUser } = useAuthStore.getState();
    const token = currentUser ? getToken(currentUser) : '';
    if (!token) {
      activeAbortController = null; // Clear controller if no token
      return;
    }

    if (!force && get().approvedCount > 0) {
      activeAbortController = null; // Clear controller if not forcing and count exists
      return;
    }

    let count = 0;
    let page = 1;
    let totalPages = 1;

    try {
      do {
        // Fetch all statuses, we will filter client-side for 'approved-v3'
        const response = await ApiService.getClaimStatus(token, page, 50, controller.signal, undefined);
        
        const approvedClaims = response.data.claims.filter(
          (claim: ClaimStatusDTO) => (claim.status as string) === 'approved-v3'
        );
        count += approvedClaims.length;
        totalPages = response.data.pagination.totalPages;
        page++;
      } while (page <= totalPages);

      set({ approvedCount: count });
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        // Request was aborted, no need to log as an error
        return;
      }
      console.error('Failed to fetch approved cashback count:', error);
    } finally {
      // Clear the active abort controller after the request is finished
      activeAbortController = null;
    }
  },
  clearCount: () => {
    set({ approvedCount: 0 });
  }
}));
