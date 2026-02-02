/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { ViewState } from '../types/enums';

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

type MonthParam = 'current' | 'current-1' | 'current-2' | 'current-3' | 'current-4' | 'current-5';

export interface LeaderboardRow {
  name: string;
  total: number; // amount
  count: number; // count
}

interface LeaderboardState {
  viewState: ViewState;
  data: LeaderboardRow[];
  totalAmount: string;
  filters: { label: string; monthParam: MonthParam }[];
  selectedFilter: { label: string; monthParam: MonthParam };
  applyFilter: (filter: { label: string; monthParam: MonthParam }) => void;
  fetchForMonth: (month: MonthParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

const computeMonthFilters = (): { label: string; monthParam: MonthParam }[] => {
  const now = new Date();
  const labels: { label: string; monthParam: MonthParam }[] = [];
  for (let i = 0; i <= 5; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const monthParam = (`current${i === 0 ? '' : `-${i}`}`) as MonthParam;
    labels.push({ label, monthParam });
  }
  return labels;
};

export const useLeaderboardStore = create<LeaderboardState>((set, get) => ({
  viewState: ViewState.LOADING,
  data: [],
  totalAmount: '0',
  filters: computeMonthFilters(),
  selectedFilter: computeMonthFilters()[0],

  applyFilter: (filter) => {
    set({ selectedFilter: filter });
    void get().fetchForMonth(filter.monthParam);
  },

  fetchForMonth: async (month, signal) => {
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/leaderboard?month=${month}`, {
        method: 'GET',
        signal: signal || controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as {
        summary?: { totalAmount?: string };
        data?: { byAmount?: { username: string; totalAmount?: string }[]; byCount?: { username: string; totalCount?: number }[] };
      };

      const byAmount = json.data?.byAmount || [];
      const byCount = json.data?.byCount || [];
      const countMap = new Map<string, number>();
      for (const c of byCount) {
        countMap.set(c.username, Number(c.totalCount ?? 0));
      }
      const rows: LeaderboardRow[] = byAmount.map(a => ({
        name: a.username,
        total: Number.parseFloat(a.totalAmount ?? '0') || 0,
        count: countMap.get(a.username) ?? 0,
      }));

      set({
        data: rows,
        totalAmount: json.summary?.totalAmount ?? '0',
        viewState: rows.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) return;
      console.error('Failed to fetch leaderboard:', e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));


