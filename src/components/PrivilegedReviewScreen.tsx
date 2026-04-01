/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "@radix-ui/themes";
import { useAuthData } from "../utils/auth-utils";
import { toast } from "sonner";
import { ApiService } from "../services/api";
import Confetti from "react-confetti";

const MIN_TEXT_LENGTH = 20;

export function PrivilegedReviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuthData();

  const photos: string[] = location.state?.photos || [];
  const business = location.state?.business || null;
  const claimData = location.state?.claimData || null;
  const claim = claimData?.claim;

  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState("");
  const [improvement, setImprovement] = useState("");
  const [experience, setExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const isValid =
    rating >= 1 &&
    liked.trim().length >= MIN_TEXT_LENGTH &&
    improvement.trim().length >= MIN_TEXT_LENGTH &&
    experience.trim().length >= MIN_TEXT_LENGTH;

  const handleSubmit = async () => {
    if (!isValid || !token || !claim) return;

    setIsSubmitting(true);
    try {
      const result = await ApiService.submitPrivilegedReview(token, claim, {
        rating,
        liked: liked.trim(),
        improvement: improvement.trim(),
        experience: experience.trim(),
        images: photos,
      });

      if (result.success) {
        setShowConfetti(true);
        toast.success("Congratulations!", {
          description: "Your review has been submitted and cashback reward has been sent to your wallet.",
        });
        setTimeout(() => {
          setShowConfetti(false);
          navigate("/cashback-status");
        }, 3000);
      } else {
        toast.error("Error", {
          description: result.message || "Failed to submit review",
        });
      }
    } catch (error: any) {
      console.error("Error submitting privileged review:", error);
      toast.error("Error", {
        description: error?.message || "Failed to submit review. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {showConfetti && <Confetti recycle={false} />}
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="flex items-center p-4 border-b border-border bg-background/80">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground ml-2">Submit Review</h1>
        </header>

        <main className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto">
          {/* Business Info */}
          {business && (
            <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center space-x-4">
                <img
                  src={business.profile?.displayImage}
                  alt={business.profile?.displayName}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary shadow-md"
                />
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {business.profile?.displayName}
                  </h3>
                  {claim?.claimValue && (
                    <p className="text-sm text-success font-medium">
                      Cashback: {claim.claimValue}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Star Rating */}
          <Card>
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-3">Rate your experience</h3>
              <div className="flex space-x-1 justify-center">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`w-10 h-10 ${i < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Question: Liked */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold mb-2">
                What did you like about the product or service you purchased?
              </h3>
              <textarea
                value={liked}
                onChange={(e) => setLiked(e.target.value)}
                placeholder="Share what you enjoyed..."
                className="w-full min-h-[100px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="mt-1 text-right text-sm">
                <span className={liked.trim().length >= MIN_TEXT_LENGTH ? "text-success" : "text-warning"}>
                  {liked.trim().length}/{MIN_TEXT_LENGTH}
                </span>
              </div>
            </div>
          </Card>

          {/* Question: Improvement */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold mb-2">
                What could be improved if anything about the product or service you just purchased?
              </h3>
              <textarea
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder="Share your suggestions..."
                className="w-full min-h-[100px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="mt-1 text-right text-sm">
                <span className={improvement.trim().length >= MIN_TEXT_LENGTH ? "text-success" : "text-warning"}>
                  {improvement.trim().length}/{MIN_TEXT_LENGTH}
                </span>
              </div>
            </div>
          </Card>

          {/* Question: Experience */}
          <Card>
            <div className="p-4">
              <h3 className="text-base font-semibold mb-2">
                My experience at {business?.profile?.displayName || "this business"}
              </h3>
              <textarea
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Describe your overall experience..."
                className="w-full min-h-[100px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                rows={3}
              />
              <div className="mt-1 text-right text-sm">
                <span className={experience.trim().length >= MIN_TEXT_LENGTH ? "text-success" : "text-warning"}>
                  {experience.trim().length}/{MIN_TEXT_LENGTH}
                </span>
              </div>
            </div>
          </Card>

          {/* Photo Preview */}
          {photos.length > 0 && (
            <Card>
              <div className="p-4">
                <h3 className="text-base font-semibold mb-3">
                  Photos ({photos.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {photos.map((url, index) => (
                    <img
                      key={index}
                      src={url}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg shadow-md"
                    />
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isValid || isSubmitting}
            className="btn btn-success w-full py-4 text-lg rounded-lg shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="loading loading-ring loading-md"></span>
                <span>Submitting...</span>
              </span>
            ) : (
              "Submit Review & Claim Cashback"
            )}
          </button>
        </main>
      </div>
    </>
  );
}
