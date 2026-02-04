import { useEffect, useState } from "react";
import { useReportedContentStore } from "../stores/reportedContentStore";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Verified,
  AlertTriangle,
  CheckCircle,
  MoreVertical,
  Star,
} from "lucide-react";
import { useAioha } from "@aioha/react-provider";
import { useBusinesses } from "../hooks/useBusinesses";
import { useBusinessReviews } from "../hooks/useBusinessReviews";
import { useBusinessRatings } from "../hooks/useBusinessRatings";
import { ViewState } from "../types/enums";
import { BusinessPhotoGallery } from "../components/business/BusinessPhotoGallery";
import { BusinessLocation } from "../components/business/BusinessLocation";
import { BusinessNotes } from "../components/business/BusinessNotes";
import { BusinessTrustedGuides } from "../components/business/BusinessTrustedGuides";
import { BusinessContact } from "../components/business/BusinessContact";
import { BusinessReviewsPhotos } from "../components/business/BusinessReviewsPhotos";
import { BusinessRatings } from "../components/business/BusinessRatings";
import { toast } from "sonner";
import { BusinessDeleteDialog } from "../components/business/BusinessDeleteDialogue";
import { useAuthData } from "../utils/auth-utils";
import { BusinessRatingSummaryService } from "../services/business-rating-summary-service";
import type { BusinessRatingSummaryResponse } from "../types/business-rating";

const BusinessDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="text-center py-4">
    </div>
    <div className="animate-pulse">
      <div className="px-4 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-muted text-foreground rounded-full h-8 w-8"></div>
          <div className="p-2 bg-muted text-foreground rounded-full h-8 w-8"></div>
        </div>
        <div className="flex items-center gap-4 flex-1 mb-4 mt-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-muted"></div>
          </div>
          <div>
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="flex gap-3 mt-2 flex-wrap items-center">
              <div className="h-6 w-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
        <hr />
        <div className="my-4 p-2">
          <div className="h-40 bg-muted rounded mb-4">        <p className="text-lg font-semibold text-foreground flex justify-center item center">Business Details are loading...</p></div>
          <div className="flex items-center justify-between mb-2 py-2">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-8 bg-muted rounded w-1/4"></div>
          </div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  </div>
);


const BusinessDetail = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { user } = useAioha();
  const { businesses, deleteBusiness, viewState } = useBusinesses();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [ratingSummary, setRatingSummary] =
    useState<BusinessRatingSummaryResponse | null>(null);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);

  const business = businesses.find(
    (b) => b.profile.displayName === businessName,
  );
  const { type: userRole } = useAuthData();
  const username = user;

  const isBusinessOwner =
    userRole === "owner" && business?.distriator.owner === username;
  const isBusinessMainGuide =
    business?.distriator.creator === username &&
    business?.distriator.guides?.some((g) => g.name === username);
  const isBusinessGuide = business?.distriator.guides?.some(
    (g) => g.name === username,
  );
  const hasEditPermission =
    username &&
    (userRole === "admin" ||
      userRole === "super" ||
      isBusinessMainGuide);
  const canManageBusinessAnalytics =
    username &&
    (userRole === "admin" ||
      userRole === "super" ||
      isBusinessGuide ||
      isBusinessMainGuide);
  const canManageOnboardingPost =
    username &&
    (userRole === "admin" ||
      userRole === "super" ||
      isBusinessGuide ||
      isBusinessMainGuide);

  // User can manage review fields if they are owner or any trusted guide
  const canManageReviewFields =
    isBusinessOwner ||
    isBusinessGuide ||
    userRole === "admin" ||
    userRole === "super";

  const { fetchReportedContent } = useReportedContentStore();


  const { token, isAuthenticated } = useAuthData();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchReportedContent(token);
    }
  }, [isAuthenticated, token, fetchReportedContent]);

  const { reviews, viewState: reviewsViewState } = useBusinessReviews(
    business,
    userRole,
    username
  );
  const { ratings, viewState: ratingsViewState } = useBusinessRatings(
    business
  );
  const hasNotes = business?.contact?.notes;
  const hasWorkTime = business?.profile.workTime;

  useEffect(() => {
    if (!business) return;

    const abortController = new AbortController();

    const fetchRatingSummary = async () => {
      if (!business.id) return;
      try {
        const response =
          await BusinessRatingSummaryService.getBusinessRatingSummary(
            business.id,
            abortController.signal,
          );
        if (response.isSuccess && response.data) {
          setRatingSummary(response.data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching rating summary:", error);
        }
      } finally {
        if (!abortController.signal.aborted) {
        }
      }
    };

    fetchRatingSummary();

    return () => {
      abortController.abort();
    };
  }, [business?.id]);

  const handleEdit = () => {
    if (business) {
      navigate(`/business/${businessName}/edit`, {
        state: { business },
      });
    }
  };

  const handleDelete = async () => {
    if (!business) return;

    try {
      setIsDeleting(true);
      await deleteBusiness(business.id!);
      toast.success("Business deleted successfully");
      navigate("/businesses");
    } catch (error) {
      console.error("Error deleting business:", error);
      toast.error("Failed to delete business");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Review fields are managed on CustomizeBusinessReview screen

  const closeActionsMenu = () => setIsActionsMenuOpen(false);

  if (viewState === ViewState.LOADING) {
    return <BusinessDetailSkeleton />;
  }

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

  const hasOnboardingPost = Boolean(business.distriator.verification?.hivePost);

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsActionsMenuOpen((o) => !o)}
              className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
              title="Actions"
              aria-haspopup="menu"
              aria-expanded={isActionsMenuOpen}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isActionsMenuOpen && (
              <>
                {/* backdrop to close on outside click */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={closeActionsMenu}
                />
                <div
                  className="absolute right-0 mt-2 w-64 z-50 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
                  role="menu"
                >
                  <div className="py-1">
                    {hasEditPermission && (
                      <button
                        onClick={() => {
                          closeActionsMenu();
                          handleEdit();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                        role="menuitem"
                      >
                        Edit business
                      </button>
                    )}
                    {hasEditPermission &&
                      (userRole === "admin" ||
                        userRole === "super" ||
                        isBusinessMainGuide) && (
                        <button
                          onClick={() => {
                            closeActionsMenu();
                            setShowDeleteDialog(true);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                          role="menuitem"
                        >
                          Delete business
                        </button>
                      )}
                    {canManageBusinessAnalytics && (
                      <button
                        onClick={() => {
                          closeActionsMenu();
                          navigate(`/business/${businessName}/analytics`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                        role="menuitem"
                      >
                        Business analytics
                      </button>
                    )}
                    {canManageReviewFields && (
                      <button
                        onClick={() => {
                          closeActionsMenu();
                          navigate(
                            `/business/${businessName}/customize-review`,
                          );
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                        role="menuitem"
                      >
                        Customize business review
                      </button>
                    )}
                    {canManageOnboardingPost && (
                      <button
                        onClick={() => {
                          closeActionsMenu();
                          navigate(`/business/${businessName}/onboarding-post`);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                        role="menuitem"
                      >
                        {hasOnboardingPost
                          ? "Update onboarding post"
                          : "Add Onboarding Post"}
                      </button>
                    )}
                    {/* Add review - visible to all users, no conditions */}
                    <button
                      onClick={() => {
                        closeActionsMenu();
                        navigate("/addreview", { state: { business } });
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-foreground"
                      role="menuitem"
                    >
                      Add review
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {/* Left side: Avatar + Info */}
        <div className="flex items-center gap-4 flex-1 mb-4">
          {/* Avatar with status badge */}
          <div className="relative">
            <img
              src={`https://images.hive.blog/320x0/${business.profile.displayImage}`}
              alt={business.profile.displayName}
              className="w-20 max-h-20 rounded-full object-cover border border-border"
            />
            {business.distriator.subscriptionStatus === "whitelisted" &&
              business.distriator.owner && (
                <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1 shadow-md">
                  <Verified className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
            {business.distriator.subscriptionStatus ===
              "underInvestigation" && (
                <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-1 shadow-md">
                  <AlertTriangle className="w-4 h-4 text-white" strokeWidth={3} />
                </div>
              )}
          </div>

          {/* Business Info */}
          <div>
            {/* Name + Badge in one row */}
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {business.profile.displayName}
              </h1>
            </div>

            {/* Business Type */}
            <div className="flex space-x-2">
              {business.profile.businessType && (
                <p className="text-muted-foreground text-sm mt-0.5">
                  {business.profile.businessType}
                </p>
              )}
              {ratingSummary && ratingSummary.totalRatings > 0 && (
                <div
                  className="flex items-center gap-1 cursor-pointer relative"
                  onMouseEnter={() => setShowRatingTooltip(true)}
                  onMouseLeave={() => setShowRatingTooltip(false)}
                  onClick={() => navigate(`/ratings/${businessName}`)}
                >
                  {showRatingTooltip && (
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-2 py-1 rounded shadow-lg z-10">
                      {ratingSummary.averageRating.toFixed(1)}
                    </div>
                  )}
                  {Array.from({ length: 5 }, (_, i) => {
                    const fullStars = Math.floor(ratingSummary.averageRating);
                    const partialPercentage =
                      (ratingSummary.averageRating - fullStars) * 100;
                    return (
                      <div key={i} className="relative w-5 h-5">
                        <Star
                          className={`w-5 h-5 absolute ${i < fullStars
                            ? "text-yellow-500 fill-yellow-500"
                            : i === fullStars && partialPercentage > 0
                              ? "text-gray-300"
                              : "text-gray-300"
                            }`}
                        />
                        {i === fullStars && partialPercentage > 0 && (
                          <div className="absolute inset-0 overflow-hidden w-full h-full">
                            <Star
                              className="w-5 h-5 text-yellow-500 fill-yellow-500"
                              style={{
                                clipPath: `inset(0 ${100 - partialPercentage
                                  }% 0 0)`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <span className="text-sm text-muted-foreground ml-1">
                    ({ratingSummary.totalRatings})
                  </span>
                </div>
              )}
            </div>

            {/* Payment Methods */}
            <div className="flex gap-3 mt-2 flex-wrap items-center">
              {business.distriator.owner && (
                <img src={`hbd-logo.png`} alt={"HBD"} className="h-6" />
              )}
              {business.distriator?.verification?.hivePost && (
                <button
                  type="button"
                  onClick={() =>
                    window.open(
                      business.distriator.verification!.hivePost,
                      "_blank",
                    )
                  }
                  className="flex items-center justify-center p-1 rounded hover:bg-muted transition-colors"
                  title="View onboarding post"
                  aria-label="View onboarding post"
                >
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </button>
              )}
              {!hasOnboardingPost &&
                (canManageOnboardingPost ? (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/business/${businessName}/onboarding-post`)
                    }
                    className="flex items-center justify-center p-1 rounded hover:bg-muted transition-colors"
                    title="Onboarding post pending. Click to update."
                  >
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-center p-1 text-yellow-500"
                    title="Onboarding post pending"
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ))}
            </div>
          </div>
        </div>

        <hr />

        <div className="my-4 p-2">
          {/* Photo Gallery */}
          {business.profile.images && business.profile.images.length > 0 && (
            <BusinessPhotoGallery business={business} />
          )}

          {/* Business Reviews */}
          {reviewsViewState !== ViewState.EMPTY && (
            <>
              <div className="flex items-center justify-between mb-2 py-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Detailed Reviews
                </h1>
                <button
                  onClick={() =>
                    navigate(`/review/${business.profile.displayName}`)
                  }
                  className="px-3 py-1.5 md:px-4 md:py-2 text-primary-foreground rounded-lg text-sm md:text-base cursor-pointer"
                >
                  View all &gt;
                </button>
              </div>
              <BusinessReviewsPhotos
                reviews={reviews}
                viewState={reviewsViewState}
              />
            </>
          )}

          {/* Business Ratings */}
          {ratingsViewState !== ViewState.EMPTY && (
            <>
              <BusinessRatings
                ratings={ratings}
                viewState={ratingsViewState}
                businessName={business.profile.displayName}
              />
            </>
          )}
        </div>

        {/* BiWeekly Limits Gauge */}
        {/* {showChart && (
          <div className="mt-6">
            <Card>
              <BiWeeklyGauge data={businessLimits || null} isLoading={businessLimitsLoading} />
            </Card>
          </div>
        )} */}

        {/* Business Location */}
        <div className="mt-6">
          <BusinessLocation business={business} />
        </div>
        {/* Business Contact */}
        <div className="mt-6">
          <BusinessContact contact={business.contact} />
        </div>
        {/* Trusted Guides Column */}
        <div className="mt-6">
          <BusinessTrustedGuides business={business} />
        </div>
        {/* Notes Column */}
        {(hasNotes || hasWorkTime) && (
          <div className="mt-6">
            <BusinessNotes business={business} />
          </div>
        )}
      </div>

      <BusinessDeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        businessName={business.profile.displayName}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default BusinessDetail;
