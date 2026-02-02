/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from 'react';
import { type BusinessHistoryModel } from '../types/business-history';
import { ViewState } from '../types/enums';
import { useBusinessHistoryStore } from '../stores/businessHistoryStore';
import { BusinessReviewService } from '../services/business-review-service';

export const useBusinessHistory = (token?: string, businessUserName?: string) => {
  const { history, viewState, fetchBusinessHistory, setViewState, loadCachedFirst, lastFetchedAt } = useBusinessHistoryStore();
  const STALE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    if (!token || !businessUserName) {
      // Stay in LOADING until inputs are ready to avoid empty/error flicker
      setViewState(ViewState.LOADING);
      return;
    }

    const abortController = new AbortController();
    let isActive = true;

    const fetchHistory = async () => {
      try {
        // While fetching with no cache, keep LOADING to avoid error flicker
        const data = await fetchBusinessHistory(token, businessUserName, abortController.signal);
        if (!isActive) return;
        if (data.length === 0) {
          setViewState(ViewState.EMPTY);
        }
      } catch (error: any) {
        const msg = String(error?.message || '').toLowerCase();
        const isAbort = error?.name === 'AbortError' || msg.includes('aborted') || msg.includes('abort') || msg.includes('canceled') || msg.includes('cancelled');
        if (isAbort) {
          return;
        }
        if (!isActive) return;
        // Avoid setting ERROR on first load; keep previous state (LOADING/EMPTY)
        console.error('Error fetching business history:', error);
      }
    };

    // Reset to loading when business changes, then load cached-first to avoid showing previous business data
    setViewState(ViewState.LOADING);
    loadCachedFirst(businessUserName);
    // Fetch only if stale or never fetched (read direct from service to avoid stale closure)
    const fetchedAt = BusinessReviewService.getHistoryLastFetchedAt(businessUserName) || lastFetchedAt;
    const shouldFetch = !fetchedAt || (Date.now() - fetchedAt) > STALE_TTL_MS;
    if (shouldFetch) {
      fetchHistory();
    }

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [token, businessUserName]);

  return {
    history: history as BusinessHistoryModel[],
    viewState,
  };
};