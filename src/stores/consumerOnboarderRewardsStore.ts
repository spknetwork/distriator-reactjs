import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';
import { mapFilterLabelToDays, type DaysParam } from '../utils/report-filters';
const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

export interface UserGraphModel {
  name: string;
  total: number;
  count: number;
}

// using shared DaysParam + mapFilterLabelToDays

interface ApiResponseItem {
  username: string;
  totalAmount: string; // e.g. "5.250"
}

interface ConsumerOnboarderRewardsState {
  viewState: ViewState;
  data: UserGraphModel[];
  totalAmount: string;
  selectedFilter: { label: string; targetDate: () => Date };
  filters: { label: string; targetDate: () => Date }[];
  applyFilter: (filter: { label: string; targetDate: () => Date }) => void;
  fetchForDays: (days: DaysParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useConsumerOnboarderRewardsStore = create<ConsumerOnboarderRewardsState>((set, get) => ({
  viewState: ViewState.LOADING,
  data: [],
  totalAmount: '0',
  selectedFilter: dateFilters[0],
  filters: dateFilters,

  applyFilter: (filter) => {
    set({ selectedFilter: filter });
    const days = mapFilterLabelToDays(filter.label);
    void get().fetchForDays(days);
  },

  fetchForDays: async (days, signal) => {
    try {
      // cancel inflight
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const response = await fetch(
        `${VITE_HD_API_SERVER}/reports/consumerOnboarderRewards?days=${days}`,
        { method: 'GET', signal: signal || controller.signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json() as { summary?: { totalRewards?: string }; data?: ApiResponseItem[] };
      const items = (json.data || []).map<UserGraphModel>((it) => ({
        name: it.username,
        total: Number.parseFloat(it.totalAmount ?? '0') || 0,
        // Count is not provided by API; keep as 0 to preserve chart shape
        count: 0,
      }));

      set({
        data: items,
        totalAmount: json.summary?.totalRewards || '0',
        viewState: items.length > 0 ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      // Ignore abort errors to avoid transient error flashes
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) {
        return;
      }
      set({ viewState: ViewState.ERROR });
      console.error('Failed to fetch consumerOnboarderRewards:', e);
    }
  },
}));


