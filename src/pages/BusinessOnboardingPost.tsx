import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBusinesses } from "../hooks/useBusinesses";
import { BusinessFormStep7Onboarding } from "../components/business/form/BusinessFormStep7Onboarding";

const BusinessOnboardingPost = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();

  const business = businesses.find(
    (b) => b.profile.displayName === businessName
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
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold">Onboarding Post</h1>
          <div className="w-10"></div> {/* Placeholder for symmetry */}
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <BusinessFormStep7Onboarding
          businessData={business}
          isMini={false}
          onPrevious={() => navigate(-1)}
          onCompleted={() => navigate(`/business/${businessName}`)}
          isOnboardingOnly={true}
        />
      </div>
    </div>
  );
};

export default BusinessOnboardingPost;
