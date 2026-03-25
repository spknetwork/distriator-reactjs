import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAioha } from "@aioha/react-ui";
import { BusinessRatingService } from "../../services/business-rating-service";
import { BusinessRatingSummaryService } from "../../services/business-rating-summary-service";
import { useAuthData } from "../../utils/auth-utils";
import type { BusinessModel } from "../../types/business";
import type { BusinessRatingSummaryResponse } from "../../types/business-rating";

interface BusinessRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessModel;
  onRatingSubmitted: (summary: BusinessRatingSummaryResponse) => void;
}

const parseSocialUrl = (url: string) => {
  try {
    const match = url.match(/@([^/]+)\/([^/]+)/);
    if (match) {
      return { author: match[1], permlink: match[2] };
    }
  } catch {
    // ignore
  }
  return null;
};

const generateRandomString = (length: number) => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
};

const generateStarEmojis = (rating: number) => {
  return "⭐".repeat(rating);
};


export const BusinessRatingDialog = ({
  isOpen,
  onClose,
  business,
  onRatingSubmitted,
}: BusinessRatingDialogProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCommentingOnSocial, setIsCommentingOnSocial] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { token, username, isWeb2User, isAuthenticated } = useAuthData();
  const { aioha, user } = useAioha();
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  const resetAndClose = () => {
    setRating(0);
    setReviewText("");
    setSubmitted(false);
    setIsSubmitting(false);
    onClose();
  };

  const fetchAndUpdateSummary = async () => {
    if (!business.id) return;
    try {
      const response = await BusinessRatingSummaryService.getBusinessRatingSummary(business.id);
      if (response.isSuccess && response.data) {
        onRatingSubmitted(response.data);
      }
    } catch (error) {
      console.error("Error fetching rating summary:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!isAuthenticated || !token) {
      toast.error("Please log in to submit a rating");
      return;
    }

    if (reviewText.trim().length < 60) {
      toast.error("Please write at least 60 characters for your review");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isWeb2User) {
        // Web2 user: simplified submission - no blockchain interaction
        const submitResult = await BusinessRatingService.submitWeb2BusinessRating(
          token,
          business.id!,
          rating,
          reviewText.trim()
        );

        if (submitResult.valid) {
          setSubmitted(true);
          toast.success("Rating submitted successfully!");
          await fetchAndUpdateSummary();
        } else {
          toast.error(submitResult.errorMessage || "You can only submit one rating every 24 hours as a web2 user.");
        }
      } else {
        // Hive user: post comment on blockchain then submit rating
        let hivePostPermlink = "";

        const socialUrl = business.distriator.verification?.hivePost ??
          "https://peakd.com/spendhbd/@thedistriator/distriator-business-ratings-container-post";

        const socialData = parseSocialUrl(socialUrl);

        if (socialData && user) {
          setIsCommentingOnSocial(true);

          try {
            const stars = generateStarEmojis(rating);
            const ratingCommentPermlink = generateRandomString(8);
            const randomBusinessImage = business.profile.displayImage;
            const encodedBusinessName = encodeURIComponent(business.profile.displayName);
            const distriatorRatingLink = `https://distriator.com/#/ratings/${encodedBusinessName}`;
            const ratingCommentUrl = `https://hive.blog/@${user}/${ratingCommentPermlink}`;

            let commentBody = `# ${stars}\n\n`;

            const jsonMetadata: Record<string, unknown> = {
              app: "distriator/1.0.0",
              business_display_name: business.profile.displayName,
              developer: "sagarkothari88",
              format: "markdown",
              tags: ["spendhbd", "distriator", "spendtoearn"],
              team: "spknetwork",
              rating: rating,
              ratingText: reviewText.trim(),
              distriator_rating_url: distriatorRatingLink,
              rating_comment_url: ratingCommentUrl,
            };

            if (randomBusinessImage) {
              jsonMetadata.image = [randomBusinessImage];
              jsonMetadata.business_image = randomBusinessImage;
            }

            if (reviewText.trim()) {
              commentBody += `#### ${reviewText.trim()}\n\n`;
            }

            if (randomBusinessImage) {
              commentBody += `![${business.profile.displayName}](${randomBusinessImage})\n\n`;
            }

            commentBody += `--------\n<sub>Business: [${business.profile.displayName}](https://distriator.com/#/business/${business.profile.displayName.replace(/ /g, "%20")}/)\nRating submitted via [Distriator](https://distriator.com)</sub>\n\n`;

            hivePostPermlink = ratingCommentPermlink;

            const commentResult = await aioha.comment(
              socialData.author,
              socialData.permlink,
              hivePostPermlink,
              "",
              commentBody,
              jsonMetadata,
              {
                author: user,
                permlink: hivePostPermlink,
                max_accepted_payout: "100000.000 HBD",
                percent_hbd: 10000,
                allow_votes: true,
                allow_curation_rewards: true,
                extensions: [
                  [
                    0,
                    {
                      beneficiaries: [{ account: "distriator.bene", weight: 8000 }],
                    },
                  ],
                ],
              }
            );

            if (!commentResult.success) {
              toast.error("Failed to comment on business onboarding post");
              setIsSubmitting(false);
              setIsCommentingOnSocial(false);
              return;
            }
          } catch (error) {
            console.error("Error commenting on social post:", error);
            toast.error("Failed to comment on business onboarding post. Please try again.");
            setIsSubmitting(false);
            setIsCommentingOnSocial(false);
            return;
          } finally {
            setIsCommentingOnSocial(false);
          }
        }

        // Submit rating to backend
        const submitResult = await BusinessRatingService.submitBusinessRating(
          token,
          business.id!,
          "", // no invoiceId for direct rating
          "", // no trxnId for direct rating
          rating,
          reviewText.trim(),
          username,
          hivePostPermlink
        );

        if (submitResult.valid) {
          setSubmitted(true);
          toast.success("Rating submitted successfully!");
          await fetchAndUpdateSummary();
        } else {
          toast.error(submitResult.errorMessage || "You can only submit one rating every 24 hours as a web2 user.");
        }
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const businessImage = business.profile.displayImage || "https://images.hive.blog/u/null/avatar";

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg border border-gray-700 max-w-md mx-4 p-6 w-full">
        <div className="flex flex-col items-center space-y-4">
          {/* Business Image */}
          <img
            src={businessImage}
            alt={business.profile.displayName}
            className="w-20 h-20 rounded-full object-cover border-2 border-primary"
          />

          {/* Business Name */}
          <h3 className="text-xl font-semibold text-center">
            {business.profile.displayName}
          </h3>

          {/* Instruction Text */}
          {!submitted ? (
            <p className="text-center text-sm text-muted-foreground">
              Tap a star to rate your experience at {business.profile.displayName}
            </p>
          ) : (
            <p className="text-center text-sm text-green-500 font-medium">
              Thank you for your rating!
            </p>
          )}

          {/* Stars */}
          {!isSubmitting && !submitted && (
            <div className="flex space-x-1">
              {[0, 1, 2, 3, 4].map((starIndex) => (
                <button
                  key={starIndex}
                  onClick={() => handleStarClick(starIndex)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      starIndex < rating
                        ? "text-yellow-500 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Review Text Field */}
          {!submitted && (
            <div className="w-full mt-2">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share details of your own experience at this place"
                className="w-full min-h-[80px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
                aria-label="Share details of your own experience at this place"
              />
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Minimum 60-character review required</span>
                </div>
                <div className="flex items-center space-x-2" aria-live="polite">
                  <span
                    className={`${
                      reviewText.trim().length >= 60
                        ? "text-success"
                        : "text-warning"
                    }`}
                  >
                    {reviewText.trim().length}/60
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {(isSubmitting || isCommentingOnSocial) && (
            <div className="flex items-center space-x-2">
              <span className="loading loading-ring loading-md"></span>
              <span className="text-sm">
                {isCommentingOnSocial
                  ? "Commenting on business post..."
                  : "Submitting..."}
              </span>
            </div>
          )}
          {isMobile && isSubmitting && !isWeb2User && (
            <div className="text-center text-blink-yellow">
              Go to keychain & approve the request
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-col space-y-2 w-full">
            {!submitted ? (
              <>
                <button
                  onClick={handleSubmitReview}
                  disabled={
                    rating === 0 ||
                    reviewText.trim().length < 60 ||
                    isSubmitting ||
                    isCommentingOnSocial
                  }
                  className="btn btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Rating
                </button>
                <button
                  onClick={resetAndClose}
                  disabled={isSubmitting || isCommentingOnSocial}
                  className="btn btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button onClick={resetAndClose} className="btn btn-primary w-full">
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
