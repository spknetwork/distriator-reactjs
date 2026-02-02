/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback } from 'react';
import { useBusinessesStore } from '../stores/businessesStore';
import { useAuthData } from '../utils/auth-utils';
import { ViewState } from '../types/enums';
import { BusinessReviewService } from '../services/business-review-service';

export const useBusinesses = () => {
  const { token } = useAuthData();
  const store = useBusinessesStore();

  const refreshBusinesses = useCallback(async (signal?: AbortSignal) => {
    store.setViewState(ViewState.LOADING);
    try {
      const data = await store.fetchBusinesses(signal);
      store.setBusinessData(data);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        store.setViewState(ViewState.ERROR);
      }
    }
  }, [store]);

  useEffect(() => {
    let isActive = true;
    const abortController = new AbortController();

    const initialFetch = async () => {
      try {
        const data = await store.fetchBusinesses(abortController.signal);
        if (isActive) {
          store.setBusinessData(data);
        }
      } catch (error: any) {
        if (isActive && error.name !== 'AbortError') {
          store.setViewState(ViewState.ERROR);
        }
      }
    };

    if (store.businesses.length === 0) {
        store.setViewState(ViewState.LOADING);
        initialFetch();
    }

    return () => {
      isActive = false;
      abortController.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...store,
    refreshBusinesses,
    deleteBusiness: async (businessId: string) => {
      await store.deleteBusiness(businessId, token);
      // Clear cache for business reviews after deletion
      BusinessReviewService.clearReviewsCache(businessId);
      await refreshBusinesses();
    },
    createBusiness: async (businessData: any, isMini?: boolean) => {
      await store.createBusiness(businessData, token, isMini);
      await refreshBusinesses();
    },
    updateBusiness: async (businessData: any, isOnboardingOnly?: boolean) => {
      await store.updateBusiness(businessData, token, isOnboardingOnly);
      await refreshBusinesses();
    },
  };
};
