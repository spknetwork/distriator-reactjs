import { useState, useEffect } from "react";
import type { PendingCashback } from "../types/responses";
import type { BusinessModel } from "../types/business";
import { ArrowLeft, Check, X, ExternalLink, Clock, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchBusinessesApi } from "../services/BusinessApi";

interface PendingCashbackDetailProps {
  cashback: PendingCashback;
  onBack: () => void;
  onApprove: (reason: string, rating: number) => void;
  onReject: (reason: string, rating: number) => void;
}

const PendingCashbackDetail = ({
  cashback,
  onBack,
  onApprove,
  onReject
}: PendingCashbackDetailProps) => {
  const [reason, setReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [business, setBusiness] = useState<BusinessModel | null>(null);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveReasonModal, setShowApproveReasonModal] = useState(false);

  const handleApprove = async () => {
    if (selectedRating === 0) return;

    if (selectedRating <= 3) {
      setShowApproveReasonModal(true);
      return;
    }

    setIsProcessing(true);
    try {
      await onApprove("", selectedRating);
      setSelectedRating(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (reason.trim().length < 60) return;
    setIsProcessing(true);
    try {
      await onReject(reason.trim(),0);
      setShowRejectModal(false);
      setReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelReject = () => {
    setShowRejectModal(false);
    setReason("");
  };

  const handleApproveWithReason = async () => {
    if (reason.trim().length < 60) return;
    setIsProcessing(true);
    try {
      await onApprove(reason.trim(), selectedRating);
      setShowApproveReasonModal(false);
      setSelectedRating(0);
      setReason("");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelApproveReason = () => {
    setShowApproveReasonModal(false);
    setReason("");
  };

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const abortController = new AbortController();
        const businesses = await fetchBusinessesApi(abortController.signal);
        const foundBusiness = businesses.find(b => b.distriator?.owner === cashback.business);
        setBusiness(foundBusiness || null);
      } catch (error) {
        console.error("Failed to fetch business:", error);
        setBusiness(null);
      }
    };

    if (cashback.business) {
      fetchBusiness();
    }
  }, [cashback.business]);

  const openHivePost = () => {
    const url = `https://hive.blog/@${cashback.username}/${cashback.permlink}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Cashback Review</h2>
        </div>
      </div>

      {/* Business Info Section */}
      {business && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Business Information</h3>
          <div className="flex items-center gap-4">
            {business.profile?.displayImage && (
              <img
                src={`https://images.hive.blog/320x0/${business.profile.displayImage}`}
                alt={business.profile.displayName}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h4 className="text-xl font-semibold text-foreground">{business.profile?.displayName}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Details Card */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Cashback Details</h3>
          <div className="flex flex-row flex-wrap gap-2 justify-center items-center">
            <div className="bg-accent/50 p-2 rounded-lg w-full sm:w-auto text-center sm:text-left">
              <label className="text-sm font-medium text-muted-foreground">Claim Value</label>
              <p className="text-foreground font-semibold">{cashback.claimValue}</p>
            </div>
            <button
              onClick={openHivePost}
              className="flex items-center gap-2 px-4 py-2 text-primary hover:text-primary/80 text-sm border border-primary rounded-lg hover:bg-primary/10 transition-colors w-full sm:w-auto"
            >
              <ExternalLink className="w-4 h-4" />
              View Post
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Username</label>
              <div className="flex items-center gap-3">
                <img
                  src={`https://images.hive.blog/u/${cashback.username}/avatar`}
                  alt={cashback.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <p className="text-foreground">{cashback.username}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Invoice</label>
              <p className="text-foreground font-mono">{cashback.invoice}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Country</label>
              <p className="text-foreground">{cashback.country}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Timestamp</label>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-foreground">
                  {formatDistanceToNow(new Date(cashback.updatedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Transaction Amount</label>
              <p className="text-foreground">{cashback.transactionAmount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Claim Percentage</label>
              <p className="text-foreground">{cashback.percentage}</p>
            </div>
          </div>
        </div>

        {/* Guides Section */}
        {cashback.guides && cashback.guides.length > 0 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Guides</label>
            <div className="space-y-2">
              {cashback.guides.map((guide, index) => (
                <div key={index} className="flex justify-between items-center bg-accent/50 p-3 rounded">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://images.hive.blog/u/${guide.name}/avatar`}
                      alt={guide.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm">{guide.name}</span>
                  </div>
                  <span className="text-sm font-medium">{guide.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onborder Section */}
        {cashback.onborder && (
          <div className="mt-6">
            <label className="text-sm font-medium text-muted-foreground block mb-2">Onborder</label>
            <div className="bg-accent/50 p-3 rounded">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img
                    src={`https://images.hive.blog/u/${cashback.onborder.name}/avatar`}
                    alt={cashback.onborder.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm">{cashback.onborder.name}</span>
                </div>
                <span className="text-sm font-medium">{cashback.onborder.value}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Decision Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Decision</h3>

        {/* Wrapper */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">

          {/* Reject Button */}
          <button
            onClick={() => setShowRejectModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            <X className="w-4 h-4" />
            Reject
          </button>

          {/* Stars */}
          <div className="flex flex-col items-center gap-2 w-full sm:flex-row sm:items-center sm:gap-4 sm:justify-center sm:w-auto">
            <p className="text-sm text-muted-foreground text-center">Rate to Approve</p>
            <div className="flex justify-center gap-1 w-full sm:w-auto">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setSelectedRating(selectedRating === star ? 0 : star)}
                  className="focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                  aria-pressed={selectedRating === star}
                >
                  <Star
                    className={`w-6 h-6 ${star <= selectedRating
                      ? "text-yellow-500 fill-current"
                      : "text-gray-400"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleApprove}
            disabled={selectedRating === 0 || isProcessing}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
          >
            <Check className="w-4 h-4" />
            {isProcessing ? "Processing..." : "Submit"}
          </button>
        </div>
      </div>


      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Reject Reason</h3>
            <div className="space-y-4">
              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for rejection..."
                  className="w-full min-h-[80px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  aria-label="Provide a detailed reason for rejection"
                />
                {/* Minimum requirement and real-time char count */}
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Minimum 60-character reason required</span>
                  </div>
                  <div
                    className="flex items-center space-x-2"
                    aria-live="polite"
                  >
                    <span className={`${reason.trim().length >= 60 ? "text-success" : "text-warning"}`}>
                      {reason.trim().length}/60
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelReject}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={reason.trim().length < 60 || isProcessing}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Processing..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Reason Modal */}
      {showApproveReasonModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-black border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">Approve Reason</h3>
            <div className="space-y-4">
              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide a detailed reason for approval..."
                  className="w-full min-h-[80px] p-3 border border-border rounded-lg bg-background text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={2}
                  aria-label="Provide a detailed reason for approval"
                />
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Minimum 60-character reason required</span>
                  </div>
                  <div
                    className="flex items-center space-x-2"
                    aria-live="polite"
                  >
                    <span className={`${reason.trim().length >= 60 ? "text-success" : "text-warning"}`}>
                      {reason.trim().length}/60
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelApproveReason}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApproveWithReason}
                  disabled={reason.trim().length < 60 || isProcessing}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? "Processing..." : "Approve"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCashbackDetail;