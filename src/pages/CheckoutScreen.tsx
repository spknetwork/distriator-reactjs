import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { ProductModel } from "../types/product";
import { useAuthData } from "../utils/auth-utils";
import { ProductCard } from "../components/pos/ProductCard";
import { ProductService } from "../services/product-service";

interface CheckoutState {
  businessId: string;
  businessName?: string;
  businessImage?: string;
}

export function CheckoutScreen() {
  const { businessId } = useParams<{ businessId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthData();

  const state = location.state as CheckoutState;
  const [products, setProducts] = useState<ProductModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Record<string, number>>({});

  useEffect(() => {
    if (businessId) {
      loadProducts();
    }
  }, [businessId]);

  const loadProducts = async () => {
    if (!businessId || !token) return;

    try {
      setLoading(true);
      const result = await ProductService.getProducts(token, businessId, 1, 10);

      if (result.valid && result.data) {
        setProducts(result.data);
      } else {
        toast.error(result.error || "Failed to load products");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      setCart((prev) => ({ ...prev, [productId]: newQuantity }));
    }
  };

  const removeItem = (productId: string) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
  };

  const getProductById = (productId: string): ProductModel | undefined => {
    return products.find((p) => p.id === productId);
  };

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = getProductById(productId);
    return product ? { product, quantity } : null;
  }).filter(Boolean) as { product: ProductModel; quantity: number }[];

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error("Please add items to cart");
      return;
    }

    navigate("/pos/cart", {
      state: {
        cart,
        products,
        businessId,
        businessName: state?.businessName,
        businessImage: state?.businessImage,
        isPointOfSale: false,
      },
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-3">
            <img
              src={
                state?.businessImage ||
                "https://images.hive.blog/u/null/avatar"
              }
              alt={state?.businessName || "Business"}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Checkout</h1>
              <p className="text-sm text-muted-foreground">
                {state?.businessName || "Business"}
              </p>
            </div>
          </div>
        </div>

        {/* Cart Button */}
        {cartItems.length > 0 && (
          <button
            onClick={handleCheckout}
            className="relative btn btn-primary"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Cart ({cartItems.length})
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <span className="loading loading-ring loading-md"></span>
              <span className="text-muted-foreground text-sm">
                Loading products...
              </span>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No products available
            </h3>
            <p className="text-muted-foreground">
              This business hasn't added any products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                quantity={cart[product.id] || 0}
                onAdd={() => updateQuantity(product.id, (cart[product.id] || 0) + 1)}
                onRemove={() =>
                  updateQuantity(product.id, (cart[product.id] || 0) - 1)
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}