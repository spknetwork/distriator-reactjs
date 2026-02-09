/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { BusinessReviewService } from '../services/business-review-service';
import { type BusinessReviewModel, ReviewStatus } from '../types/business-review';
import { ViewState } from '../types/enums';
import { type BusinessModel } from '../types/business';
import { useAuthData } from '../utils/auth-utils';
import { useReportedContentStore } from '../stores/reportedContentStore';

export const useBusinessReviews = (
  business?: BusinessModel,
  userRole?: string,
  username?: string,
) => {
  const { reportedUsers, reportedReviews } = useReportedContentStore();
  const [rawReviews, setRawReviews] = useState<BusinessReviewModel[]>([]);
  const [reviews, setReviews] = useState<BusinessReviewModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const {token} = useAuthData();
  const [updatingReviews, setUpdatingReviews] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<boolean>(false);

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

  // Effect to filter reviews when raw data or filters change
  useEffect(() => {
    if (fetchError) {
      setViewState(ViewState.ERROR);
      return;
    }

    // First apply reported content filter
    let filtered = rawReviews.filter(review => {
      const isUserReported = reportedUsers.includes(review.username);
      const isReviewReported = reportedReviews.some(r => {
        const author = r.author ?? (r as { name?: string }).name;
        return r.permlink === review.permlink && author === review.username;
      });
      return !isUserReported && !isReviewReported;
    });

    // Then apply visibility filter
    const hasPermission = hasHideUnhidePermission();
    if (!hasPermission) {
      filtered = filtered.filter((review) => review.reviewStatus !== ReviewStatus.HIDDEN);
    }

    setReviews(filtered);

    // Only update viewState if we are not loading. 
    // But how do we know if we are loading? We can check if rawReviews was just set?
    // Let's rely on `rawReviews` length check roughly, or manage viewState separately.
    // If we have data but filter hides everything -> ViewState.EMPTY (or DATA but empty list?)
    // Usually ViewState.EMPTY means "no content".
    if (rawReviews.length > 0) {
      setViewState(filtered.length > 0 ? ViewState.DATA : ViewState.EMPTY);
    } else if (!fetchError) {
      // Fetch completed with no reviews; stop loading and show empty state
      setViewState(ViewState.EMPTY);
    }
  }, [rawReviews, reportedUsers, reportedReviews, hasHideUnhidePermission, fetchError, viewState]);

  // Fetch Effect - Only depends on business.id
  useEffect(() => {
    if (!business?.id) {
      setViewState(ViewState.EMPTY);
      setRawReviews([]);
      return;
    }

    setViewState(ViewState.LOADING);
    setFetchError(false);

    const abortController = new AbortController();

    const fetchReviews = async () => {
      try {
        const response = await BusinessReviewService.getBusinessReviews(business.id!, abortController.signal);
        if (abortController.signal.aborted) return;

        if (response.isSuccess && response.data) {
          setRawReviews(response.data);
          // ViewState will be updated by the filter effect
        } else {
          setFetchError(true);
          setViewState(ViewState.ERROR);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setFetchError(true);
          setViewState(ViewState.ERROR);
        }
      }
    };

    fetchReviews();

    return () => {
      abortController.abort();
    };
  }, [business?.id]); // STRICT dependency on ID only

  const updateReviewStatus = async (permlink: string, hide: boolean) => {
    if (!token || !business?.id) return;

    setUpdatingReviews((prev) => [...prev, permlink]);

    try {
      const response = await BusinessReviewService.updateReviewStatus(
        rawReviews.find((r) => r.permlink === permlink)?.username || '',
        permlink,
        token,
        hide
      );

      if (response.isSuccess) {
        // Update rawReviews directly
        setRawReviews(prevRaw =>
          prevRaw.map((r) =>
            r.permlink === permlink ? { ...r, reviewStatus: hide ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE } : r
          )
        );

        // Manually update the service cache since we are not refetching
        BusinessReviewService.clearReviewsCache(business.id);
      }
    } catch (error) {
      console.error('Error updating review status:', error);
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