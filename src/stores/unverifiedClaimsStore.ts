import { create } from 'zustand';
import { fetchUnverifiedClaimsApi, type UnverifiedClaimItem } from '../services/BusinessApi';

interface UnverifiedClaimsState {
  claimsMap: Record<string, number>; // businessId -> unverified_claims count
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: number | null;
  fetchUnverifiedClaims: (signal?: AbortSignal) => Promise<void>;
  getUnverifiedClaimsCount: (businessId: string) => number;
}

export const useUnverifiedClaimsStore = create<UnverifiedClaimsState>((set, get) => ({
  claimsMap: {},
  isLoading: false,
  error: null,
  lastFetchedAt: null,
  fetchUnverifiedClaims: async (signal?: AbortSignal) => {
    set({ isLoading: true, error: null });
    try {
      const data = await fetchUnverifiedClaimsApi(signal);
      // Convert array to map for easy lookup
      const claimsMap: Record<string, number> = {};
      data.forEach((item) => {
        claimsMap[item.id] = item.unverified_claims;
      });
      set({ 
        claimsMap, 
        isLoading: false, 
        lastFetchedAt: Date.now(),
        error: null 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch unverified claims', 
        isLoading: false 
      });
    }
  },
  getUnverifiedClaimsCount: (businessId: string) => {
    const { claimsMap } = get();
    return claimsMap[businessId] ?? 0;
  },
}));

