import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';
import { mapFilterLabelToDays, type DaysParam } from '../utils/report-filters';

export interface CumulativeGraphItem {
  name: string; // date label as provided e.g., 2024-08-26
  total: number; // cumulative count
  count: number; // daily count (used when toggled to count)
}

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

// interface ApiRow {
//   date: string;
//   count: number;
//   cumulative: number;
// }

interface CumulativeBusinessesState {
  viewState: ViewState;
  data: CumulativeGraphItem[];
  totalAmount: string;
  filters: { label: string; targetDate: () => Date }[];
  selectedFilter: { label: string; targetDate: () => Date };
  applyFilter: (filter: { label: string; targetDate: () => Date }) => void;
  fetchForDays: (days: DaysParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useCumulativeBusinessesStore = create<CumulativeBusinessesState>((set, get) => ({
  viewState: ViewState.LOADING,
  data: [],
  totalAmount: '',
  filters: dateFilters,
  selectedFilter: dateFilters[0],

  applyFilter: (filter) => {
    set({ selectedFilter: filter });
    const days = mapFilterLabelToDays(filter.label);
    void get().fetchForDays(days);
  },

  fetchForDays: async (_days, signal) => {
    // Note: cumulativeNewBusinesses endpoint returns full lifetime data, days parameter is ignored
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/cumulativeNewBusinesses`, {
        method: 'GET',
        signal: signal || controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Handle both array response and object with data property
      const dataArray = Array.isArray(json) ? json : (json.data || []);

      const items: CumulativeGraphItem[] = dataArray.map((row: any) => ({
        name: row.date,
        total: Number(row.cumulative || 0),
        count: Number(row.count || 0),
      }));

      // Sort by date ascending. Support ISO date strings (YYYY-MM-DD)
      items.sort((a, b) => {
        const dateA = new Date(a.name).getTime();
        const dateB = new Date(b.name).getTime();
        return dateA - dateB;
      });

      // Get the total from the last item's cumulative value (since it's cumulative data)
      const totalCumulative = items.length > 0 ? items[items.length - 1].total : 0;

      set({
        data: items,
        totalAmount: String(json.summary?.totalBusinesses ?? totalCumulative),
        viewState: items.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return;
      console.error('Failed to fetch cumulative businesses:', e);
      console.error('Error details:', e.message);
      set({ viewState: ViewState.ERROR });
    }
  },
}));


