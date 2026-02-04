import { useState, useEffect } from 'react';
import { BusinessRatingService } from '../services/business-rating-service';
import { type BusinessRatingModel } from '../types/business-rating';
import { ViewState } from '../types/enums';
import { type BusinessModel } from '../types/business';
import { useReportedContentStore } from '../stores/reportedContentStore';

export const useBusinessRatings = (
  business?: BusinessModel
) => {
  const { reportedUsers, reportedReviews } = useReportedContentStore();
  const [rawRatings, setRawRatings] = useState<BusinessRatingModel[]>([]);
  const [ratings, setRatings] = useState<BusinessRatingModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const [fetchError, setFetchError] = useState<boolean>(false);

  // Filter effect
  useEffect(() => {
    if (fetchError) {
      setViewState(ViewState.ERROR);
      return;
    }

    const filtered = rawRatings.filter(rating => {
      const isUserReported = reportedUsers.includes(rating.ratingAuthor);
      const isReviewReported = reportedReviews.some(r => {
        const author = r.author ?? (r as { name?: string }).name;
        return r.permlink === rating.ratingPermlink && author === rating.ratingAuthor;
      });
      return !isUserReported && !isReviewReported;
    });

    setRatings(filtered);

    // Update viewstate based on results
    if (rawRatings.length > 0) {
      setViewState(filtered.length > 0 ? ViewState.DATA : ViewState.EMPTY);
    } else if (!fetchError && viewState !== ViewState.LOADING) {
      setViewState(ViewState.EMPTY);
    }
  }, [rawRatings, reportedUsers, reportedReviews, fetchError]);

  // Fetch effect
  useEffect(() => {
    if (!business?.id) {
      setViewState(ViewState.EMPTY);
      setRawRatings([]);
      return;
    }

    setViewState(ViewState.LOADING);
    setFetchError(false);

    const abortController = new AbortController();

    const fetchRatings = async () => {
      // guard against missing business id
      if (!business?.id) return;

      try {
        const response = await BusinessRatingService.getBusinessRatings(business.id, 1, 20, 'date-recent', abortController.signal);
        if (abortController.signal.aborted) return;

        if (response.data) {
          setRawRatings(response.data.data);
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

    fetchRatings();

    return () => {
      abortController.abort();
    };
  }, [business?.id]); // Strict dependency on ID only

  return {
    ratings,
    viewState,
  };
};
