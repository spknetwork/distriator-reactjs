import { Plus, Minus, ShoppingCart } from "lucide-react";
import type { ProductModel } from "../../types/product";

interface PointOfSaleProductCardProps {
  product: ProductModel;
  quantity: number;
  isGridView: boolean;
  onAdd: () => void;
  onRemove: () => void;
}

export function PointOfSaleProductCard({
  product,
  quantity,
  isGridView,
  onAdd,
  onRemove,
}: PointOfSaleProductCardProps) {
  if (isGridView) {
    return (
      <div className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 border border-border">
        <div className="aspect-square overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/placeholder-product.jpg";
              }}
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-foreground text-sm line-clamp-2">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>
          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="w-full flex items-center justify-center p-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <div className="bg-muted rounded-lg p-2 flex items-center justify-between">
              <button
                onClick={onRemove}
                className="p-1 hover:bg-background rounded transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-foreground">
                {quantity} in cart
              </span>
              <button
                onClick={onAdd}
                className="p-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 border border-border flex">
      <div className="w-32 h-32 flex-shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/placeholder-product.jpg";
            }}
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-foreground text-sm line-clamp-1">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>
        </div>
        {quantity === 0 ? (
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center p-2 bg-yellow-600 hover:bg-yellow-700 text-black rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-muted rounded-lg p-2 flex items-center justify-between">
            <button
              onClick={onRemove}
              className="p-1 hover:bg-background rounded transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-foreground">
              {quantity} in cart
            </span>
            <button
              onClick={onAdd}
              className="p-1 bg-yellow-600 hover:bg-yellow-700 text-black rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
