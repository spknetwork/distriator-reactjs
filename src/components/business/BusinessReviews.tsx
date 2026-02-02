import { useState } from 'react';
import { ExternalLink, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { type BusinessReviewModel, ReviewStatus } from '../../types/business-review';
import { ViewState } from '../../types/enums';
import { ThreeDotMenu } from '../ThreeDotMenu';
import { useAuthContext } from '../../context/AuthContext';

interface BusinessReviewsProps {
  reviews: BusinessReviewModel[];
  viewState: ViewState;
  hasHideUnhidePermission: boolean;
  updateReviewStatus: (permlink: string, hide: boolean) => Promise<void>;
  updatingReviews: string[];
}

export function BusinessReviews({
  reviews,
  viewState,
  hasHideUnhidePermission,
  updateReviewStatus,
  updatingReviews,
}: BusinessReviewsProps) {
  const [loadedAvatars, setLoadedAvatars] = useState<{ [key: string]: boolean }>({});
  const [loadedPhotos, setLoadedPhotos] = useState<{ [key: string]: boolean }>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});
  const { currentUser } = useAuthContext();

  const isSingleCard = reviews.length === 1;

  if (viewState === ViewState.LOADING) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (viewState === ViewState.ERROR) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load reviews</p>
      </div>
    );
  }

  if (viewState === ViewState.EMPTY || reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews available</p>
      </div>
    );
  }

  const handlePostClick = (review: BusinessReviewModel) => {
    const url = `https://hive.blog/@${review.username}/${review.permlink}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePreviousPhoto = (reviewId: string, totalPhotos: number) => {
    setCurrentPhotoIndex(prev => {
      const newIndex = prev[reviewId] ? (prev[reviewId] - 1 + totalPhotos) % totalPhotos : totalPhotos - 1;
      setLoadedPhotos(lp => ({ ...lp, [reviewId]: false })); // Reset on index change
      return { ...prev, [reviewId]: newIndex };
    });
  };
  const handleNextPhoto = (reviewId: string, totalPhotos: number) => {
    setCurrentPhotoIndex(prev => {
      const newIndex = prev[reviewId] !== undefined ? (prev[reviewId] + 1) % totalPhotos : 1;
      setLoadedPhotos(lp => ({ ...lp, [reviewId]: false })); // Reset on index change
      return { ...prev, [reviewId]: newIndex };
    });
  };


  const getCurrentPhotoIndex = (reviewId: string) => {
    return currentPhotoIndex[reviewId] || 0;
  };

  return (
    <div
      className={
        isSingleCard
          ? "flex justify-center w-full"
          : "flex overflow-x-auto gap-6 pb-4"
      }
    >
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-card rounded-lg border border-border p-4 space-y-4 w-80 flex-shrink-0"
        >
          {/* User Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                {!loadedAvatars[review.id] && (
                  <div className="absolute inset-0 rounded-full bg-muted animate-pulse"></div>
                )}
                <img
                  src={`https://images.hive.blog/u/${review.username}/avatar`}
                  alt={`${review.username} avatar`}
                  className={`w-10 h-10 rounded-full object-cover transition-opacity duration-300 ${loadedAvatars[review.id] ? 'opacity-100' : 'opacity-0'
                    }`}
                  onLoad={() => setLoadedAvatars((prev) => ({ ...prev, [review.id]: true }))}
                />
              </div>

              <div>
                <p className="font-semibold text-foreground">@{review.username}</p>
                {review.created && (
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(review.created, { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasHideUnhidePermission && review.reviewStatus !== ReviewStatus.HIDDEN && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    updateReviewStatus(review.permlink, true);
                  }}
                  disabled={updatingReviews.includes(review.permlink)}
                  className="text-sm text-destructive hover:text-destructive/80 disabled:opacity-50"
                >
                  {updatingReviews.includes(review.permlink) ? 'Hiding...' : 'Hide'}
                </button>
              )}
              {currentUser && (
                <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                  <ThreeDotMenu />
                </div>
              )}
            </div>
          </div>

          {/* Review Content */}
          <div className="pb-0 mb-1">
            <div className="relative">
              {review.photos.length > 0 && (
                <div className="mb-4 relative w-full h-50 group">
                  {!loadedPhotos[review.id] && (
                    <div className="absolute inset-0 bg-muted animate-pulse rounded-lg"></div>
                  )}
                  <img
                    src={`https://images.hive.blog/600x0/${review.photos[getCurrentPhotoIndex(review.id)]}`}
                    alt="Review photo"
                    className={`w-full h-50 object-cover rounded-lg transition-opacity duration-300 ${loadedPhotos[review.id] ? 'opacity-100' : 'opacity-0'
                      }`}
                    onLoad={() => setLoadedPhotos((prev) => ({ ...prev, [review.id]: true }))}
                  />

                  {/* Photo navigation arrows */}
                  {review.photos.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviousPhoto(review.id, review.photos.length);
                        }}
                        className="absolute left-2 top-1/2 transform -translate-y-1/2
                        bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded-full
                        opacity-100 md:opacity-0 md:group-hover:opacity-100
                        transition-opacity duration-200"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNextPhoto(review.id, review.photos.length);
                        }}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2
                        bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded-full
                        opacity-100 md:opacity-0 md:group-hover:opacity-100
                        transition-opacity duration-200"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm">
                        {getCurrentPhotoIndex(review.id) + 1}/{review.photos.length}
                      </div>
                    </>
                  )}
                </div>
              )}

              {hasHideUnhidePermission && review.reviewStatus === ReviewStatus.HIDDEN && (
                <div className="absolute inset-0 bg-gray-800 flex flex-col items-center justify-center rounded-lg">
                  <EyeOff className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-semibold text-muted-foreground mb-2">
                    Review is hidden
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      updateReviewStatus(review.permlink, false);
                    }}
                    disabled={updatingReviews.includes(review.permlink)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm hover:bg-primary/90 disabled:opacity-50"
                  >
                    {updatingReviews.includes(review.permlink) ? 'Unhiding...' : 'Unhide'}
                  </button>
                  <p className="text-xs text-muted-foreground mt-2 text-center px-4">
                    This review is hidden & won't be shown to users on this business
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Interaction Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            {/* Amount Information */}
            <div className="flex flex-col gap-1 pb-0 mb-1">
              {review.paidAmount && (
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">
                    <b className="text-primary">Paid Amount:</b> {review.paidAmount} HBD
                  </span>
                </div>
              )}
              {review.cashbackAmount && (
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground">
                    <b className="text-green-600">Cashback:</b> {review.cashbackAmount} HBD
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => handlePostClick(review)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              <ExternalLink className="w-4 h-4" />
              View Post
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
