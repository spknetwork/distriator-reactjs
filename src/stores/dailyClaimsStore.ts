import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';

export interface DailyGraphItem {
  name: string; // date string used by chart
  total: number; // totalAmount
  count: number; // totalRecords
}

type DaysParam = 'lastWeek' | 'last2Weeks' | 'lastMonth' | 'last3Months' | 'last6Months';

const mapFilterLabelToDays = (label: string): DaysParam => {
  switch (label) {
    case 'Last Week':
      return 'lastWeek';
    case 'Last 2 Weeks':
      return 'last2Weeks';
    case 'Last Month':
      return 'lastMonth';
    case 'Last 3 Months':
      return 'last3Months';
    case 'Last 6 Months':
      return 'last6Months';
    default:
      return 'lastWeek';
  }
};

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

interface ApiRow {
  date: string; // e.g. "25-Jan-2025"
  totalAmount: string;
  totalRecords: number;
}

interface DailyClaimsState {
  viewState: ViewState;
  data: DailyGraphItem[];
  totalAmount: string;
  filters: { label: string; targetDate: () => Date }[];
  selectedFilter: { label: string; targetDate: () => Date };
  applyFilter: (filter: { label: string; targetDate: () => Date }) => void;
  fetchForDays: (days: DaysParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useDailyClaimsStore = create<DailyClaimsState>((set, get) => ({
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

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/dailyClaims?days=${days}`, {
        method: 'GET',
        signal: signal || controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as { summary?: { totalAmount?: string }; data?: ApiRow[] };

      const items = (json.data || []).map<DailyGraphItem>((row) => ({
        name: row.date, // keep original label; ReportChart handles date parsing for line chart
        total: Number.parseFloat(row.totalAmount ?? '0') || 0,
        count: row.totalRecords ?? 0,
      }));

      set({
        data: items,
        totalAmount: json.summary?.totalAmount || '0',
        viewState: items.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) {
        return;
      }
      console.error('Failed to fetch dailyClaims:', e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));


