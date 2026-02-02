import { useState, useEffect, useCallback, useMemo } from 'react';
import { DhiveService } from '../services/dhive-service';
import { type AccountHistoryModel } from '../types/account-history';
import { type ClaimGraphModel, type UserGraphModel } from '../types/claim-reports';
import { subDays, subMonths } from 'date-fns';
import { ViewState } from '../types/enums';

// Date filter options, similar to Flutter's ClaimGraphFilterModel
export const dateFilters = [
  { label: 'Last Week', targetDate: () => subDays(new Date(), 7) },
  { label: 'Last 2 Weeks', targetDate: () => subDays(new Date(), 14) },
  { label: 'Last Month', targetDate: () => subMonths(new Date(), 1) },
  { label: 'Last 3 Months', targetDate: () => subMonths(new Date(), 3) },
  { label: 'Last 6 Months', targetDate: () => subMonths(new Date(), 6) },
];

const ACCOUNT_NAME = 'thedistriator';
// Per-filter in-memory cache to avoid refetch and loader flicker
type FilterKey = 'Last Week' | 'Last 2 Weeks' | 'Last Month' | 'Last 3 Months' | 'Last 6 Months';
const perFilterCache: Record<FilterKey, AccountHistoryModel[] | undefined> = {
  'Last Week': undefined,
  'Last 2 Weeks': undefined,
  'Last Month': undefined,
  'Last 3 Months': undefined,
  'Last 6 Months': undefined,
};
let activeAbortController: AbortController | null = null;

import { getBusinessName } from '../utils/claim-memo-parser';

// --- Helper functions for memo parsing (translated from ClaimGraphModel.dart) ---

const isValidClaim = (memo: string): boolean => {
  const regex = /^You claimed back (\d+\.\d{2}) %/;
  return regex.test(memo);
};

const isValidOnboarder = (memo: string): boolean => {
  const regex = /^Thank you for helping to onboard.*to Hive/;
  return regex.test(memo);
};

const isConsumerOnboarder = (memo: string): boolean => {
    const regExp = /Thank you for helping to onboard (\w+) to Hive.*https:\/\/\w+\.\w+\/@(\w+)\//;
    const match = memo.match(regExp);
    if (match) {
      const onboardName = match[1];
      const urlName = match[2];
      return onboardName === urlName;
    }
    return false;
};

const getClaimAmount = (amount: string): number => {
    if (!amount) return 0;
    return parseFloat(amount.split(' ')[0]);
}

// Helper function to merge transfers (similar to DhiveService.mergeTransfers)
const mergeTransfers = (existing: AccountHistoryModel[], incoming: AccountHistoryModel[]): AccountHistoryModel[] => {
    const map = new Map<number, AccountHistoryModel>();
    for (const item of existing) map.set(item.id, item);
    for (const item of incoming) map.set(item.id, item);
    return Array.from(map.values()).sort((a, b) => b.id - a.id);
}

// --- Simple in-memory cache for current session (newest -> oldest) ---
let sharedRawItemsCache: AccountHistoryModel[] = [];

// --- Main Hook ---

export const useClaimHistory = () => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const [rawItems, setRawItems] = useState<AccountHistoryModel[]>(() => sharedRawItemsCache);
  const [selectedFilter, setSelectedFilter] = useState(() => dateFilters[0]);

  // --- Data Processing (getGraphData logic from ClaimGraphModel.dart) ---

  const claimGraphModel: ClaimGraphModel | null = useMemo(() => {
    if (rawItems.length === 0) return null;

    const targetDate = selectedFilter.targetDate();

    // Filter items based on the selected date range first
    const filteredItems = rawItems.filter(item => {
        const itemDate = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
        return itemDate >= targetDate;
    });

    const consumers: { [key: string]: { total: number; count: number } } = {};
    const business: { [key: string]: { total: number; count: number } } = {};
    const date: { [key: string]: { total: number; count: number } } = {};
    const consumerOnboarder: { [key: string]: { total: number; count: number } } = {};
    const businessOnboarder: { [key: string]: { total: number; count: number } } = {};

    const dateFormatter = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    for (const transfer of filteredItems) {
      const op = transfer.op[1];
      if (op.from !== ACCOUNT_NAME) continue;

      const claimAmount = getClaimAmount(op.amount);

      if (isValidClaim(op.memo)) {
        // Consumer data
        consumers[op.to] = {
          total: (consumers[op.to]?.total || 0) + claimAmount,
          count: (consumers[op.to]?.count || 0) + 1,
        };

        // Business data
        const businessName = getBusinessName(op.memo);
        if (businessName) {
          business[businessName] = {
            total: (business[businessName]?.total || 0) + claimAmount,
            count: (business[businessName]?.count || 0) + 1,
          };
        }

        // Date data
        const dateKey = dateFormatter.format(new Date(transfer.timestamp));
        date[dateKey] = {
            total: (date[dateKey]?.total || 0) + claimAmount,
            count: (date[dateKey]?.count || 0) + 1,
        };

      } else if (isValidOnboarder(op.memo)) {
        if (isConsumerOnboarder(op.memo)) {
            consumerOnboarder[op.to] = {
                total: (consumerOnboarder[op.to]?.total || 0) + claimAmount,
                count: (consumerOnboarder[op.to]?.count || 0) + 1,
            };
        } else {
            businessOnboarder[op.to] = {
                total: (businessOnboarder[op.to]?.total || 0) + claimAmount,
                count: (businessOnboarder[op.to]?.count || 0) + 1,
            };
        }
      }
    }

    const toUserGraphModel = (data: { [key: string]: { total: number; count: number } }): UserGraphModel[] =>
        Object.entries(data).map(([name, values]) => ({ name, ...values }));

    const dateData = toUserGraphModel(date).sort((a, b) => new Date(b.name).getTime() - new Date(a.name).getTime());

    return {
      consumers: toUserGraphModel(consumers),
      business: toUserGraphModel(business),
      date: dateData,
      consumerOnboarder: toUserGraphModel(consumerOnboarder),
      businessOnboarder: toUserGraphModel(businessOnboarder),
    };
  }, [rawItems, selectedFilter]);

  // --- Data Fetching Logic (delegated to DhiveService cache-first) ---
  useEffect(() => {
    let isActive = true;
    const loadData = async () => {
      try {
        // Cancel any inflight request
        if (activeAbortController) {
          activeAbortController.abort();
        }
        const controller = new AbortController();
        activeAbortController = controller;

        // Serve from per-filter cache immediately if available
        const cacheKey = selectedFilter.label as FilterKey;
        const cachedForFilter = perFilterCache[cacheKey];
        if (cachedForFilter && cachedForFilter.length > 0) {
          setRawItems(cachedForFilter);
          setViewState(ViewState.DATA);
          // Still refresh in background softly
        } else {
          setViewState(ViewState.LOADING);
        }
        const targetDate = selectedFilter.targetDate();
        const transfers = await DhiveService.getTransferHistorySinceDateWithCache(ACCOUNT_NAME, targetDate, controller.signal);

        // Keep only claims and onboarder-related from our outgoing account
        const filtered = transfers.filter(item => {
          const op = item.op[1];
          if (op.from !== ACCOUNT_NAME) return false;
          return isValidClaim(op.memo) || isValidOnboarder(op.memo);
        });

        if (!isActive) return;

        // Update per-filter cache only with filtered items for this filter
        perFilterCache[cacheKey] = filtered;
        // Also maintain a global union cache for potential future usage
        sharedRawItemsCache = mergeTransfers(sharedRawItemsCache, transfers);
        setRawItems(filtered);
        setViewState(filtered.length > 0 ? ViewState.DATA : ViewState.EMPTY);
      } catch (e) {
        if (!isActive) return;
        console.error('Error loading data:', e);
        setViewState(ViewState.ERROR);
      }
    };
    loadData();
    return () => { isActive = false; };
  }, [selectedFilter]);

  const applyFilter = useCallback((filter: { label: string; targetDate: () => Date; }) => {
    // Switch filter
    setSelectedFilter(filter);
  }, [selectedFilter]);

  const displayedItems = useMemo(() => {
    if (rawItems.length === 0) return [];
    const targetDate = selectedFilter.targetDate();
    return rawItems.filter(item => {
        const itemDate = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
        return itemDate >= targetDate && isValidClaim(item.op[1].memo);
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // newest first
  }, [rawItems, selectedFilter]);

  return {
    viewState,
    claimGraphModel,
    displayedItems,
    applyFilter,
    selectedFilter,
    filters: dateFilters,
  };
};