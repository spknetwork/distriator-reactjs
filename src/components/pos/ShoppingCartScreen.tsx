import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import type { ProductModel } from "../../types/product";
import type { CartModel } from "../../types/cart";
import { ProductCartCard } from "./ProductCartCard";
import { PayWithHbd } from "./PayWithHbd";
import { useBusinesses } from "../../hooks/useBusinesses";
import { useIsMobile } from "../../hooks/use-mobile";

interface CartState {
  cart: Record<string, number>;
  products: ProductModel[];
  businessId: string;
  businessName?: string;
  businessImage?: string;
  isPointOfSale?: boolean;
  // When coming from a scanned QR flow we may have an existing cart id & data
  scannedCartId?: string;
  scannedCartData?: CartModel;
}

export function ShoppingCartScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { businesses } = useBusinesses();
  const isMobile = useIsMobile();

  const state = location.state as CartState;
  const [cart, setCart] = useState<Record<string, number>>(state?.cart || {});
  const [servicePersonUsername, setServicePersonUsername] = useState("");
  const [selectedTipPercentage, setSelectedTipPercentage] = useState<number>(0);
  const [recipientUsername, setRecipientUsername] = useState<string>("");

  const products = state?.products || [];
  const businessId = state?.businessId || "";
  const businessName = state?.businessName;
  const businessImage = state?.businessImage;
  const isPointOfSale = state?.isPointOfSale || false;
  const scannedCartId = state?.scannedCartData?.id || state?.scannedCartId;

  useEffect(() => {
    // Find recipient username from business data
    const business = businesses.find(b => b.id === businessId);
    if (business?.distriator.owner) {
      setRecipientUsername(business.distriator.owner);
    }
  }, [businessId, businesses]);

  useEffect(() => {
    // Auto-populate service person name and tip from scanned cart data
    if (state?.scannedCartData) {
      const cartData = state.scannedCartData;
      
      // Set service person name if available
      if (cartData.serviceGuyName) {
        setServicePersonUsername(cartData.serviceGuyName);
      }
      
      // Set tip percentage if available
      if (cartData.serviceGuyTipPercent) {
        const tipPercent = parseFloat(cartData.serviceGuyTipPercent);
        if (!isNaN(tipPercent)) {
          setSelectedTipPercentage(tipPercent);
        }
      }
    }
  }, [state?.scannedCartData]);

  const getProductById = (productId: string): ProductModel | undefined => {
    return products.find(p => p.id === productId);
  };

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = getProductById(productId);
    return product ? { product, quantity } : null;
  }).filter(Boolean) as { product: ProductModel; quantity: number }[];

  const total = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const calculatedTipAmount = total * (selectedTipPercentage / 100);
  const totalWithTip = total + calculatedTipAmount;

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      setCart(prev => ({ ...prev, [productId]: newQuantity }));
    }
  };

  const removeItem = (productId: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[productId];
      
      if (Object.keys(newCart).length === 0) {
        navigate(-1);
      }
      
      return newCart;
    });
  };

  const handlePaymentSuccess = () => {
    toast.success("Payment completed successfully!");
    navigate("/claim");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Cart is empty</h3>
            <p className="text-muted-foreground">Add some products to continue</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center space-x-3">
            <img
              src={businessImage || "/placeholder-business.jpg"}
              alt={businessName || "Business"}
              className="w-10 h-10 rounded-full object-cover border border-border"
            />
            <div>
              <h1 className="text-lg font-semibold text-foreground">{isPointOfSale ? "Charges" : "Check Out"}</h1>
              <p className="text-sm text-muted-foreground">{businessName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-4">
        {cartItems.map((item) => (
          <ProductCartCard
            key={item.product.id}
            product={item.product}
            quantity={item.quantity}
            isMobile={isMobile}
            onRemove={() => updateQuantity(item.product.id, item.quantity - 1)}
            onAdd={() => updateQuantity(item.product.id, item.quantity + 1)}
            onDelete={() => removeItem(item.product.id)}
            isReadOnly={!!scannedCartId}
          />
        ))}
      </div>

      {/* Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 space-y-4">
        {/* Service Person Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {servicePersonUsername.trim() ? (
              <img
                src={`https://images.hive.blog/u/${servicePersonUsername.trim()}/avatar`}
                alt="Service person avatar"
                className="w-8 h-8 rounded-full"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `https://images.hive.blog/u/null/avatar`;
                }}
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          
          <input
            type="text"
            value={servicePersonUsername}
            onChange={(e) => setServicePersonUsername(e.target.value)}
            placeholder="Enter service person's hive username"
            className="w-full pl-14 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          
          {!isMobile && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <span className="text-sm font-medium text-foreground">
                {selectedTipPercentage.toFixed(1)}%
              </span>
              <input
                type="range"
                min="0"
                max="30"
                step="2.5"
                value={selectedTipPercentage}
                onChange={(e) => setSelectedTipPercentage(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-bold text-foreground">
                ${calculatedTipAmount.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Tip Slider */}
        {isMobile && (
          <div className="flex items-center space-x-3 p-3 bg-card rounded-lg border border-border">
            <span className="text-sm font-medium text-foreground">
              {selectedTipPercentage.toFixed(1)}%
            </span>
            <input
              type="range"
              min="0"
              max="30"
              step="2.5"
              value={selectedTipPercentage}
              onChange={(e) => setSelectedTipPercentage(Number(e.target.value))}
              className="flex-1"
            />
            <span className="text-sm font-bold text-foreground">
              ${calculatedTipAmount.toFixed(2)}
            </span>
          </div>
        )}

        {/* Total */}
        <div className="flex justify-end">
          <span className="text-xl font-bold text-foreground">
            Total: ${totalWithTip.toFixed(2)}
          </span>
        </div>

        {/* Payment Button */}
        <PayWithHbd
          cart={cart}
          products={products}
          businessId={businessId}
          recipientUsername={recipientUsername}
          servicePersonUsername={servicePersonUsername.trim()}
          selectedTipPercentage={selectedTipPercentage.toFixed(1)}
          total={total}
          calculatedTipAmount={calculatedTipAmount}
          totalWithTip={totalWithTip}
          generatedByBusiness={isPointOfSale}
          existingCartId={scannedCartId}
          onSuccess={handlePaymentSuccess}
        />
      </div>
    </div>
  );
}