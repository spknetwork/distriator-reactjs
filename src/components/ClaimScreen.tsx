/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { Coins, AlertCircle, CheckCircle, Star, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  getMonthlyClaimsTotal,
  getWeeklyClaimsTotal,
  type UserClaimResponseDTO,
} from "../types/claim";
import type { BusinessModel } from "../types/business";
import { Card } from "@radix-ui/themes";
import { fetchUserClaimsApi } from "../services/UserClaimsApi";
import { fetchBusinessesApi } from "../services/BusinessApi";
import { BusinessRatingService } from "../services/business-rating-service";
import ThisMonthClaims from "./ThisMonthClaims";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import CommonLayout from "./CommonLayout";
import { ClaimLevels } from "./ClaimLevels";
import { useAioha } from "@aioha/react-provider";
import { parseSocialUrl } from "../utils/social-url-parser";
import { DhiveService } from "../services/dhive-service";
import { BusinessSelectionDialog } from "./business/BusinessSelectionDialog";

dayjs.extend(relativeTime);

interface ClaimScreenProps {
  token: string;
  username: string;
  onClaimNow: (business: BusinessModel, claimData: UserClaimResponseDTO) => void;
}

export function ClaimScreen({
  token,
  username,
  onClaimNow,
}: ClaimScreenProps) {
  const [claimData, setClaimData] = useState<UserClaimResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessModel[]>([]);
  const [claimStats, setClaimStats] = useState({
    monthlyCount: 0,
    biweeklyCount: 0,
    monthlyTotal: "$ 0.000",
    biweeklyTotal: "$ 0.000",
    dailyClaimsCount: 0,
    canClaimDaily: true,
  });
  const [timeLeft, setTimeLeft] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessModel | null>(null);
  const [selectedClaimData, setSelectedClaimData] = useState<UserClaimResponseDTO | null>(null);
  const [ratingDataExists, setRatingDataExists] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCommentingOnSocial, setIsCommentingOnSocial] = useState(false);
  const { aioha } = useAioha();
  let hivePostPermlink = "";
  const currentClaim = claimData?.claim;
  const [hbdAvailable, setHBDAvailable] = useState(false);
  const [showBusinessSelection, setShowBusinessSelection] = useState(false);

  useEffect(() => {
    const checkRatingInitially = async () => {
      if (!token || !currentClaim?.invoice || !businesses.length) return;

      const business = businesses.find(
        (b) => b.distriator.owner === currentClaim?.business
      );

      if (!business) return;

      try {
        const res = await BusinessRatingService.checkBusinessRating(
          token,
          business.id!,
          currentClaim.invoice
        );

        if (res.valid && res.data?.exists) {
          setRatingDataExists(true);
        } else {
          setRatingDataExists(false);
        }
      } catch (err) {
        console.error("Initial rating check failed:", err);
      }
    };

    checkRatingInitially();
  }, [token, currentClaim, businesses]);

  useEffect(() => {
    async function checkBalance() {
      const available = await hasEnoughHBDBalance('thedistriator');
      setHBDAvailable(available);
    }
    checkBalance();
  }, []);

  // Update claimData when initialClaimData changes
  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;
    loadBusinesses(signal);

    const abortController2 = new AbortController();
    const signal2 = abortController2.signal;
    loadClaimData(signal2);

    // Cleanup function to abort any pending requests on unmount
    return () => {
      if (abortController) {
        abortController.abort('avoid duplicate requests');
      }
      if (abortController2) {
        abortController2.abort('avoid duplicate requests');
      }
    };
  }, []);

  useEffect(() => {
    if (!claimData) return;

    const monthlyCount = claimData.monthly?.length || 0;
    const biweeklyCount = claimData.biweekly?.length || 0;
    const monthlyTotal = claimData.monthly
      ? getMonthlyClaimsTotal(claimData.monthly)
      : "$ 0.000";
    const biweeklyTotal = claimData.biweekly
      ? getWeeklyClaimsTotal(claimData.biweekly)
      : "$ 0.000";

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentSource = claimData.monthly.filter(c => c.permlink !== null) || [];

    const recentCount = recentSource.filter((c) => {
      const ts = c.timestamp ? String(c.timestamp) : "";
      const date = new Date(ts.endsWith("Z") ? ts : ts + "Z");
      return date >= twentyFourHoursAgo && date <= now;
    }).length;

    const usedClaims = Math.min(2, recentCount);
    const availableClaims = Math.max(0, 2 - usedClaims);
    const canClaimDaily = availableClaims > 0;

    setClaimStats({
      monthlyCount,
      biweeklyCount,
      monthlyTotal,
      biweeklyTotal,
      dailyClaimsCount: availableClaims,
      canClaimDaily,
    });
  }, [claimData]);


  useEffect(() => {
    const currentClaim = claimData?.claim;
    if (!currentClaim?.timestamp) return;

    const expiry = new Date(currentClaim.timestamp + "Z");
    expiry.setHours(expiry.getHours() + 2);

    const updateTimer = () => {
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [claimData?.claim?.timestamp]);

  const loadClaimData = async (signal: AbortSignal) => {
    if (!token) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetchUserClaimsApi(token, signal);

      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      if (response) {
        setClaimData(response);
      } else {
        console.error("Failed to load claim data");
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (!signal.aborted) {
        console.error("Failed to load claim data:", error);
      }
    } finally {
      // Only update loading state if request wasn't aborted
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  const loadBusinesses = async (signal: AbortSignal) => {

    try {
      const response = await fetchBusinessesApi(signal);

      // Check if request was aborted
      if (signal.aborted) {
        return;
      }

      if (response) {
        setBusinesses(response);
      } else {
        console.error("Failed to load businesses");
        toast.warning("Warning", {
          description:
            "Could not load business data. Some features may be limited.",
        });
      }
    } catch (error) {
      // Don't log error if request was aborted
      if (!signal.aborted) {
        console.error("Failed to load businesses:", error);
        toast.error("Error", {
          description: "Failed to load business data",
        });
      }
    }
  };
  const canClaim =
    currentClaim != null &&
    claimStats.canClaimDaily;

  const handleClaimNow = async () => {
    const business = businesses.find(
      (b) => b.distriator.owner === currentClaim?.business
    );
    if (!business || !claimData || !currentClaim?.invoice) {
      toast.error("Error", {
        description: "Business or claim data not found",
      });
      return;
    }
    const modifiedClaimData = {
      ...claimData,
      claim: currentClaim,
    };

    if (ratingDataExists || submitted) {
      // If rating already exists → go directly to upload
      onClaimNow(business, modifiedClaimData);
      return
    } else {
      // Otherwise open review dialog
      setSelectedBusiness(business);
      setSelectedClaimData(modifiedClaimData);
      setDialogOpen(true);
    }
  };

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1);
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

  const pickBusinessImage = (biz?: BusinessModel | null, sizePrefix = "https://images.hive.blog/0x0/") => {
    if (!biz) return null;
    const images = Array.isArray(biz.profile.images) ? biz.profile.images : [];
    const displayImage = biz.profile.displayImage;
    const candidates = [...images, displayImage].filter(Boolean) as string[];
    if (candidates.length === 0) return null;
    const raw = candidates[Math.floor(Math.random() * candidates.length)];
    if (!raw) return null;
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${sizePrefix}${raw}`;
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!selectedBusiness || !selectedClaimData || !selectedClaimData.claim) {
      toast.error("Error", {
        description: "Missing business or claim data",
      });
      return;
    }
    const claim = selectedClaimData.claim;
    const amount = claim.amount || claim.transactionAmount || "0";
    const rawAmount = amount ?? "0";

    // Remove everything except digits, dot and minus
    const numericValue = Number(String(rawAmount).replace(/[^0-9.-]/g, ""));

    const formattedAmount = `${numericValue.toFixed(2)} HBD`;
    const threePercentValue = numericValue * 0.03;
    const threePercentAmount = `${threePercentValue < 0.01 ? threePercentValue.toFixed(3) : threePercentValue.toFixed(2)} HBD`;

    setIsSubmitting(true);
    try {
      // Check if social verification URL exists
      const socialUrl = selectedBusiness.distriator.verification?.hivePost ?? 'https://peakd.com/spendhbd/@thedistriator/distriator-business-ratings-container-post';
      if (socialUrl) {
        // Parse the social URL to get author and permlink
        const socialData = parseSocialUrl(socialUrl);
        
        if (socialData) {
          setIsCommentingOnSocial(true);
          
          try {
            // Generate comment body with stars based on rating
            const stars = generateStarEmojis(rating);
            const timestamp = claim.timestamp ? new Date(claim.timestamp + (String(claim.timestamp).endsWith("Z") ? "" : "Z")).toISOString() : new Date().toISOString();
            const invoice = claim.invoice || "";
            const randomBusinessImage = pickBusinessImage(selectedBusiness);
            const encodedBusinessName = encodeURIComponent(selectedBusiness.profile.displayName);
            const distriatorRatingLink = `https://distriator.com/#/ratings/${encodedBusinessName}`;
            const claimPermlink = (claim as any)?.permlink as string | undefined;
            const purchaseTxLink = claimPermlink
              ? `https://hive.blog/@${username}/${claimPermlink}`
              : invoice
                ? `https://hiveblocks.com/tx/${invoice}`
                : "";
            const ratingCommentPermlink = generateRandomString(8);
            const ratingCommentUrl = `https://hive.blog/@${username}/${ratingCommentPermlink}`;
            
            // Build comment body - include review text only if provided
            let commentBody = `# ${stars}\n\n`;
            const jsonMetadata: any = {
              app: "distriator/1.0.0",
              "business_display_name": selectedBusiness.profile.displayName,
              "developer": "sagarkothari88",
              "format": "markdown",
              "invoice_id": invoice,
              "tags": [
                "spendhbd",
                "distriator",
                "spendtoearn"
              ],
              "team": "spknetwork",
              "rating": rating,
              "ratingText": reviewText.trim(),
              "distriator_rating_url": distriatorRatingLink,
              "purchase_tx_url": purchaseTxLink,
              "rating_comment_url": ratingCommentUrl,
            };

            if (randomBusinessImage) {
              jsonMetadata.image = [randomBusinessImage];
              jsonMetadata.business_image = randomBusinessImage;
            }

            if (reviewText.trim()) {
              commentBody += `#### ${reviewText.trim()}\n\n`;
            }

            if (randomBusinessImage) {
              commentBody += `![${selectedBusiness.profile.displayName}](${randomBusinessImage})\n\n`;
            }

            commentBody += `--------\n<sub>Business: [${selectedBusiness.profile.displayName}](https://distriator.com/#/business/${selectedBusiness.profile.displayName.replace(/ /g, '%20')}/)\nFor recent spend of ${formattedAmount} with invoice ${invoice} on ${timestamp}\nReceived ${threePercentAmount} (3% of spent) as instant cashback Reward.\nRating submitted via [Distriator](https://distriator.com)</sub>\n\n`;
                  
            // Comment on the social post
            hivePostPermlink = ratingCommentPermlink;
            const commentResult = await aioha.comment(
              socialData.author,
              socialData.permlink,
              hivePostPermlink,
              "", // Empty title
              commentBody,
              jsonMetadata,
              {
                author: username,
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
              toast.error("Error", {
                description: "Failed to comment on business onboarding post",
              });
              setIsSubmitting(false);
              setIsCommentingOnSocial(false);
              return;
            }
          } catch (error) {
            console.error("Error commenting on social post:", error);
            toast.error("Error", {
              description: "Failed to comment on business onboarding post. Please try again.",
            });
            setIsSubmitting(false);
            setIsCommentingOnSocial(false);
            return;
          } finally {
            setIsCommentingOnSocial(false);
          }
        }
      }

      // Submit the business rating
      const submitResult = await BusinessRatingService.submitBusinessRating(
        token,
        selectedBusiness.id!,
        selectedClaimData.claim.invoice,
        selectedClaimData.claim.invoice,
        rating,
        reviewText,
        username,
        hivePostPermlink
      );

      if (submitResult.valid) {
        setSubmitted(true);
        setRatingDataExists(true);
        setShowConfetti(true);
        toast.success("Congratulations!", {
          description: `Thank you for sharing business rating with us. You've received 3% cashback reward in your wallet. ${threePercentAmount} claimed successfully. \ngo check ur wallet history to see the cashback in your account`,
        });
        setTimeout(() => setShowConfetti(false), 4000);
      } else {
        toast.error("Error", {
          description: submitResult.errorMessage || "Failed to submit rating",
        });
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Error", {
        description: "Failed to submit rating. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddReview = () => {
    if (selectedBusiness && selectedClaimData) {
      onClaimNow(selectedBusiness, selectedClaimData);
    }
  };

  const handleNotNow = () => {
    setDialogOpen(false);
    setRating(0);
    setReviewText("");
    setSubmitted(false);
  };

  const hasEnoughHBDBalance = async (username: string, minimum: number = 0.1) => {
    try {
      const balance = await DhiveService.getAccountHBDBalance(username);
      if (typeof balance !== "number" || isNaN(balance)) {
        console.error("Invalid HBD balance:", balance);
        return false;
      }
      return balance >= minimum;
    } catch (err) {
      console.error("Error checking HBD balance:", err);
      return false;
    }
  }

  const isReviewFlow = ratingDataExists || submitted;
  const isRatingFlow = dialogOpen && !submitted && !ratingDataExists;
  const appBarTitle = isRatingFlow
    ? "Add Business Ratings"
    : isReviewFlow
      ? "Add Business Review"
      : "Claim Distriator";
  const appBarSubtitle =
    isRatingFlow || isReviewFlow ? "and Earn Crypto" : undefined;

  return (
    <>
      {showConfetti && <Confetti recycle={false} />}
      {showBusinessSelection && (
        <BusinessSelectionDialog
          businesses={businesses}
          onClose={() => setShowBusinessSelection(false)}
        />
      )}

      <CommonLayout title={appBarTitle} subtitle={appBarSubtitle}>
        <main className="p-4 sm:p-6 space-y-8">
          {loading && (
            <div className="w-full flex items-center justify-center py-6">
              <div className="flex items-center space-x-3">
                <span className="loading loading-ring loading-md"></span>
                <span className="text-muted-foreground text-sm">Loading claim data...</span>
              </div>
            </div>
          )}

          {/* Main Claim Card */}
          {!loading && (
            <Card>
              <div className="p-6 bg-gradient-to-br from-success/20 to-success/10 border border-success/30 rounded-lg sm:col-span-2 lg:col-span-1 flex flex-col items-center justify-center">
                <div className="flex items-center justify-center mb-4">
                  <Coins className="h-10 w-10 text-primary mr-3" />
                  <h2 className="text-4xl font-bold text-claim-amount">
                    {currentClaim?.claimValue || "0.000 HBD"}
                  </h2>
                </div>

                {canClaim && currentClaim ? (
                  <>
                    <div className="text-center mb-1">
                      <p className="text-muted-foreground mb-4 font-bold text-foreground">
                        Claim your cashback
                      </p>
                    </div>

                    <div className="mb-6 p-4 bg-background/50 rounded-lg border border-border/50 text-left flex flex-col items-center justify-center">
                      {/* Claimable Business Avatar and Name (centered) */}
                      <h4 className="font-semibold mb-3 text-lg flex items-center justify-center">
                        For payment with HBD at
                      </h4>
                      <div className="flex flex-col items-center justify-center mb-3">
                        {(() => {
                          const business = businesses.find(
                            (b) => b.distriator.owner === currentClaim?.business
                          );
                          const businessName = business?.profile?.displayName || currentClaim?.business || "Unknown Business";
                          const businessImage = business?.profile?.displayImage
                            ? `https://images.hive.blog/320x0/${business.profile.displayImage}`
                            : "https://images.hive.blog/u/null/avatar";

                          return (
                            <>
                              <img
                                className="size-16 rounded-box"
                                src={businessImage}
                              />
                              <div className="mt-2 font-semibold">
                                {businessName}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      <div className="text-sm space-y-2">
                        <p>
                          <span className="font-medium text-muted-foreground">
                            Invoice:
                          </span>{" "}
                          {currentClaim?.invoice}
                        </p>
                        <p>
                          <span className="font-medium text-muted-foreground">
                            Time ago:
                          </span>{" "}
                          {currentClaim?.timestamp
                            ? dayjs(currentClaim.timestamp + "Z").fromNow()
                            : "N/A"}
                        </p>
                        <p className="text-center font-bold text-lg text-claim-timer pt-2">
                          {timeLeft || "Calculating..."}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const business = businesses.find(
                        (b) => b.distriator.owner === currentClaim?.business
                      );
                      const shouldShowButton = !(business?.profile.displayName === claimData.businessDisplayName && (claimData.unverified_claims || 0) > 30);
                      return (
                        <>
                          {hbdAvailable ? (
                            <>
                              {shouldShowButton && (
                                <button
                                  onClick={handleClaimNow}
                                  disabled={!canClaim}
                                  className={`btn py-4 min-h-[64px] rounded-lg shadow-glow transform transition-transform duration-300 shadow-lg flex items-center justify-center mx-auto ${canClaim
                                    ? "btn-outline btn-success hover:scale-105"
                                    : "btn-disabled opacity-50 cursor-not-allowed"
                                    }`}
                                >
                                  {ratingDataExists ? (<Pencil className="h-6 w-6 mr-3" />) : (<Star className="h-6 w-6 mr-3" />)}

                                  <div className="flex flex-col text-left leading-tight">
                                  <span className="text-lg font-semibold">
                                  {ratingDataExists ? "Write Review" : "Add Ratings"}
                                  </span>
                                  <span className="text-sm opacity-80">
                                  & Earn Crypto
                                  </span>
                                </div>
                                </button>
                              )}
                            </>
                          ) :
                            (
                              <div className="p-3 bg-red-500/20 rounded-lg">
                                <p className="font-semibold text-red-500 flex items-center justify-center">
                                  Insufficient HBD balance to process claims. Please wait some time.
                                </p>
                              </div>
                            )
                          }
                          <p className="mt-4 text-sm text-muted-foreground flex items-center justify-center">
                            You can claim 2 cash-back rewards per day.
                          </p>
                        </>
                      );
                    })()}
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-semibold text-success mb-4 flex items-center justify-center">
                      Pay with HBD, Claim Rewards
                    </p>
                    <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                      Make a purchase at a participating business to earn cashback
                      rewards.
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-muted-foreground flex items-center justify-center">
                        You can claim 2 cash-back rewards per day.
                      </p>
                    </div>
                  </>
                )}
                {/* <button
                  onClick={handlePayClaimClick}
                  className="my-2 btn btn-success"
                >
                  Pay & Claim
                </button> */}

              </div>
            </Card>
          )}

          {!loading && (<Card>
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30 rounded-lg">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Available Claims
                </h3>
                <p className="text-3xl font-bold text-orange-400">
                  {claimStats.dailyClaimsCount}
                </p>
                <p className="text-sm text-muted-foreground">Remaining today</p>
              </div>
              {claimStats.canClaimDaily ? (
                <CheckCircle className="h-10 w-10 text-success" />
              ) : (
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </Card>)}

          {!loading && (
            <ClaimLevels biweeklyCount={claimData?.biweekly?.length || 0} />
          )}

          {/* Claim Statistics */}
          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              <Card>
                <div className="flex items-center justify-between p-6 bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 rounded-lg">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Monthly Claims
                    </h3>
                    <p className="text-3xl font-bold text-primary">
                      {claimStats.monthlyTotal}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {claimStats.monthlyCount} total claims
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
              </Card>
              <Card>
                <div className="flex items-center justify-between p-6 bg-gradient-to-br from-success/20 to-success/10 border border-success/30 rounded-lg sm:col-span-2 lg:col-span-1">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Biweekly Claims
                    </h3>
                    <p className="text-3xl font-bold text-success">
                      {claimStats.biweeklyTotal}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {claimStats.biweeklyCount} total claims
                    </p>
                  </div>
                  <CheckCircle className="h-10 w-10 text-success" />
                </div>
              </Card>
            </div>
          )}
          {/* This Month Claims */}
          {!loading && !!claimData?.monthly?.length && (
            <ThisMonthClaims monthly={claimData.monthly} />
          )}

          {/* Rating Dialog */}
          {dialogOpen && (
            <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-background rounded-lg shadow-lg border border-gray-700 max-w-md mx-4 p-6 w-full">
                <div className="flex flex-col items-center space-y-4">
                  {/* Business Image */}
                  {(() => {
                    const img = pickBusinessImage(selectedBusiness, "https://images.hive.blog/320x0/");
                    const fallback = "https://images.hive.blog/u/null/avatar";
                    return (
                      <img
                        src={img || fallback}
                        alt={selectedBusiness?.profile?.displayName || "Business"}
                        className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                      />
                    );
                  })()}
                  {/* Business Name */}
                  <h3 className="text-xl font-semibold text-center">
                    {selectedBusiness?.profile?.displayName || "Business"}
                  </h3>
                  {/* Rating Text */}
                  {!submitted ?
                    <p className="text-center text-sm text-muted-foreground">
                      Tap a star to Rate your experience at {selectedBusiness?.profile?.displayName || "Business"}
                    </p>
                    :
                    <p className="text-center text-sm text-muted-foreground">
                      Write a detailed review to earn more crypto.
                    </p>
                  }

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
                            className={`w-8 h-8 ${starIndex < rating ? "text-yellow-500 fill-current" : "text-gray-300"
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
                      {/* Minimum requirement and real-time char count */}
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">Minimum 60-character review required</span>
                        </div>
                        <div
                          className="flex items-center space-x-2"
                          aria-live="polite"
                        >
                          <span className={`${reviewText.trim().length >= 60 ? "text-success" : "text-warning"}`}>
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
                        {isCommentingOnSocial ? "Commenting on business post..." : "Submitting..."}
                      </span>
                    </div>
                  )}
                  {/* Buttons */}
                  <div className="flex flex-col space-y-2 w-full">
                    {!submitted ? (
                      <>
                        <button
                          onClick={handleSubmitReview}
                          disabled={rating === 0 || reviewText.trim().length < 60 || isSubmitting || isCommentingOnSocial}
                          className="btn btn-success w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Submit Review
                        </button>
                        <button
                          onClick={handleNotNow}
                          disabled={isSubmitting || isCommentingOnSocial}
                          className="btn btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Not Now
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleAddReview}
                          className="btn btn-primary w-full"
                        >
                          Write Detailed Review
                        </button>
                        <button
                          onClick={handleNotNow}
                          className="btn btn-outline w-full"
                        >
                          Not Now
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </CommonLayout>
    </>
  );
}
