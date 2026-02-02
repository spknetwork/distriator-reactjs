import { useState, useEffect } from "react";
import { Edit, Trash2, ImageIcon, ChevronLeft, ChevronRight } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import type { ProductModel } from "../types/product";

interface ProductCardProps {
  product: ProductModel;
  onEdit: (product: ProductModel) => void;
  onDelete: (product: ProductModel) => void;
  isGridView?: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  isGridView = true,
}: ProductCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Normalize imageUrl to array format
  const imageUrls = Array.isArray(product.imageUrl) 
    ? product.imageUrl 
    : product.imageUrl 
    ? [product.imageUrl] 
    : [];

  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
    setImageLoaded(false);
    setImageError(false);
  }, [product.id, product.imageUrl]);

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handlePreviousImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + imageUrls.length) % imageUrls.length);
      setImageLoaded(false);
    }
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (imageUrls.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % imageUrls.length);
      setImageLoaded(false);
    }
  };

  const handleDelete = () => {
    onDelete(product);
    setShowDeleteDialog(false);
  };

  if (isGridView) {
    return (
      <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:scale-105 border border-border">
        <div className="relative aspect-[4/3] overflow-hidden group">
          {imageUrls.length > 0 && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-lg"></div>
              )}
              <img
                src={imageUrls[currentImageIndex]}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              
              {/* Image navigation arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2
                      bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 rounded-full
                      opacity-100 md:opacity-0 md:group-hover:opacity-100
                      transition-opacity duration-200 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2
                      bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1.5 rounded-full
                      opacity-100 md:opacity-0 md:group-hover:opacity-100
                      transition-opacity duration-200 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs z-10">
                    {currentImageIndex + 1}/{imageUrls.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          {/* Action buttons overlay */}
          <div className="absolute top-2 left-2 right-2 gap-1 flex z-20">
            <button
              onClick={() => onEdit(product)}
              className="p-2 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="p-2 bg-primary/90 hover:bg-primary text-primary-foreground rounded-full transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-bold text-foreground text-lg line-clamp-2 leading-tight">
              {product.name}
            </h3>
            {product.description && (
              <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            {product.stockQuantity !== undefined && (
              <span className="text-sm text-muted-foreground">
                Stock: {product.stockQuantity}
              </span>
            )}
          </div>
        </div>

        {/* Delete Dialog */}
        <AlertDialog.Root
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg z-50 border border-border">
              <AlertDialog.Title className="text-lg text-black/100 font-semibold">
                Delete Product
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete "{product.name}"? This action
                cannot be undone.
              </AlertDialog.Description>
              <div className="mt-4 flex justify-end gap-3">
                <AlertDialog.Cancel className="px-4 py-2 text-sm bg-gray-500 rounded-md">
                  Cancel
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded-md"
                >
                  Delete
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-200 border border-border mb-4">
      <div className="flex">
        <div className="w-32 h-32 flex-shrink-0 relative group">
          {imageUrls.length > 0 && !imageError ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-lg"></div>
              )}
              <img
                src={imageUrls[currentImageIndex]}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
              
              {/* Image navigation arrows for list view */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={handlePreviousImage}
                    className="absolute left-1 top-1/2 transform -translate-y-1/2
                      bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded-full
                      opacity-100 md:opacity-0 md:group-hover:opacity-100
                      transition-opacity duration-200 z-10"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2
                      bg-black bg-opacity-60 hover:bg-opacity-80 text-white p-1 rounded-full
                      opacity-100 md:opacity-0 md:group-hover:opacity-100
                      transition-opacity duration-200 z-10"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white px-1.5 py-0.5 rounded text-xs z-10">
                    {currentImageIndex + 1}/{imageUrls.length}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 p-4 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex-1 mr-4">
              <h3 className="font-bold text-foreground text-lg line-clamp-1">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-muted-foreground text-sm mt-1 line-clamp-2">
                  {product.description}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(product)}
                className="p-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-colors"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-2xl font-bold text-primary">
              ${product.price.toFixed(2)}
            </span>
            {product.stockQuantity !== undefined && (
              <span className="text-sm text-muted-foreground">
                Stock: {product.stockQuantity}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <AlertDialog.Root
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-white/10 backdrop-blur-sm z-50" />
            <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg z-50 border border-border">
              <AlertDialog.Title className="text-lg text-black/100 font-semibold">
                Delete Product
              </AlertDialog.Title>
              <AlertDialog.Description className="mt-2 text-sm text-gray-600">
                Are you sure you want to delete "{product.name}"? This action
                cannot be undone.
              </AlertDialog.Description>
              <div className="mt-4 flex justify-end gap-3">
                <AlertDialog.Cancel className="px-4 py-2 text-sm bg-gray-500 rounded-md">
                  Cancel
                </AlertDialog.Cancel>
                <AlertDialog.Action
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded-md"
                >
                  Delete
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}
