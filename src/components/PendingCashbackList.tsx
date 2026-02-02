import { useState, useEffect, useRef } from "react";
import type { PendingCashback } from "../types/responses";
import { fetchBusinessesApi } from "../services/BusinessApi";
import { Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ViewState } from "../types/enums";

interface PendingCashbackListProps {
  cashbacks: PendingCashback[];
  onSelectCashback: (cashback: PendingCashback) => void;
  viewState: ViewState;
}

interface BusinessInfo {
  displayName: string;
  displayImage: string;
}

const PendingCashbackList = ({ cashbacks, onSelectCashback, viewState }: PendingCashbackListProps) => {
  const [businessCache, setBusinessCache] = useState<Record<string, BusinessInfo>>({});
  const fetchedBusinessesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchBusinessInfo = async () => {
      const uniqueBusinesses = [...new Set(cashbacks.map(cb => cb.business))];
      const businessesToFetch = uniqueBusinesses.filter(businessName => !fetchedBusinessesRef.current.has(businessName));

      if (businessesToFetch.length === 0) {
        return;
      }

      try {
        const businesses = await fetchBusinessesApi(abortController.signal);
        
        const newBusinessCache: Record<string, BusinessInfo> = {};
        businessesToFetch.forEach(businessName => {
          const business = businesses.find(b => b.distriator?.owner === businessName);
          if (business) {
            newBusinessCache[businessName] = {
              displayName: business.profile?.displayName || businessName,
              displayImage: business.profile?.displayImage || '',
            };
            fetchedBusinessesRef.current.add(businessName);
          }
        });

        if (Object.keys(newBusinessCache).length > 0) {
          setBusinessCache(prev => ({
            ...prev,
            ...newBusinessCache
          }));
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        console.error(`Failed to fetch business info:`, error);
      }
    };

    if (cashbacks.length > 0) {
      fetchBusinessInfo();
    }

    return () => {
      abortController.abort();
    };
  }, [cashbacks]);


  if (viewState === ViewState.LOADING) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-4">Loading pending cashbacks...</p>
      </div>
    );
  }

  if (viewState === ViewState.ERROR) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load pending cashbacks</p>
      </div>
    );
  }

  if (viewState === ViewState.EMPTY || cashbacks.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No pending cashback reviews found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cashbacks.map((cashback) => {
        const businessInfo = businessCache[cashback.business];
        // const remainingAmount = calculateRemainingAmount(cashback);
        const timeAgo = formatDistanceToNow(new Date(cashback.updatedAt), { addSuffix: true });

        return (
          <div
            key={cashback._id}
            className="bg-card border border-border rounded-lg p-6 cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => onSelectCashback(cashback)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {businessInfo?.displayImage && (
                    <img
                      src={businessInfo.displayImage}
                      alt={businessInfo.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {businessInfo?.displayName || cashback.business}
                    </h3>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-medium">{cashback.invoice}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Claim Percentage</p>
                    <p className="font-medium">{cashback.percentage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Value</p>
                    <p className="font-medium">{cashback.transactionAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <p className="font-medium text-sm">{timeAgo}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">Claim Value</p>
                    <p className="font-medium">{cashback.claimValue}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-muted-foreground">by {cashback.username}</p>
                    <img
                      src={`https://images.hive.blog/u/${cashback.username}/avatar`}
                      alt={`${cashback.username} avatar`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PendingCashbackList;
