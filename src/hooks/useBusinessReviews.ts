/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { BusinessReviewService } from '../services/business-review-service';
import { type BusinessReviewModel, ReviewStatus } from '../types/business-review';
import { ViewState } from '../types/enums';
import { type BusinessModel } from '../types/business';
import { useAuthData } from '../utils/auth-utils';

export const useBusinessReviews = (business?: BusinessModel, userRole?: string, username?: string) => {
  const [reviews, setReviews] = useState<BusinessReviewModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const {token} = useAuthData();
  const [updatingReviews, setUpdatingReviews] = useState<string[]>([]);

  const hasEditPermission = useCallback(() => {
    if (!userRole || !username) return false;
    if (userRole === 'admin' || userRole === 'super') return true;
    if (!business) return false;
    if (userRole === 'owner' && business.distriator.owner === username) return true;
    if (userRole === 'guide' && business.distriator.guides?.some(g => g.name === username)) return true;
    return false;
  }, [business, userRole, username]);

  const hasHideUnhidePermission = useCallback(() => {
    if (!userRole || !username) return false;
    if (userRole === 'admin' || userRole === 'super') return true;
    if (!business) return false;
    if (userRole === 'owner' && business.distriator.owner === username) return true;
    if (business.distriator.guides?.some(g => g.name === username)) return true;
    return false;
  }, [business, userRole, username]);

  const filterAndSetReviews = useCallback((reviewList: BusinessReviewModel[]) => {
    const hasPermission = hasHideUnhidePermission();
    const filtered = hasPermission
      ? reviewList
      : reviewList.filter((review) => review.reviewStatus !== ReviewStatus.HIDDEN);

    setReviews(filtered);
    setViewState(filtered.length > 0 ? ViewState.DATA : ViewState.EMPTY);
  }, [hasHideUnhidePermission]);

  useEffect(() => {
    if (!business?.id) {
      setViewState(ViewState.EMPTY);
      return;
    }

    setViewState(ViewState.LOADING);

    const abortController = new AbortController();

    const fetchReviews = async () => {
      try {
        const response = await BusinessReviewService.getBusinessReviews(business.id!, abortController.signal);
        if (abortController.signal.aborted) return;

        if (response.isSuccess && response.data) {
          filterAndSetReviews(response.data);
        } else {
          setViewState(ViewState.ERROR);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setViewState(ViewState.ERROR);
        }
      }
    };

    fetchReviews();

    return () => {
      abortController.abort();
    };
  }, [business, filterAndSetReviews]);

  const updateReviewStatus = async (permlink: string, hide: boolean) => {
    if (!token || !business?.id) return;

    setUpdatingReviews((prev) => [...prev, permlink]);

    try {
      const response = await BusinessReviewService.updateReviewStatus(
        reviews.find((r) => r.permlink === permlink)?.username || '',
        permlink,
        token,
        hide
      );

      if (response.isSuccess) {
        // Create a new reviews array with the updated status
        const updatedReviews = reviews.map((r) =>
          r.permlink === permlink ? { ...r, reviewStatus: hide ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE } : r
        );
        // Re-apply filters and update state
        filterAndSetReviews(updatedReviews);

        // Manually update the service cache since we are not refetching
        BusinessReviewService.clearReviewsCache(business.id);
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      // Optionally revert state or show an error toast
    } finally {
      setUpdatingReviews((prev) => prev.filter((p) => p !== permlink));
    }
  };

  return {
    reviews,
    viewState,
    hasEditPermission: hasEditPermission(),
    hasHideUnhidePermission: hasHideUnhidePermission(),
    updateReviewStatus,
    updatingReviews,
  };
};