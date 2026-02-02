import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBusinesses } from "../hooks/useBusinesses";
import { useBusinessHistory } from "../hooks/useBusinessHistory";
import { BusinessChart } from "../components/business/BusinessChart";
import { useAuthData } from '../utils/auth-utils';

const BusinessAnalyticsPage = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const {token} = useAuthData();

  const business = businesses.find(
    (b) => b.profile.displayName === businessName
  );

  const { history, viewState } = useBusinessHistory(
    token,
    business?.distriator.owner
  );

  if (!business) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Business Not Found
          </h2>
          <button
            onClick={() => navigate("/businesses")}
            className="btn btn-primary"
          >
            Back to Businesses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-background">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-2xl font-bold text-foreground mt-4">
          {business.profile.displayName} - Analytics
        </h1>
      </div>
      <div className="p-4">
        <BusinessChart
          history={history}
          viewState={viewState}
          businessName={business.profile.displayName}
        />
      </div>
    </div>
  );
};

export default BusinessAnalyticsPage;
