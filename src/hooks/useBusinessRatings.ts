
import { useState, useEffect, useCallback } from 'react';
import { BusinessRatingService } from '../services/business-rating-service';
import { type BusinessRatingModel } from '../types/business-rating';
import { ViewState } from '../types/enums';
import { type BusinessModel } from '../types/business';

export const useBusinessRatings = (business?: BusinessModel) => {
  const [ratings, setRatings] = useState<BusinessRatingModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  const filterAndSetRatings = useCallback((ratingList: BusinessRatingModel[]) => {
    setRatings(ratingList);
    setViewState(ratingList.length > 0 ? ViewState.DATA : ViewState.EMPTY);
  }, []);

  useEffect(() => {
    if (!business?.id) {
      setViewState(ViewState.EMPTY);
      return;
    }

    setViewState(ViewState.LOADING);

    const abortController = new AbortController();

    const fetchRatings = async () => {
      try {
        const response = await BusinessRatingService.getBusinessRatings(business.id!, 1, 10, 'date-recent', abortController.signal);
        if (abortController.signal.aborted) return;

        if (response.isSuccess && response.data) {
          filterAndSetRatings(response.data.data);
        } else {
          setViewState(ViewState.ERROR);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          setViewState(ViewState.ERROR);
        }
      }
    };

    fetchRatings();

    return () => {
      abortController.abort();
    };
  }, [business, filterAndSetRatings]);

  return {
    ratings,
    viewState,
  };
};
