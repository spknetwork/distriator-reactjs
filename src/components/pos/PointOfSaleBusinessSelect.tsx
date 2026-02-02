import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Store, ClipboardList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchBusinessesApi } from "../../services/BusinessApi";
import type { BusinessModel } from "../../types/business";
import { useAuthData } from "../../utils/auth-utils";
import { ViewState } from "../../types/enums";

export function PointOfSaleBusinessSelect({ mode = 'pos' }: { mode?: 'pos' | 'sales' }) {
  const navigate = useNavigate();
  const { username } = useAuthData();
  const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  useEffect(() => {
    const abortController = new AbortController();
    fetchUserBusinesses(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [username]);

  const fetchUserBusinesses = async (signal: AbortSignal) => {
    try {
      const allBusinesses = await fetchBusinessesApi(signal);
      const userBusinesses = allBusinesses.filter(
        (business) => business.distriator?.owner === username
      );

      if (userBusinesses.length === 1) {
        const id = userBusinesses[0].id;
        navigate(mode === 'sales' ? `/pos/${id}/sales` : `/pos/${id}`);
        return;
      }

      setBusinesses(userBusinesses);
      setViewState(
        userBusinesses.length > 0 ? ViewState.DATA : ViewState.EMPTY
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error("Failed to fetch businesses:", error);
      setViewState(ViewState.ERROR);
    }
  };

  const handleBusinessSelect = (business: BusinessModel) => {
    navigate(mode === 'sales' ? `/pos/${business.id}/sales` : `/pos/${business.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            {mode === 'sales' ? 'Sales' : 'Point of Sale'}
          </h1>
        </div>
      </div>

      <div className="p-6">
        {viewState === ViewState.EMPTY ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-6 max-w-md">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Store className="w-12 h-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-foreground">
                  No Business Found
                </h2>
                <p className="text-muted-foreground">
                  You don't own any businesses yet. You need to own a business
                  to use the Point of Sale system.
                </p>
              </div>
            </div>
          </div>
        ) : viewState === ViewState.LOADING ? (
         <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-muted-foreground">Loading your businesses...</p>
            </div>
          </div>
        ) : viewState === ViewState.ERROR ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="text-destructive">Error loading businesses</div>
              <button
                onClick={() =>
                  fetchUserBusinesses(new AbortController().signal)
                }
                className="btn btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Select Business
              </h2>
              <p className="text-muted-foreground">
                {mode === 'sales' ? 'Choose a business to view sales' : 'Choose which business to create a sale for'}
              </p>
            </div>

            <div className="md:grid-cols-2 lg:grid-cols-3 gap-4 w-full p-5">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => handleBusinessSelect(business)}
                  className="bg-card rounded-xl border border-border p-6 cursor-pointer hover:shadow-glow transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={
                        business.profile.displayImage ||
                        "/placeholder-business.jpg"
                      }
                      alt={business.profile.displayName}
                      className="w-16 h-16 rounded-full object-cover border border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-lg truncate">
                        {business.profile.displayName}
                      </h3>
                      <p className="text-muted-foreground text-sm capitalize">
                        {business.profile.businessType || "Business"}
                      </p>
                      <div className="flex items-center mt-2">
                        {mode === 'sales' ? (
                          <>
                            <ClipboardList className="w-4 h-4 text-primary mr-1" />
                            <span className="text-sm text-primary">View Sales</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 text-primary mr-1" />
                            <span className="text-sm text-primary">Start Sale</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}