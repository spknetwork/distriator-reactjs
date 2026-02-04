// src/pages/BusinessReviewsPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBusinessReviews } from "../hooks/useBusinessReviews";
import { useBusinesses } from "../hooks/useBusinesses";
import { BusinessReviews } from "../components/business/BusinessReviews";
import { useAuthData } from '../utils/auth-utils';
import { useReportedContentStore } from "../stores/reportedContentStore";

const BusinessReviewsPage = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const { fetchReportedContent } = useReportedContentStore();
  const { token, isAuthenticated } = useAuthData();

  const business = businesses.find((b) => b.profile.displayName === businessName);
  const { type, username } = useAuthData();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchReportedContent(token);
    }
  }, [isAuthenticated, token, fetchReportedContent]);

  const { reviews, viewState, hasHideUnhidePermission, updateReviewStatus, updatingReviews } = useBusinessReviews(
    business,
    type,
    username
  );

  if (!business) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold mb-4">Business not found</h2>
        <button onClick={() => navigate(-1)} className="btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-opacity-50 text-white rounded-full hover:bg-opacity-70"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{business.profile.displayName} - Reviews</h1>
        <div />
      </div>

      {/* Reviews Grid (auto-wrap) */}
      {viewState === "data" && reviews.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reviews.map((review) => (
            <div key={review.id}>
              {/* reuse card styling but no horizontal scroll */}
              <BusinessReviews
                reviews={[review]}
                viewState={viewState}
                hasHideUnhidePermission={!!hasHideUnhidePermission}
                updateReviewStatus={updateReviewStatus}
                updatingReviews={updatingReviews}
              />
            </div>
          ))}
        </div>
      ) : (
        <BusinessReviews
          reviews={reviews}
          viewState={viewState}
          hasHideUnhidePermission={!!hasHideUnhidePermission}
          updateReviewStatus={updateReviewStatus}
          updatingReviews={updatingReviews}
        />
      )}
    </div>
  );
};

export default BusinessReviewsPage;
