import { useEffect, useState } from "react";
import { type BusinessModel } from "../../types/business";
import { getCache, setCache } from "../../utils/cache";
import { Skeleton } from "@radix-ui/themes";
import { stripHiveImageProxy } from "../../utils/image-url";

interface BusinessPhotoGalleryProps {
  business: BusinessModel;
}

export function BusinessPhotoGallery({ business }: BusinessPhotoGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({});

  const imagesCacheKey = `business_images_${business.id}`;
  const cachedImages = getCache<string[]>(imagesCacheKey);

  const images = cachedImages || business.profile.images || [];

  useEffect(() => {
    if (business?.profile.images?.length) {
      setCache(imagesCacheKey, business.profile.images);
    }
  }, [business?.id, business?.profile.images]);

  const handleImageLoad = (index: number) => {
    setLoadedImages((prev) => ({ ...prev, [index]: true }));
  };

  if (images.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-4">Business Photo Gallery</h2>
        <p className="text-muted-foreground">No photos available</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4">Business Photo Gallery</h2>

      {/* Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        {images.map((image, index) => (
          <div
            key={index}
            className="w-40 h-40 md:w-64 md:h-64 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer relative bg-muted"
            onClick={() => setSelectedImageIndex(index)}
          >
            {/* Loader (only if image not loaded yet) */}
            {!loadedImages[index] && (
              <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />
            )}

            <img
              src={stripHiveImageProxy(image)}
              alt={`Business photo ${index + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-300 ${loadedImages[index] ? "opacity-100" : "opacity-0"
                }`}
              onLoad={() => handleImageLoad(index)}
            />
          </div>
        ))}
      </div>


      {/* Image Modal */}
      {selectedImageIndex !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={stripHiveImageProxy(images[selectedImageIndex])}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImageIndex(null)}
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