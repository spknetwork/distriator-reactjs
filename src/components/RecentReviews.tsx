/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ApiService } from '../services/api';
import { createBusinessReviewModel } from '../types/business-review';
import type { BusinessReviewModel } from '../types/business-review';

interface PreviewImage {
  reviewId: string;
  photoIndex: number;
  photos: string[];
}

export function RecentReviews() {
  const [reviews, setReviews] = useState<BusinessReviewModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [loadedAvatars, setLoadedAvatars] = useState<{ [key: string]: boolean }>({});
  const [loadedPhotos, setLoadedPhotos] = useState<{ [key: string]: boolean }>({});
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<{ [key: string]: number }>({});
  const [previewImage, setPreviewImage] = useState<PreviewImage | null>(null);
  const [previewImageLoaded, setPreviewImageLoaded] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getRecentReviews();
      
      if (response.success && response.data) {
        const reviewModels = response.data
          .filter(
            review => review.reviewStatus === 'visible' 
            && review.username !== 'shaktimaaan'
            && review.username !== 'sagarkothari'
            && review.username !== 'sagar-test1'
            && review.username !== 'sagar-test2'
            && review.username !== 'sagar-test3'
            && review.username !== 'sagar-test4'
            && review.username !== 'sagar-test5'
            && review.username !== 'sagar-test6'
            && review.username !== 'sagar-test7'
          )
          .map(review => createBusinessReviewModel(review));
        setReviews(reviewModels);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err: any) {
      console.error('Error fetching recent reviews:', err);
      setError(err.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!sectionRef.current || hasFetched) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasFetched) {
            setHasFetched(true);
            fetchReviews();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
    };
  }, [hasFetched, fetchReviews]);

  const handlePostClick = (review: BusinessReviewModel) => {
    const url = `https://hive.blog/@${review.username}/${review.permlink}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePreviousPhoto = (reviewId: string, totalPhotos: number) => {
    setCurrentPhotoIndex(prev => {
      const newIndex = prev[reviewId] ? (prev[reviewId] - 1 + totalPhotos) % totalPhotos : totalPhotos - 1;
      setLoadedPhotos(lp => ({ ...lp, [reviewId]: false }));
      return { ...prev, [reviewId]: newIndex };
    });
  };

  const handleNextPhoto = (reviewId: string, totalPhotos: number) => {
    setCurrentPhotoIndex(prev => {
      const newIndex = prev[reviewId] !== undefined ? (prev[reviewId] + 1) % totalPhotos : 1;
      setLoadedPhotos(lp => ({ ...lp, [reviewId]: false }));
      return { ...prev, [reviewId]: newIndex };
    });
  };

  const getCurrentPhotoIndex = (reviewId: string) => {
    return currentPhotoIndex[reviewId] || 0;
  };

  const handleImageClick = (reviewId: string, photoIndex: number, photos: string[]) => {
    setPreviewImage({ reviewId, photoIndex, photos });
    setPreviewImageLoaded(false);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setPreviewImageLoaded(false);
  };

  const handlePreviewPrevious = () => {
    if (!previewImage) return;
    const newIndex = (previewImage.photoIndex - 1 + previewImage.photos.length) % previewImage.photos.length;
    setPreviewImage({ ...previewImage, photoIndex: newIndex });
    setPreviewImageLoaded(false);
  };

  const handlePreviewNext = () => {
    if (!previewImage) return;
    const newIndex = (previewImage.photoIndex + 1) % previewImage.photos.length;
    setPreviewImage({ ...previewImage, photoIndex: newIndex });
    setPreviewImageLoaded(false);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && previewImage) {
        closePreview();
      }
    };

    if (previewImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [previewImage]);

  return (
    <div ref={sectionRef} className="space-y-4 w-full">
      {/* <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-primary">Recent Reviews</h2>
        <p className="text-lg text-foreground">
          See what our community is saying about their experiences
        </p>
      </div> */}

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading recent reviews...</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No recent reviews available</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="w-full">
          {/* Grid: 1 column on mobile (<768px), 2 columns on tablet (768px-1023px), 3 columns on desktop (1024px+) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-card rounded-lg border border-border p-4 space-y-4 shadow-md hover:shadow-lg transition-shadow"
              >
            {/* User Header */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                {!loadedAvatars[review.id] && (
                  <div className="absolute inset-0 rounded-full bg-muted animate-pulse"></div>
                )}
                <img
                  src={`https://images.hive.blog/u/${review.username}/avatar`}
                  alt={`${review.username} avatar`}
                  className={`w-10 h-10 rounded-full object-cover transition-opacity duration-300 ${
                    loadedAvatars[review.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setLoadedAvatars((prev) => ({ ...prev, [review.id]: true }))}
                />
              </div>

              <div className="flex-1">
                <p className="font-semibold text-foreground">@{review.username}</p>
                {review.created && (
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(review.created, { addSuffix: true })}
                  </p>
                )}
              </div>
            </div>

            {/* Review Text */}
            {review.reviewText && (
              <div className="pb-2">
                <p className="text-foreground line-clamp-3">{review.reviewText}</p>
              </div>
            )}

            {/* Photos */}
            {review.photos.length > 0 && (
              <div className="relative w-full h-48 group">
                {!loadedPhotos[review.id] && (
                  <div className="absolute inset-0 bg-muted animate-pulse rounded-lg"></div>
                )}
                <img
                  src={`https://images.hive.blog/600x0/${review.photos[getCurrentPhotoIndex(review.id)]}`}
                  alt="Review photo"
                  className={`w-full h-48 object-cover rounded-lg transition-opacity duration-300 cursor-pointer ${
                    loadedPhotos[review.id] ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setLoadedPhotos((prev) => ({ ...prev, [review.id]: true }))}
                  onClick={() => handleImageClick(review.id, getCurrentPhotoIndex(review.id), review.photos)}
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

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              {review.totalValue && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-primary">{review.totalValue}</span>
                </div>
              )}
              <button
                onClick={() => handlePostClick(review)}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Post
              </button>
            </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={closePreview}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-2 rounded-full transition-colors"
              aria-label="Close preview"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Previous Button */}
            {previewImage.photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewPrevious();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-colors"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              {!previewImageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-lg"></div>
              )}
              <img
                src={`https://images.hive.blog/2000x0/${previewImage.photos[previewImage.photoIndex]}`}
                alt="Review photo preview"
                className={`max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300 ${
                  previewImageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={(e) => e.stopPropagation()}
                onLoad={() => setPreviewImageLoaded(true)}
                onError={(e) => {
                  console.error('Failed to load preview image:', previewImage.photos[previewImage.photoIndex]);
                  // Try alternative URL format without size constraint
                  const photoUrl = previewImage.photos[previewImage.photoIndex];
                  (e.target as HTMLImageElement).src = `https://images.hive.blog/${photoUrl}`;
                }}
              />
            </div>

            {/* Next Button */}
            {previewImage.photos.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviewNext();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-3 rounded-full transition-colors"
                aria-label="Next image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Photo Counter */}
            {previewImage.photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded text-sm">
                {previewImage.photoIndex + 1} / {previewImage.photos.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

