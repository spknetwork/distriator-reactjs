import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Verified, AlertTriangle } from "lucide-react";
import { format } from "timeago.js";
import { useBusinesses } from "../hooks/useBusinesses";
import { useAioha } from "@aioha/react-provider";
import { useAuthData } from "../utils/auth-utils";
import { BusinessRatingSummaryService } from "../services/business-rating-summary-service";
import { useBusinessRatingsStore } from "../stores/businessRatingsStore";
import type {
  BusinessRatingSummaryResponse,
} from "../types/business-rating";
import { ThreeDotMenu } from "../components/ThreeDotMenu";
import { useAuthContext } from "../context/AuthContext";
import { useReportedContentStore } from "../stores/reportedContentStore";
import { isIOS } from "../utils/platform-detection";

const BusinessRatingsPage = () => {
  const { businessName } = useParams<{ businessName: string }>();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const { user } = useAioha();
  const { currentUser } = useAuthContext();

  const [ratingSummary, setRatingSummary] =
    useState<BusinessRatingSummaryResponse | null>(null);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);

  // Zustand store
  const {
    ratings,
    isLoading: isLoadingRatings,
    error: ratingsError,
    sortBy,
    setSortBy,
    setBusinessId,
    fetchFirstPage,
    reset,
    setReportedContent,
  } = useBusinessRatingsStore();

  const { reportedUsers, reportedReviews, fetchReportedContent } = useReportedContentStore();
  const { token, isAuthenticated } = useAuthData();

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchReportedContent(token);
    }
  }, [isAuthenticated, token, fetchReportedContent]);


  useEffect(() => {
    // Sync global store to local store (if needed, or just remove local store copy and filter in view?)
    // Plan said: BusinessRatingsPage observes reportedContentStore and calls businessRatingsStore.setReportedContent
    setReportedContent(reportedUsers, reportedReviews);
  }, [reportedUsers, reportedReviews, setReportedContent]);

  // Infinite scroll refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastRatingRef = useRef<HTMLDivElement | null>(null);

  // Infinite scroll effect
  useEffect(() => {
    if (isLoadingRatings) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // For now, since we're loading all in background, no additional load needed
          // In future, could implement loadMore if needed
        }
      },
      { threshold: 1.0 }
    );

    if (lastRatingRef.current) {
      observer.observe(lastRatingRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoadingRatings]);

  const business = businesses.find(
    (b) => b.profile.displayName === businessName
  );
  const { type: userRole } = useAuthData();
  const username = user;

  const isBusinessOwner =
    userRole === "owner" && business?.distriator.owner === username;
  const isBusinessMainGuide =
    business?.distriator.creator === username &&
    business?.distriator.guides?.some((g) => g.name === username);
  const isBusinessGuide = business?.distriator.guides?.some(
    (g) => g.name === username
  );
  const canManageOnboardingPost =
    username &&
    (userRole === "admin" ||
      userRole === "super" ||
      isBusinessOwner ||
      isBusinessGuide ||
      isBusinessMainGuide);

  useEffect(() => {
    if (!business) return;

    const abortController = new AbortController();

    const fetchRatingSummary = async () => {
      if (!business.id) return;
      try {
        const response =
          await BusinessRatingSummaryService.getBusinessRatingSummary(
            business.id,
            abortController.signal
          );
        if (response.isSuccess && response.data) {
          setRatingSummary(response.data);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.error("Error fetching rating summary:", error);
        }
      }
    };

    fetchRatingSummary();

    return () => {
      abortController.abort();
    };
  }, [business?.id]);

  useEffect(() => {
    if (!business?.id) return;

    const abortController = new AbortController();

    // Set business ID and fetch all ratings in background
    setBusinessId(business.id);
    fetchFirstPage(abortController.signal);

    return () => {
      abortController.abort();
      reset();
    };
  }, [business?.id, setBusinessId, fetchFirstPage, reset]);

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

  const getPaymentMethods = () => {
    return business.distriator.paymentMethods.filter(
      (method) => method === "HBD" || method === "Sats"
    );
  };

  const totalRatings = ratingSummary?.totalRatings ?? 0;
  const ratingDistribution = ratingSummary?.ratingDistribution ?? {
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
    "5": 0,
  };

  // ⭐ Skeleton for Rating Summary
  const SummarySkeleton = () => (
    <div className="animate-pulse bg-card rounded-lg border border-border p-4 space-y-4">
      <div className="h-5 bg-muted rounded w-40"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-12 h-4 bg-muted rounded"></div>
          <div className="flex-1 h-2 bg-muted rounded"></div>
          <div className="w-6 h-4 bg-muted rounded"></div>
        </div>
      ))}
    </div>
  );

  // ⭐ Skeleton for Ratings List
  const RatingSkeleton = () => {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-muted"></div>

              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div key={s} className="w-4 h-4 bg-muted rounded"></div>
                  ))}
                </div>
              </div>

              <div className="w-16 h-4 bg-muted rounded"></div>
            </div>

            <div className="h-3 bg-muted rounded w-full mt-3"></div>
            <div className="h-3 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-4 bg-background">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
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
            {getPaymentMethods().length > 0 && (
              <div className="flex gap-3 mt-2 flex-wrap items-center">
                {getPaymentMethods().map((method) => (
                  <img
                    key={method}
                    src={`${method.toLowerCase()}-logo.png`}
                    alt={method}
                    className="h-6"
                  />
                ))}
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
            )}
          </div>
        </div>

        <hr />
      </div>

      <div className="p-4">
        {/* Summary Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Rating Summary</h2>

          {isLoadingRatings ? (
            <SummarySkeleton />
          ) : (
            <div className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium">
                  Total Ratings: {totalRatings}
                </span>
              </div>

              {totalRatings > 0 ? (
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count =
                      ratingDistribution[star.toString()] || 0;

                    const percentage =
                      totalRatings > 0 ? (count / totalRatings) * 100 : 0;

                    return (
                      <div key={star} className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">{star}</span>
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        </div>

                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>

                        <span className="text-sm text-muted-foreground">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No ratings available yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Ratings List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">All Ratings</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>

          {isLoadingRatings && <RatingSkeleton />}

          {ratingsError && !isLoadingRatings && (
            <p className="text-sm text-red-500">{ratingsError}</p>
          )}
          {!isLoadingRatings && !ratingsError && ratings.length === 0 && (
            <p className="text-sm text-muted-foreground">No ratings yet.</p>
          )}

          {!isLoadingRatings && (
            <div className="space-y-4 mt-2">
              {ratings.map((rating, index) => (
                <div
                  key={rating.id}
                  ref={index === ratings.length - 1 ? lastRatingRef : null}
                  className={`bg-card rounded-lg border border-border p-4 transition-colors ${rating.ratingPermlink
                    ? "cursor-pointer hover:bg-muted/50"
                    : ""
                    }`}
                  onClick={() => {
                    if (!rating.ratingPermlink) return;
                    window.open(
                      `https://hive.blog/@${rating.ratingAuthor}/${rating.ratingPermlink}`,
                      "_blank"
                    );
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <img
                        src={`https://images.hive.blog/u/${rating.ratingAuthor}/avatar`}
                        alt={rating.ratingAuthor}
                        className="w-12 h-12 rounded-full object-cover border border-border"
                      />

                      <div className="flex flex-col">
                        <span className="font-medium">@{rating.ratingAuthor}</span>

                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < rating.rating
                                ? "fill-yellow-500 text-yellow-500"
                                : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {format(rating.createdAt)}
                      </span>
                      {currentUser && isIOS() && (
                        <div onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                          <ThreeDotMenu username={rating.ratingAuthor} permlink={rating.ratingPermlink} />
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-foreground">{rating.ratingText}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessRatingsPage;