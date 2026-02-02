import { create } from "zustand";
import { ViewState } from "../types/enums";

export interface UserGraphItem {
  name: string; // YYYY-MM-DD
  total: number; // sum of amounts that day
  count: number; // number of records that day
}

const VITE_HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER;

interface ApiResponse {
  period: {
    days: string;
    daysCount: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalDays: number;
    totalSpend: number;
    totalRecords: number;
  };
  data: {
    date: string;
    cumulative: number;
    total: number;
  }[];
}

interface TotalSpentState {
  viewState: ViewState;
  data: UserGraphItem[];
  totalAmount: string;
  fetch: (signal?: AbortSignal) => Promise<void>;
}

let activeAbortController: AbortController | null = null;

export const useTotalSpentStore = create<TotalSpentState>((set) => ({
  viewState: ViewState.LOADING,
  data: [],
  totalAmount: "0.000",

  fetch: async (signal) => {
    try {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      set({ viewState: ViewState.LOADING });

      const res = await fetch(`${VITE_HD_API_SERVER}/reports/total-spend`, {
        method: "GET",
        signal: signal || controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as ApiResponse;

      const { data: apiData, summary } = json;
      if (!apiData || !Array.isArray(apiData)) throw new Error("Invalid data");

      const parsedData = apiData.map((item) => {
        const dateStr = item.date; // "2024-06-21"
        const total = item.cumulative; // number
        const date = new Date(dateStr);
        return { name: dateStr, total, sortDate: date };
      });

      // Sort by date
      parsedData.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

      const items: UserGraphItem[] = parsedData.map((item) => ({
        name: item.name,
        total: Number(item.total.toFixed(3)),
        count: 1,
      }));

      const totalAmount = summary.totalSpend.toFixed(3);

      set({
        data: items,
        totalAmount,
        viewState: items.length ? ViewState.DATA : ViewState.EMPTY,
      });
    } catch (e: unknown) {
      if (
        e instanceof Error &&
        (e.name === "AbortError" || e.message?.includes("aborted"))
      )
        return;
      console.error("Failed to fetch total spent:", e);
      set({ viewState: ViewState.ERROR });
    }
  },
}));
