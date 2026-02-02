import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';
import { mapFilterLabelToDays, type DaysParam } from '../utils/report-filters';

export interface BusinessGraphItem {
  name: string; // businessName
  total: number; // totalAmount
  count: number; // totalRecords
}

// using shared DaysParam + mapFilterLabelToDays

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

interface ApiRow {
  businessName: string;
  totalAmount: string;
  totalRecords: number;
}

interface TopBusinessesState {
  viewState: ViewState;
  data: BusinessGraphItem[];
  totalAmount: string;
  filters: { label: string; targetDate: () => Date }[];
  selectedFilter: { label: string; targetDate: () => Date };
  applyFilter: (filter: { label: string; targetDate: () => Date }) => void;
  fetchForDays: (days: DaysParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useTopBusinessesStore = create<TopBusinessesState>((set, get) => ({
  viewState: ViewState.LOADING,
  data: [],
  totalAmount: '0',
  filters: dateFilters,
  selectedFilter: dateFilters[0],

  applyFilter: (filter) => {
    set({ selectedFilter: filter });
    const days = mapFilterLabelToDays(filter.label);
    void get().fetchForDays(days);
  },

  fetchForDays: async (days, signal) => {
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/topBusinesses?days=${days}`, {
        method: 'GET',
        signal: signal || controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as { summary?: { totalAmount?: string }; data?: ApiRow[] };

      const items = (json.data || []).map<BusinessGraphItem>((row) => ({
        name: row.businessName,
        total: Number.parseFloat(row.totalAmount ?? '0') || 0,
        count: row.totalRecords ?? 0,
      }));

      set({
        data: items,
        totalAmount: json.summary?.totalAmount || '0',
        viewState: items.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return;
      }
      console.error('Failed to fetch topBusinesses:', e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));


