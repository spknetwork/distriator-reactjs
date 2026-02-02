import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { CartModel } from '../types/cart';
import { CartService } from '../services/cart-service';
import { useAuthData } from '../utils/auth-utils';

export default function SalesDetailViewPage() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { cart?: CartModel } };
  const { cartId } = useParams<{ businessId: string; cartId: string }>();
  const { token } = useAuthData();

  const [cartData, setCartData] = useState<CartModel | undefined>(state?.cart);
  const [isLoading, setIsLoading] = useState<boolean>(!state?.cart);

  useEffect(() => {
    if (cartData || !token || !cartId) return;
    const controller = new AbortController();
    (async () => {
      setIsLoading(true);
      try {
        const res = await CartService.getCartById(token, cartId);
        if (res.isSuccess && res.data) {
          setCartData(res.data);
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [token, cartId, cartData]);

  const openTx = () => {
    if (!cartData?.transactionId) return;
    const url = `https://hivehub.dev/tx/${cartData.transactionId}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-lg font-semibold text-foreground">Transaction Details</div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-3xl mx-auto">
        {isLoading || !cartData ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-top-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading transaction...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <button
  onClick={cartData.transactionId ? openTx : undefined}
  className={`text-left w-full ${cartData.transactionId ? 'hover:underline' : ''}`}
>
  <div className="text-sn font-bold flex items-center gap-2 overflow-hidden">
    <span className="truncate max-w-[80%]">
      Transaction ID : {cartData.transactionId || 'N/A'}
    </span>
    {cartData.transactionId && <ExternalLink className="w-4 h-4 shrink-0" />}
  </div>
</button>

            <div>
              <div className="text-lg font-bold mb-3">Items:</div>
              <div className="space-y-3">
                {cartData.items.map((item, idx) => (
                  <div key={idx} className="border border-border rounded-lg p-3 bg-card flex items-center gap-3">
                    <div className="w-16 h-16 rounded bg-muted overflow-hidden flex items-center justify-center">
                      {item.productImageUrl && item.productImageUrl.length > 0 ? (
                        <img src={Array.isArray(item.productImageUrl) ? item.productImageUrl[0] : item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">🛍️</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.productQty} {item.productQtyType ? `(${item.productQtyType})` : ''}
                      </div>
                    </div>
                    <div className="font-bold">{item.totalPerProduct.toFixed(3)}</div>
                  </div>
                ))}
              </div>
            </div>

            {cartData.serviceGuyTipValue > 0 && (
              <div className="border border-border rounded-xl p-4 bg-card space-y-3">
                <div className="font-bold">Service Person</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                    {cartData.serviceGuyName ? (
                      <img
                        src={`https://images.hive.blog/u/${cartData.serviceGuyName}/avatar`}
                        alt={cartData.serviceGuyName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">👤</span>
                    )}
                  </div>
                  <div>{cartData.serviceGuyName}</div>
                </div>
                <div className="font-bold">Tip: {cartData.serviceGuyTipValue.toFixed(3)}</div>
              </div>
            )}

            <div className="rounded-xl p-4 bg-secondary/10 flex items-center justify-between">
              <div className="font-bold">Total Amount:</div>
              <div className="font-bold">{cartData.overAllTotal.toFixed(3)}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

