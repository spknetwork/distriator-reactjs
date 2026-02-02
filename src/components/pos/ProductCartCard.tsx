import { Plus, Minus, Trash2, ImageIcon } from "lucide-react";
import type { ProductModel } from "../../types/product";

interface ProductCartCardProps {
  product: ProductModel;
  quantity: number;
  isMobile: boolean;
  onRemove: () => void;
  onAdd: () => void;
  onDelete: () => void;
  isReadOnly?: boolean; // When true, hide +/- and delete buttons
}

export function ProductCartCard({
  product,
  quantity,
  isMobile,
  onRemove,
  onAdd,
  onDelete,
  isReadOnly = false,
}: ProductCartCardProps) {
  const totalPrice = product.price * quantity;
  
  // Handle imageUrl - support both string and array
  const getFirstImage = (): string | null => {
    if (!product.imageUrl) return null;
    if (Array.isArray(product.imageUrl)) {
      return product.imageUrl.length > 0 ? product.imageUrl[0] : null;
    }
    return typeof product.imageUrl === 'string' ? product.imageUrl : null;
  };
  
  const firstImage = getFirstImage();

  if (isMobile) {
    return (
      <div className="bg-card rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {firstImage ? (
              <img
                src={firstImage}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/placeholder-product.jpg";
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2">
              {product.name}
            </h3>
          </div>
          
          <div className="text-right">
            <p className="font-bold text-foreground">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            ${product.price.toFixed(2)} each
          </p>
          
          {isReadOnly ? (
            <span className="text-sm font-medium text-foreground">
              Qty: {quantity}
            </span>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={onRemove}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              
              <span className="text-sm font-medium text-foreground min-w-[2rem] text-center">
                {quantity}
              </span>
              
              <button
                onClick={onAdd}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
              
              <button
                onClick={onDelete}
                className="p-1 hover:bg-destructive/10 rounded transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="bg-card rounded-lg border border-border p-4">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder-product.jpg";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {product.name}
          </h3>
        </div>

        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            ${product.price.toFixed(2)}
          </p>

          {isReadOnly ? (
            <span className="text-sm font-medium text-foreground">
              Qty: {quantity}
            </span>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={onRemove}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Minus className="w-4 h-4 text-foreground" />
              </button>
              
              <span className="text-sm font-medium text-foreground min-w-[2rem] text-center">
                {quantity}
              </span>
              
              <button
                onClick={onAdd}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <Plus className="w-4 h-4 text-foreground" />
              </button>
              
              <button
                onClick={onDelete}
                className="p-1 hover:bg-destructive/10 rounded transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          )}

          <div className="text-right min-w-[5rem]">
            <p className="font-bold text-foreground">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}