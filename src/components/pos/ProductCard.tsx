import { Plus, Minus } from "lucide-react";
import type { ProductModel } from "../../types/product";

interface ProductCardProps {
  product: ProductModel;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function ProductCard({
  product,
  quantity,
  onAdd,
  onRemove,
}: ProductCardProps) {
  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border">
      <div className="aspect-square overflow-hidden">
        {(() => {
          // Handle imageUrl - support both string and array
          let imageUrl: string | null = null;
          if (product.imageUrl) {
            if (Array.isArray(product.imageUrl)) {
              imageUrl = product.imageUrl.length > 0 ? product.imageUrl[0] : null;
            } else if (typeof product.imageUrl === 'string') {
              imageUrl = product.imageUrl;
            }
          }
          
          return imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/placeholder-product.jpg";
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-4xl text-muted-foreground">📦</span>
            </div>
          );
        })()}
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </span>
          {product.stockQuantity !== undefined && (
            <span className="text-xs text-muted-foreground">
              Stock: {product.stockQuantity}
            </span>
          )}
        </div>

        {quantity > 0 ? (
          <div className="flex items-center justify-between">
            <button
              onClick={onRemove}
              className="p-1 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-semibold text-foreground px-2">
              {quantity}
            </span>
            <button
              onClick={onAdd}
              className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onAdd}
            className="w-full py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
}