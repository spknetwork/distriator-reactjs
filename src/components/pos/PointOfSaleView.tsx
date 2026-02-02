import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ShoppingCart,
  Search,
  Grid3X3,
  List,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ProductService } from "../../services/product-service";
import type { ProductModel } from "../../types/product";
import { useAuthData } from "../../utils/auth-utils";
import { ViewState } from "../../types/enums";
import { useBusinesses } from "../../hooks/useBusinesses";
import { PointOfSaleProductCard } from "./PointOfSaleProductCard";

interface CartItem {
  product: ProductModel;
  quantity: number;
}

export function PointOfSaleView() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const { token } = useAuthData();
  const { businesses } = useBusinesses();

  const [products, setProducts] = useState<ProductModel[]>([]);
  const [cart, setCart] = useState<Map<string, CartItem>>(new Map());
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGridView, setIsGridView] = useState(true);

  const business = businesses.find((b) => b.id === businessId);

  useEffect(() => {
    if (!businessId || !token) return;

    const abortController = new AbortController();
    fetchProducts(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [businessId, token]);

  const fetchProducts = async (signal?: AbortSignal) => {
    if (!businessId) return;

    if (signal?.aborted) return; // Avoid work if already aborted

    setViewState(ViewState.LOADING);
    try {
      const response = await ProductService.getProducts(
        token,
        businessId,
        1,
        100,
        signal
      );
      if (signal?.aborted) return; // Ignore results if aborted

      if (response.isSuccess && response.data) {
        setProducts(response.data);
        setViewState(
          response.data.length > 0 ? ViewState.DATA : ViewState.EMPTY
        );
      } else {
        if (signal?.aborted) return; // Ignore errors if aborted
        toast.error("Failed to load products");
        setViewState(ViewState.ERROR);
      }
    } catch (error) {
      if (signal?.aborted || (error instanceof Error && error.name === "AbortError")) {
        return;
      }
      toast.error("Error loading products");
      setViewState(ViewState.ERROR);
    }
  };

  const addToCart = (product: ProductModel) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      const existing = newCart.get(product.id);
      if (existing) {
        newCart.set(product.id, {
          ...existing,
          quantity: existing.quantity + 1,
        });
      } else {
        newCart.set(product.id, { product, quantity: 1 });
      }
      return newCart;
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    setCart((prev) => {
      const newCart = new Map(prev);
      if (newQuantity <= 0) {
        newCart.delete(productId);
      } else {
        const existing = newCart.get(productId);
        if (existing) {
          newCart.set(productId, { ...existing, quantity: newQuantity });
        }
      }
      return newCart;
    });
  };

  const navigateToCart = () => {
    if (cart.size === 0) {
      toast.error("Cart is empty");
      return;
    }

    const cartItems: Record<string, number> = {};
    cart.forEach((item, productId) => {
      cartItems[productId] = item.quantity;
    });

    navigate("/pos/cart", {
      state: {
        cart: cartItems,
        products: Array.from(cart.values()).map((item) => item.product),
        businessId,
        businessName: business?.profile.displayName,
        businessImage: business?.profile.displayImage,
        isPointOfSale: true,
      },
    });
  };

  const getCartQuantity = (productId: string): number => {
    return cart.get(productId)?.quantity || 0;
  };

  const getTotalCartItems = (): number => {
    return Array.from(cart.values()).reduce(
      (sum, item) => sum + item.quantity,
      0
    );
  };

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  );

  const getCrossAxisCount = () => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      if (width > 1200) return 4;
      if (width > 800) return 3;
      if (width > 600) return 2;
    }
    return 1;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {business && (
            <div className="flex items-center space-x-3">
              <img
                src={
                  business.profile.displayImage || "/placeholder-business.jpg"
                }
                alt={business.profile.displayName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Point of Sale
                </h1>
                <p className="text-sm text-muted-foreground">
                  {business.profile.displayName}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsGridView(!isGridView)}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            {isGridView ? (
              <List className="w-5 h-5 text-foreground" />
            ) : (
              <Grid3X3 className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {/* Products Grid/List */}
        {viewState === ViewState.EMPTY ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">
                  No products available
                </h3>
                <p className="text-muted-foreground">
                  Add products to your catalogue first
                </p>
              </div>
            </div>
          </div>
        ) : viewState === ViewState.ERROR ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-red-500">Error loading products</div>
              <button
                onClick={() => fetchProducts()}
                className="btn btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        ) : viewState === ViewState.LOADING ?
          (<div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>) :
          (
            <div
              className={
                isGridView
                  ? `grid gap-6 ${getCrossAxisCount() === 4
                    ? "grid-cols-4"
                    : getCrossAxisCount() === 3
                      ? "grid-cols-3"
                      : getCrossAxisCount() === 2
                        ? "grid-cols-2"
                        : "grid-cols-1"
                  }`
                  : "space-y-4"
              }
            >
              {filteredProducts.map((product) => {
                const quantity = getCartQuantity(product.id);
                return (
                  <PointOfSaleProductCard
                    key={product.id}
                    product={product}
                    quantity={quantity}
                    isGridView={isGridView}
                    onAdd={() => addToCart(product)}
                    onRemove={() => updateQuantity(product.id, quantity - 1)}
                  />
                );
              })}
            </div>
          )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={navigateToCart}
        disabled={cart.size === 0}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground p-4 rounded-full shadow-glow transition-all duration-300 hover:scale-110 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ShoppingCart className="w-6 h-6" />
        <span className="text-sm font-medium">View Cart ({getTotalCartItems()})</span>
      </button>
    </div>
  );
}