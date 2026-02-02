import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuthData } from '../utils/auth-utils';
import { useBusinesses } from '../hooks/useBusinesses';
import type { CartModel } from '../types/cart';
import { CartService } from '../services/cart-service';
import { SalesTable } from '../components/pos/SalesTable';
import { toast } from 'sonner';

export default function SalesViewPage() {
  const navigate = useNavigate();
  const { businessId } = useParams<{ businessId: string }>();
  const { token } = useAuthData();
  const { businesses } = useBusinesses();

  const business = useMemo(() => businesses.find((b) => b.id === businessId), [businesses, businessId]);

  const [carts, setCarts] = useState<CartModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!token || !businessId) return;
    const controller = new AbortController();
    fetchCarts(1, controller.signal);
    return () => controller.abort();
  }, [token, businessId]);

  // Infinite scroll using IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && page < totalPages && !isLoadingMore && !isLoading) {
          fetchCarts(page + 1);
        }
      },
      { root: null, rootMargin: '0px', threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.unobserve(el);
  }, [page, totalPages, isLoadingMore, isLoading]);

  const fetchCarts = async (pageNumber = 1, signal?: AbortSignal) => {
    if (!token || !businessId) return;
    const isFirstPage = pageNumber === 1;
    if (isFirstPage) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const result = await CartService.getCartsByBusinessId(token, businessId, pageNumber, limit, signal);
      if (signal?.aborted) return;
      if (result.isSuccess && result.data) {
        setCarts((prev) => (isFirstPage ? result.data!.carts : [...prev, ...result.data!.carts]));
        setPage(result.data.page);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error(result.errorMessage || 'Failed to load sales');
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        toast.error('Failed to load sales');
      }
    } finally {
      if (!signal?.aborted) {
        if (isFirstPage) setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          {business && (
            <div className="flex items-center gap-3">
              <img
                src={business.profile.displayImage || '/placeholder-business.jpg'}
                alt={business.profile.displayName}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
              <div>
                <div className="text-lg font-semibold text-foreground">Sales</div>
                <div className="text-sm text-muted-foreground">{business.profile.displayName}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 pb-20 px-3 sm:px-8 lg:px-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading sales...</p>
            </div>
          </div>
        ) : carts.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">No sales found.</div>
          </div>
        ) : (
          <div className="flex flex-col min-h-[60vh] gap-3">
            <div className="flex-1 rounded-xl border border-border bg-card/30">
              <SalesTable carts={carts} />
            </div>
            {/* Sentinel for infinite scroll trigger */}
            <div ref={sentinelRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}

