import { useNavigate } from "react-router-dom";
import { useAuthData } from "../utils/auth-utils";
import { isMobilePlatform } from "../utils/platform-detection";
import {
  WEB_LANDING_PAGE_TEXT,
  MOBILE_LANDING_PAGE_TEXT,
} from "../constants/landingPageText";
import { useState } from "react";

import logo from "/logo.png";
import CommonLayout from "../components/CommonLayout";
import LoginButton from "../components/LoginButton";
import { RecentReviews } from "../components/RecentReviews";
import { useCashbackStore } from "../stores/cashbackStore";
import { useEffect, } from "react";
import usePendingReviewsStore from "../stores/pendingReviewsStore";
import { RoleType } from "../types/role";
import { BusinessSelectionDialog } from "../components/business/BusinessSelectionDialog";
import { useBusinesses } from "../hooks/useBusinesses";
import { QrCode, ShoppingCart, X } from "lucide-react";

const Index = () => {
  const { currentUser, token, type: userRole } = useAuthData();
  const navigate = useNavigate();
  const { fetchApprovedCount } = useCashbackStore();
  const { fetchPendingReviews } = usePendingReviewsStore();
  const { businesses } = useBusinesses();
  const [showPayClaimDialog, setShowPayClaimDialog] = useState(false);
  const [showBusinessSelection, setShowBusinessSelection] = useState(false);

  // Determine which text content to show based on platform
  const isMobile = isMobilePlatform();
  const content = isMobile ? MOBILE_LANDING_PAGE_TEXT : WEB_LANDING_PAGE_TEXT;

  useEffect(() => {
    if (token) {
      fetchApprovedCount();
      if (userRole === RoleType.ADMIN || userRole === RoleType.SUPER) {
        fetchPendingReviews(token);
      }
    }
  }, [fetchApprovedCount, fetchPendingReviews, token, userRole]);

  // Use platform-specific text from constants
  const stepByStepCardsData = content.stepByStepCards;
  const earningCardsData = content.earningCards;

  // const handlePayClaimClick = () => {
  //   setShowPayClaimDialog(true);
  // };

  const handleScanQr = () => {
    setShowPayClaimDialog(false);
    navigate('/scan-qr');
  };

  // const handleSelfCheckout = () => {
  //   setShowPayClaimDialog(false);
  //   setShowBusinessSelection(true);
  // };

  return (
    <CommonLayout>
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12 w-full overflow-x-hidden">
        {/* App Logo and Title */}
        <div className="text-center space-y-4">
          <img src={logo} alt="Distriator Logo" className="mx-auto w-24 h-24" />
          <h1 className="text-4xl font-bold text-primary">Distriator</h1>
          <p className="text-xl font-medium text-success">{content.tagline}</p>
          <p className="text-lg max-w-2xl mx-auto text-foreground">
            {content.description}
          </p>

          {/* Login / Dashboard Button */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
            {currentUser ? (
              <>
                <button
                  className="btn btn-success"
                  onClick={() => navigate("/claim")}
                >
                  Claim now
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleScanQr}
                >
                  Pay now
                </button>
              </>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>

        {/* Earning Explanation */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            {content.earningTitle}
          </h2>
          <p className="text-lg text-foreground">{content.earningSubtitle}</p>
        </div>

        {/* Earning Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {earningCardsData.map((item, i) => (
            <div
              key={i}
              className="card bg-card shadow-md p-4 text-center space-y-2 border border-border rounded-lg"
            >
              <div className="text-4xl">{item.icon}</div>
              <h5 className="text-lg font-semibold text-primary">
                {item.title}
              </h5>
              <p className="text-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Business Instructions */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">
            See all businesses listed in Distriator
          </h2>
          <p className="text-lg text-foreground">
            Find those near you and start exploring.
          </p>
        </div>

        {/* Step-by-Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stepByStepCardsData.map((item, i) => (
            <div
              key={i}
              className="card bg-card shadow-md p-4 text-center space-y-2 border border-border rounded-lg"
            >
              <div className="text-4xl">{item.icon}</div>
              <h5 className="text-lg font-semibold text-primary">
                {item.title}
              </h5>
              <p className="text-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Recent Reviews Section */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-primary">Recent Reviews</h2>
          <p className="text-lg text-foreground">
            See what our community is saying about their experiences
          </p>
        </div>
        <RecentReviews />
      </div>

      {/* Business Selection Dialog */}
      {showBusinessSelection && (
        <BusinessSelectionDialog
          businesses={businesses}
          onClose={() => setShowBusinessSelection(false)}
        />
      )}

      {/* Pay Claim Dialog */}
      {/* {showPayClaimDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">
                Pay with HBD
              </h2>
              <button
                onClick={() => setShowPayClaimDialog(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <button
                onClick={handleScanQr}
                className="w-full p-4 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <QrCode className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Scan a business QR code to pay
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSelfCheckout}
                className="w-full p-4 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Self Checkout</h3>
                    <p className="text-sm text-muted-foreground">
                      Select a business to pay at
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )} */}
    </CommonLayout>
  );
};

export default Index;
