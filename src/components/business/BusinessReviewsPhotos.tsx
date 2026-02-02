import { useState } from "react";
import { type BusinessReviewModel } from "../../types/business-review";
import { ViewState } from '../../types/enums';
import { Skeleton } from "@radix-ui/themes";

interface BusinessReviewsPhotosProps {
  reviews: BusinessReviewModel[];
  viewState: ViewState;
}

export function BusinessReviewsPhotos({ reviews, viewState }: BusinessReviewsPhotosProps) {
  const [selectedImage, setSelectedImage] = useState<{ url: string; id: string } | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: string]: boolean }>({});
  const today = new Date().toISOString().split('T')[0]; 

  // --- Collect all photos from reviews ---
  const allPhotos = reviews.flatMap((review) =>
    review.photos.map((photo, idx) => ({
      id: `${review.id}-${idx}`,
      url: photo,
      username: review.username,
      permlink: review.permlink,
    }))
  );

  const handleImageLoad = (id: string) => {
    setLoadedImages((prev) => ({ ...prev, [id]: true }));
  };

  const handlePostClick = (username: string, permlink: string) => {
    const url = `https://hive.blog/@${username}/${permlink}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // --- UI States ---
  if (viewState === ViewState.LOADING) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="w-40 h-40 md:w-64 md:h-64 flex-shrink-0 rounded-lg"
          />
        ))}
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

  return (
    <div className="mb-8">
      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {allPhotos.map((photo) => (
          <div
            key={photo.id}
            className="w-40 h-40 md:w-64 md:h-64 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer relative bg-muted"
            onClick={() => setSelectedImage({ url: photo.url, id: photo.id })}
          >
            {/* Loader */}
            {!loadedImages[photo.id] && (
              <Skeleton className="absolute inset-0" />
            )}

            <img
              src={`https://images.hive.blog/200x0/${photo.url}?v=${photo.id}`}
              alt={`Review by ${photo.username}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages[photo.id] ? "opacity-100" : "opacity-0"
                }`}
              onLoad={() => handleImageLoad(photo.id)}
            />

            {/* Username Overlay with Avatar */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                handlePostClick(photo.username, photo.permlink);
              }}
            >
              {/* Avatar - overlap effect */}
              <div className="absolute -top-3 left-2">
                <img
                  src={`https://images.hive.blog/u/${photo.username}/avatar?d=${today}`}
                  alt={photo.username}
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                />
              </div>

              {/* Username */}
              <span className="truncate">@{photo.username}</span>
            </div>

          </div>
        ))}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={`https://images.hive.blog/200x0/${selectedImage.url}?v=${selectedImage.id}`}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
