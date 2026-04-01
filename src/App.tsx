import { HashRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from 'hive-authentication';
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import { PhotoUploadScreen } from "./components/PhotoUploadScreen";
import { ReviewScreen } from "./components/ReviewScreen";
import { Toaster } from "sonner";
import AutoLogin from "./pages/AutoLogin";
import { CatalogueScreen } from "./components/Catalogue";
import DistriatorReportsList from "./pages/reports/DistriatorReportsList";
import RecentClaimsReport from "./pages/reports/RecentClaims";
import TopConsumersReport from "./pages/reports/TopConsumers";
import TopBusinessesReport from "./pages/reports/TopBusinesses";
import DailyReport from "./pages/reports/DailyReport";
import TopConsumerOnboardersReport from "./pages/reports/TopConsumerOnboarders";
import TopBusinessOnboardersReport from "./pages/reports/TopBusinessOnboarders";
import CountryReport from "./pages/reports/CountryReport";
import TotalSpentReportPage from "./pages/reports/TotalSpentReportPage";
import LeaderboardReport from "./pages/reports/LeaderboardReport";
import CumulativeBusinessesReport from "./pages/reports/CumulativeBusinesses";
import MyActivityReport from "./pages/reports/MyActivityReport";
import BusinessesPage from "./pages/Business";
import BusinessDetail from "./pages/BusinessDetail";
import BusinessReviewsPage from "./pages/BusinessReviewsPage";
import BusinessRatingsPage from "./pages/BusinessRatingsPage";
import BusinessAnalyticsPage from "./pages/BusinessAnalyticsPage";
import CustomizeBusinessReview from "./pages/CustomizeBusinessReview";
import BusinessOnboardingPost from "./pages/BusinessOnboardingPost";
import { RoleView } from "./components/UserManagement/RoleView";
import { AddRoleMember } from "./components/UserManagement/AddRoleMember";
import { RoleSettings } from "./components/UserManagement/RoleSettings";
import { ManageAdmins } from "./components/UserManagement/ManageAdmins";
import { AddAdmin } from "./components/UserManagement/AddAdmin";
import { BusinessMiniForm } from "./components/business/BusinessMiniForm";
import LocationPicker from "./components/business/form/LocationPicker";
import BusinessFormView from "./components/business/form/BusinessFormView";

import { initAioha } from "@aioha/aioha";
import { AiohaProvider } from "@aioha/react-ui";
import ClaimStatusScreen from "./components/CashbackStatus";
import UserWallet from "./pages/UserWallet";
import MapView from "./components/business/MapView";
import PointOfSalePage from "./pages/PointOfSale";
import ShoppingCartPage from "./pages/ShoppingCart";
import { AuthProvider } from "./context/AuthContext";
import PointOfSaleSelectPage from "./pages/PointOfSaleSelect";
import TokenExpirationHandler from "./components/TokenExpirationHandler";
import AddReviewPage from "./pages/AddReview";
import AppWideBanner from "./components/AppWideBanner";
import PendingCashbackPage from "./pages/PendingCashback";
import RecentReviewsPage from "./pages/RecentReviewsPage";
import CashbackLogs from "./pages/CashbackLogs";
import { isMobilePlatform } from "./utils/platform-detection";
import { CheckoutScreen } from "./pages/CheckoutScreen";
import { ScanQrView } from "./pages/ScanQRView";
import SalesViewPage from "./pages/SalesView";
import SalesDetailViewPage from "./pages/SalesDetailView";
import SalesSelectPage from "./pages/SalesSelect";
import Privacy from "./pages/Privacy";
import { PrivilegedReviewScreen } from "./components/PrivilegedReviewScreen";

// Set encryption key at startup so the auth store can decrypt persisted users on any page
useAuthStore.getState().setSecretKey(import.meta.env.VITE_LOCAL_KEY || '');

const aioha = initAioha({
  hivesigner: {
    app: "hive-auth-demo.app",
    callbackURL: window.location.origin + "/hivesigner.html",
    scope: ["login", "vote"],
  },
  hiveauth: {
    name: "Hive Authentication Demo",
    description: "A demo app for testing Hive authentication",
  },
});

const isIOSSafari = () => {
  const ua = window.navigator.userAgent;
  const isIOS = /iP(ad|hone|od)/.test(ua);
  const isWebKit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return isIOS && isWebKit && !isChrome && !isFirefox;
};

const App = () => {
  const isIPhone = isIOSSafari();
  const isMobile = isMobilePlatform();

  return (
    <AiohaProvider aioha={aioha}>
      <AuthProvider>
        <HashRouter>
          <div className={isMobile ? "pt-safe-top bg-background" : isIPhone ? "pt-[25px]" : ""}>
            <Toaster position="bottom-center" toastOptions={{ className: 'mt-4 mb-6' }} />
            <TokenExpirationHandler />
            <AppWideBanner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/claim" element={<Dashboard />} />
              <Route path="/photo-upload" element={<PhotoUploadScreen />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/privileged-review" element={<PrivilegedReviewScreen />} />
              <Route path="/addreview" element={<AddReviewPage />} />
              <Route path="/atihotel/:roomname" element={<AutoLogin />} />
              <Route
                path="/catalogue"
                element={
                  <CatalogueScreen
                  // onBack={() => window.history.back()}
                  // onCreateCatalogue={(business) => {
                  //   console.log("Creating catalogue for:", business);
                  // }}
                  />
                }
              />
              <Route path="/cashback-status" element={<ClaimStatusScreen />} />
              <Route
                path="/reports/distriator"
                element={<DistriatorReportsList />}
              />
              <Route
                path="/reports/distriator/recent"
                element={<RecentClaimsReport />}
              />
              <Route
                path="/reports/distriator/top-consumers"
                element={<TopConsumersReport />}
              />
              <Route
                path="/reports/distriator/top-businesses"
                element={<TopBusinessesReport />}
              />
              <Route
                path="/reports/distriator/daily"
                element={<DailyReport />}
              />
              <Route
                path="/reports/distriator/top-consumer-onboarders"
                element={<TopConsumerOnboardersReport />}
              />
              <Route
                path="/reports/distriator/top-business-onboarders"
                element={<TopBusinessOnboardersReport />}
              />
              <Route
                path="/reports/distriator/by-country"
                element={<CountryReport />}
              />
              <Route
                path="/reports/distriator/total-spent"
                element={<TotalSpentReportPage />}
              />
              <Route
                path="/reports/distriator/leaderboard"
                element={<LeaderboardReport />}
              />
              <Route
                path="/reports/distriator/cumulative-businesses"
                element={<CumulativeBusinessesReport />}
              />
              <Route
                path="/reports/distriator/my-activity"
                element={<MyActivityReport />}
              />
              <Route path="/businesses" element={<BusinessesPage />} />
              <Route path="/recent-reviews" element={<RecentReviewsPage />} />
              <Route
                path="/business/:businessName"
                element={<BusinessDetail />}
              />
              <Route
                path="/businesses/:businessName"
                element={<BusinessDetail />}
              />
              <Route
                path="/ratings/:businessName"
                element={<BusinessRatingsPage />}
              />
              <Route
                path="/review/:businessName"
                element={<BusinessReviewsPage />}
              />
              <Route
                path="/business/:businessName/analytics"
                element={<BusinessAnalyticsPage />}
              />
              <Route
                path="/business/:businessName/customize-review"
                element={<CustomizeBusinessReview />}
              />
              <Route
                path="/business/:businessName/onboarding-post"
                element={<BusinessOnboardingPost />}
              />
              {/* Business Creation Routes */}
              <Route
                path="/business/create/location"
                element={<LocationPicker />}
              />
              <Route
                path="/business/create/form"
                element={<BusinessFormView />}
              />
              <Route
                path="/business/create/mini"
                element={<BusinessMiniForm />}
              />
              <Route
                path="/business/:businessName/edit"
                element={<BusinessFormView />}
              />

              {/* User Management Routes */}
              <Route path="/manage-users/:roleType" element={<RoleView />} />
              <Route
                path="/manage-users/:roleType/add"
                element={<AddRoleMember />}
              />
              <Route
                path="/manage-users/:roleType/edit/:username"
                element={<AddRoleMember />}
              />
              <Route
                path="/manage-users/:roleType/settings/:username"
                element={<RoleSettings />}
              />

              {/* Admin Management Routes (Super Admin only) */}
              <Route path="/manage-admins" element={<ManageAdmins />} />
              <Route path="/manage-admins/add" element={<AddAdmin />} />

              {/* User Wallet */}
              <Route path="/user-wallet" element={<UserWallet />} />
              <Route path="map-view" element={<MapView />} />

              {/* Pending Cashback (Admin/Super Admin only) */}
              <Route
                path="/pending-cashback"
                element={<PendingCashbackPage />}
              />
              <Route path="/cashback-logs" element={<CashbackLogs />} />

            {/* Point of Sale Routes */}
            <Route path="/pos/:businessId" element={<PointOfSalePage />} />
            <Route path="/pos/cart" element={<ShoppingCartPage />} />
            <Route path="/pos-select" element={<PointOfSaleSelectPage />} />
            <Route path="/pos/:businessId/sales" element={<SalesViewPage />} />
            <Route path="/pos/:businessId/sales/:cartId" element={<SalesDetailViewPage />} />
            <Route path="/sales-select" element={<SalesSelectPage />} />

            {/* Self-Checkout Routes */}
            <Route path="/checkout/:businessId" element={<CheckoutScreen />} />
            <Route path="/scan-qr" element={<ScanQrView />} />

            {/* Privacy Policy */}
            <Route path="/privacy" element={<Privacy />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </HashRouter>
      </AuthProvider>
    </AiohaProvider>
  );
};

export default App;
