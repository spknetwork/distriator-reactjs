import { create } from 'zustand';
import { ViewState } from '../types/enums';
import { dateFilters } from '../hooks/useClaimHistory';
import { mapFilterLabelToDays, type DaysParam } from '../utils/report-filters';
import type { AccountHistoryModel } from '../types/account-history';

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

// using shared DaysParam + mapFilterLabelToDays

interface ApiItem {
  to_account: string;
  amount: string; // e.g. "5.250 HBD"
  businessName: string;
  timestamp: string; // ISO
}

interface RecentClaimsState {
  viewState: ViewState;
  items: AccountHistoryModel[];
  totalAmount: string;
  filters: { label: string; targetDate: () => Date }[];
  selectedFilter: { label: string; targetDate: () => Date };
  applyFilter: (filter: { label: string; targetDate: () => Date }) => void;
  fetchForDays: (days: DaysParam, signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useRecentClaimsStore = create<RecentClaimsState>((set, get) => ({
  viewState: ViewState.LOADING,
  items: [],
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

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/recentClaimRecords?days=${days}`, {
        method: 'GET',
        signal: signal || controller.signal,
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json() as { period?: any; summary?: { totalRecords: number; totalAmount: string }; data?: ApiItem[] };

      // Map API to AccountHistoryModel expected by UI
      let id = Date.now();
      const items: AccountHistoryModel[] = (json.data || []).map((row) => {
        id += 1;
        return {
          id,
          trx_id: '',
          block: 0,
          trx_in_block: 0,
          op_in_trx: 0,
          virtual_op: 0,
          timestamp: row.timestamp.replace('Z', ''),
          op: [
            'transfer',
            {
              from: 'thedistriator',
              to: row.to_account,
              amount: row.amount,
              // Memo constructed to be parsable by existing UI helpers
              memo: `You claimed back 00.00 % by adding review of a ${row.businessName} - https://hive.blog/@${row.to_account}/`,
            },
          ],
        };
      });

      // Sort newest first to match existing page
      items.sort((a, b) => new Date(b.timestamp + 'Z').getTime() - new Date(a.timestamp + 'Z').getTime());

      set({
        items,
        totalAmount: json.summary?.totalAmount || '0',
        viewState: items.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || e?.message?.includes('aborted')) {
        return;
      }
      console.error('Failed to fetch recentClaimRecords:', e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));


