import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';
import { mapFilterLabelToDays, type DaysParam } from '../utils/report-filters';
import type { UserGraphModel } from '../types/claim-reports';

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

interface ApiItem {
  to_account: string;
  amount: string; // e.g. "0.020 HBD"
  businessName: string;
  timestamp: string; // ISO
}

interface ApiResponse {
  period: {
    days: string;
    daysCount: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalRecords: number;
    totalAmount: string;
  };
  data: ApiItem[];
}

interface MyActivityReportState {
  viewState: ViewState;
  chartData: UserGraphModel[];
  filters: { label: string; targetDate: () => Date }[];
  selectedFilter: { label: string; targetDate: () => Date };
  applyFilter: (filter: { label: string; targetDate: () => Date }, token: string) => void;
  fetchForDays: (days: DaysParam, token: string, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useMyActivityReportStore = create<MyActivityReportState>((set, get) => ({
  viewState: ViewState.LOADING,
  chartData: [],
  filters: dateFilters,
  selectedFilter: dateFilters[0],

  applyFilter: (filter, token) => {
    set({ selectedFilter: filter });
    const days = mapFilterLabelToDays(filter.label);
    void get().fetchForDays(days, token);
  },

  fetchForDays: async (days, token, signal) => {
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/myClaims?days=${days}`, {
        method: 'GET',
        headers: {
          'Authorization': token,
          'accept': 'application/json',
        },
        signal: signal || controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as ApiResponse;

      // Group data by date and sum amounts
      const dateGroups: Record<string, { total: number; count: number }> = {};

      (json.data || []).forEach((item) => {
        const date = new Date(item.timestamp);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        const amount = parseFloat(item.amount.split(' ')[0]) || 0;

        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = { total: 0, count: 0 };
        }
        dateGroups[dateKey].total += amount;
        dateGroups[dateKey].count += 1;
      });

      // Convert to UserGraphModel array and sort by date
      const chartData: UserGraphModel[] = Object.entries(dateGroups)
        .map(([dateKey, { total, count }]) => ({
          name: new Date(dateKey).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          total,
          count,
        }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()); // Sort by date ascending

      set({
        chartData,
        viewState: chartData.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) {
        return;
      }
      console.error('Failed to fetch myClaims:', e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));
