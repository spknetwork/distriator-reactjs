/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useAioha } from "@aioha/react-provider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import { CartService } from "../../services/cart-service";
import type { ProductModel } from "../../types/product";
import type { CartModel } from "../../types/cart";
import { useAuthData } from "../../utils/auth-utils";
import { KeyTypes } from "@aioha/aioha";

interface PayWithHbdProps {
  cart: Record<string, number>;
  products: ProductModel[];
  businessId: string;
  recipientUsername: string;
  // Name of the service person handling the order (optional)
  servicePersonUsername: string;
  selectedTipPercentage: string;
  total: number;
  calculatedTipAmount: number;
  totalWithTip: number;
  generatedByBusiness: boolean;
  /**
   * When paying for a cart that was already created (eg. scanned from QR),
   * pass the existing cart id here so that we update its status instead of
   * creating a brand new cart.
   */
  existingCartId?: string;
  onSuccess: () => void;
}

export function PayWithHbd({
  cart,
  products,
  businessId,
  recipientUsername,
  servicePersonUsername,
  selectedTipPercentage,
  calculatedTipAmount,
  totalWithTip,
  generatedByBusiness,
  existingCartId,
  onSuccess,
}: PayWithHbdProps) {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState<string>("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusCheckCountRef = useRef(0);
  const maxStatusChecks = 40; // 40 * 3s = 120s = 2 minutes

  const { aioha } = useAioha();
  const { token, username } = useAuthData();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearInterval(statusTimerRef.current);
      }
    };
  }, []);

  const getProductById = (productId: string): ProductModel | undefined => {
    return products.find(p => p.id === productId);
  };

  const createCartModel = (): CartModel => {
    const items = Object.entries(cart).map(([productId, quantity]) => {
      const product = getProductById(productId);
      if (!product) throw new Error(`Product not found: ${productId}`);
      
      // Get category - API returns it as a string in category.customCategory or we can use category.type
      // Priority: category.customCategory (actual API string) > category.type (enum value)
      // Fallback to "other" if both are missing to ensure non-empty string
      let productCategory = 'other';
      if (product.category?.customCategory) {
        productCategory = product.category.customCategory;
      } else if (product.category?.type) {
        productCategory = product.category.type;
      }
      
      // Get subCategory - API returns it as a separate field
      // Ensure it's always a non-empty string (fallback to "none" if missing)
      const productSubCategory = product.subCategory && product.subCategory.trim() !== '' 
        ? product.subCategory 
        : 'none';
      
      // Get quantity type - use customUnit if available, otherwise use type
      let productQtyType = '';
      if (product.quantityType) {
        if (product.quantityType.customUnit) {
          productQtyType = product.quantityType.customUnit;
        } else if (product.quantityType.type) {
          productQtyType = product.quantityType.type;
        }
      }
      
      // Handle imageUrl - convert to array if needed
      let productImages: string[] = [];
      if (product.imageUrl) {
        if (Array.isArray(product.imageUrl)) {
          productImages = product.imageUrl;
        } else if (typeof product.imageUrl === 'string') {
          productImages = [product.imageUrl];
        }
      }
      
      return {
        productId: product.id,
        productName: product.name,
        productBrand: product.brand || '',
        productCategory: productCategory,
        productSubCategory: productSubCategory,
        productImageUrl: productImages,
        productQty: quantity,
        productQtyType: productQtyType,
        totalPerProduct: product.price * quantity,
      };
    });

    const tipPercentStr = selectedTipPercentage ? `${selectedTipPercentage}%` : '';
    const serviceGuyName = servicePersonUsername || username || '';

    return {
      items,
      serviceGuyName,
      serviceGuyTipPercent: tipPercentStr,
      serviceGuyTipValue: calculatedTipAmount,
      overAllTotal: totalWithTip,
      businessHiveUserName: recipientUsername,
      businessId,
      // hiveUserName is not allowed in POST request - removed
      generatedByBusiness,
    };
  };

  const startCartStatusPolling = (cartId: string) => {
    statusCheckCountRef.current = 0;
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
    }

    statusTimerRef.current = setInterval(async () => {
      statusCheckCountRef.current++;
      
      try {
        const cartStatusResp = await CartService.getCartById(token, cartId);
        if (cartStatusResp.isSuccess && cartStatusResp.data) {
          const cartStatus = cartStatusResp.data.status;
          if (cartStatus === "completed") {
            if (statusTimerRef.current) {
              clearInterval(statusTimerRef.current);
            }
            setTransferResult("Payment completed!");
            setIsTransferring(false);
            
            if (generatedByBusiness) {
              // Keep QR visible and show confetti with dialog
              setShowQR(false);
              setShowConfetti(true);
              setShowSuccessDialog(true);
            } else {
              // Hide QR for non-business generated payments
              setShowQR(false);
              toast.success("Payment successful!");
              onSuccess();
            }
            return;
          }
        }
      } catch (error) {
        console.error("Error checking cart status:", error);
      }

      if (statusCheckCountRef.current >= maxStatusChecks) {
        if (statusTimerRef.current) {
          clearInterval(statusTimerRef.current);
        }
        setTransferResult("QR generated, but payment not detected after 2 minutes.");
        setIsTransferring(false);
      }
    }, 3000);
  };

  const payWithQr = async () => {
    if (!recipientUsername) {
      toast.error("Recipient username is not available");
      return;
    }

    if (totalWithTip <= 0) {
      toast.error("Total amount must be positive");
      return;
    }

    setIsTransferring(true);
    setTransferResult(null);

    try {
      const cartModel = createCartModel();
      const response = await CartService.createCart(token, cartModel);

      if (response.isSuccess && response.data?.id) {
        const cartId = response.data.id;
        const qrCode = `pos-${cartId}`;
        
        setQrData(qrCode);
        setShowQR(true);
        setTransferResult("QR generated successfully.");
        
        startCartStatusPolling(cartId);
      } else {
        setTransferResult(`Error creating cart: ${response.errorMessage}`);
        setIsTransferring(false);
      }
    } catch (error) {
      setTransferResult(`Error creating cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsTransferring(false);
    }
  };

  const payWithHBD = async () => {
    if (!recipientUsername) {
      toast.error("Recipient username is not available");
      return;
    }

    if (totalWithTip <= 0) {
      toast.error("Total amount must be positive");
      return;
    }

    setIsTransferring(true);
    setTransferResult(null);

    try {
      // Decide which cart id to use for this payment.
      // - If existingCartId is provided (eg. scanned QR cart), use that so we
      //   only update the status of the existing cart.
      // - Otherwise, create a new cart as before.
      let cartIdToUse: string | undefined = existingCartId;

      if (!cartIdToUse) {
        const cartModel = createCartModel();
        const response = await CartService.createCart(token, cartModel);

        if (!response.isSuccess || !response.data?.id) {
          setTransferResult(`Error creating cart: ${response.errorMessage}`);
          setIsTransferring(false);
          return;
        }

        cartIdToUse = response.data.id;
        setTransferResult("Cart created successfully. Proceeding to payment...");
      } else {
        setTransferResult("Using existing cart. Proceeding to payment...");
      }

      const createdCartId = cartIdToUse;

      // Prepare operations for blockchain
      const operations: any[] = [];
      const businessAmount = totalWithTip - calculatedTipAmount;

      if (businessAmount > 0) {
        operations.push([
          "transfer",
          {
            from: username,
            to: recipientUsername,
            amount: `${businessAmount.toFixed(3)} HBD`,
            memo: `pos-${createdCartId}`,
          },
        ]);
      }

      if (calculatedTipAmount > 0 && servicePersonUsername) {
        operations.push([
          "transfer",
          {
            from: username,
            to: servicePersonUsername,
            amount: `${calculatedTipAmount.toFixed(3)} HBD`,
            memo: `Tip for serving the customer ${username} for cart ${createdCartId}`,
          },
        ]);
      }

      // Sign and broadcast transaction
      const result = await aioha.signAndBroadcastTx(operations, KeyTypes.Active);
      
      let txSuccess = false;
      let txId = '';
      
      if (result && typeof result === 'object') {
        if (result.success === true) {
          txSuccess = true;
          txId = result.result || '';
        }
      }

      if (txSuccess) {
        if (txId && createdCartId) {
          const cartStatusResp = await CartService.updateCartStatus(
            token,
            createdCartId,
            txId
          );
          
          if (cartStatusResp.isSuccess && cartStatusResp.data?.status === "completed") {
            onSuccess();
            return;
          }
        }
        setTransferResult("Payment successful!");
        onSuccess();
      } else if (createdCartId) {
        await CartService.updateCartStatus(token, createdCartId);
        setTransferResult("Payment failed. Please try again.");
      }
    } catch (error) {
      setTransferResult(`Error during payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  const handlePayment = () => {
    if (generatedByBusiness) {
      payWithQr();
    } else {
      payWithHBD();
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handlePayment}
        disabled={isTransferring}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isTransferring ? (
          <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
        ) : (
          generatedByBusiness ? "Charge Now" : "Pay with HBD"
        )}
      </button>

      {transferResult && (
        <div className="text-center">
          <p className={`text-sm ${
            transferResult.startsWith('Error:') ? 'text-destructive' : 'text-success'
          }`}>
            {transferResult}
          </p>
        </div>
      )}

      {/* Confetti */}
      {/* Full Screen Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 z-[70] pointer-events-none">
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={300}
          />
        </div>
      )}


      {/* Success Dialog */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-8 shadow-2xl max-w-md mx-4 text-center animate-in fade-in zoom-in-95 duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              The payment has been completed successfully.
            </p>
            <button
              onClick={() => {
                setShowSuccessDialog(false);
                setShowConfetti(false);
                setShowQR(false);
                navigate(`/pos/${businessId}/sales`);
              }}
              className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && qrData && (
        <div className="fixed inset-0 bg-black/50  z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Scan to Pay
            </h2>
            
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG
                  value={qrData}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
            </div>
            
            <div className="text-center mb-4">
              <p className="text-sm text-gray-600 break-all font-mono">
                {qrData}
              </p>
            </div>
            
            {!generatedByBusiness && (
              <button
                onClick={() => {
                  setShowQR(false);
                  if (statusTimerRef.current) {
                    clearInterval(statusTimerRef.current);
                  }
                }}
                className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            )}
            {generatedByBusiness && (
              <>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Waiting for payment...
                </p>
                <button
                  onClick={() => {
                    setShowQR(false);
                    setIsTransferring(false);
                    setTransferResult(null);
                    if (statusTimerRef.current) {
                      clearInterval(statusTimerRef.current);
                    }
                  }}
                  className="w-full py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel & Go Back to Cart
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}