import { useEffect, useState, type JSX } from "react";
import type { ClaimStatusDTO } from "../types/cashback-status";
import { useAuthData } from "../utils/auth-utils";
import { fetchBusinessesApi } from "../services/BusinessApi";
import type { BusinessModel } from "../types/business";
import { ApiService } from "../services/api";
import { ArrowDownLeft, ArrowUpRight, Calendar, Loader2, Star } from "lucide-react";
import { format } from "timeago.js";

// Card component with dark-optimized colors
const ClaimCard = ({
    claim,
    renderStatusIcon,
    currentUser,
}: {
    claim: ClaimStatusDTO;
    renderStatusIcon: (status: string) => JSX.Element;
    currentUser: string;
}) => {
    const { token } = useAuthData();
    const [businessImage, setBusinessImage] = useState<string>();
    const [businessName, setBusinessName] = useState<string>("");
    const [localStatus, setLocalStatus] = useState<string>(claim.status);
    const [claiming, setClaiming] = useState<boolean>(false);
    const [claimResult, setClaimResult] = useState<{ success?: boolean; message?: string } | null>(null);

    useEffect(() => {
        const abortController = new AbortController();
        const signal = abortController.signal;
        const fetchBusinessImage = async () => {
            try {
                const businesses: BusinessModel[] = await fetchBusinessesApi(signal);
                const ownedBusiness = businesses.find(
                    (b) => b.distriator?.owner === claim.business
                );
                setBusinessImage(
                    ownedBusiness?.profile?.displayImage ||
                    "https://img.daisyui.com/images/stock/photo-1606107557195-0e29a4b5b4aa.webp"
                );
                setBusinessName(ownedBusiness?.profile?.displayName || claim.business);
            } catch (error) {
                console.error("Failed to fetch business image:", error);
            }
        };

        fetchBusinessImage();
        return () => {
            abortController.abort('avoid duplicate requests');
        };
    }, [claim.business, token]);

    useEffect(() => {
        // keep localStatus in sync if claim prop changes
        setLocalStatus(claim.status);
    }, [claim.status]);

    const handleClaimNow = async () => {
        if (claiming) return;
        // invoice field might be named invoice or invoiceId depending on backend
        const invoice = (claim as any).invoice || (claim as any).invoiceId || "";
        if (!token) {
            setClaimResult({ success: false, message: "Authentication missing" });
            return;
        }
        if (!invoice) {
            setClaimResult({ success: false, message: "Invoice ID missing" });
            return;
        }

        try {
            setClaiming(true);
            setClaimResult(null);
            const res = await ApiService.claimApproved(token, claim.permlink, invoice);
            if (res.success) {
                // update UI instantly
                setClaimResult({ success: true, message: res.message || "Cashback claimed successfully" });
                setLocalStatus("collected");
            } else {
                setClaimResult({ success: false, message: res.message || "Failed to claim cashback" });
            }
        } catch (err: any) {
            setClaimResult({ success: false, message: err?.message || "Failed to claim cashback" });
        } finally {
            setClaiming(false);
        }
    };

    return (
        <div
            className={`relative rounded-xl border shadow-lg
    hover:border-primary transition-all duration-200 flex flex-col overflow-hidden
    bg-gradient-to-br from-[#23272f] via-[#212327] to-[#181A20]
    w-full max-w-sm mx-auto ${localStatus === "approved-v3" ? "border-green-500 border-2" : "border-gray-800"}`}
        >
            {/* Header: Status + Date */}
            <div className="flex items-center justify-between px-4 pt-4">
                <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full
        ${localStatus === "approved" ||
                            localStatus === "approved-v3" ||
                            localStatus === "collected"
                            ? "bg-green-900 text-green-300"
                            : localStatus === "rejected"
                                ? "bg-red-900 text-red-300"
                                : localStatus === "submitted" || localStatus === "created" || localStatus === "onchain"
                                    ? "bg-yellow-800 text-yellow-200"
                                    : "bg-gray-900 text-gray-300"
                        }`}
                >
                    {renderStatusIcon(localStatus)}
                    <span className="capitalize">
                        {localStatus === "created" || localStatus === "submitted" || localStatus === "onchain"
                            ? "Pending"
                            : localStatus === "approved-v3"
                                ? "Ready to claim"
                                : localStatus === "collected"
                                    ? "Collected"
                                    : localStatus}
                    </span>
                </span>

                <div className="flex flex-col items-end text-[10px] sm:text-xs text-gray-400">
                    <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                    <span className="mt-0.5">{format(claim.createdAt)}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-4 flex-grow">
                {/* Business + Avatar */}
                <div className="flex items-center gap-3">
                    <img
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-gray-900"
                        src={businessImage}
                    />
                    <div>
                        <h3 className="text-sm sm:text-base font-semibold text-white leading-tight">
                            {businessName}
                        </h3>
                    </div>
                </div>

                {/* Amount & Claim Value */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Amount (Spent) */}
                    <div
                        className="p-3 rounded-lg flex flex-col items-center"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(205,70,75,0.22) 0%, rgba(120,30,37,0.10) 100%)",
                            border: "1px solid rgba(205,70,75,0.23)",
                        }}
                    >
                        <p className="text-[11px] sm:text-xs font-bold text-red-300 flex items-center gap-1">
                            Spent <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-200" />
                        </p>
                        <p className="text-base sm:text-lg font-bold text-white mt-1">
                            ₹{claim.amount}
                        </p>
                    </div>

                    {/* Claim Value (Cashback) */}
                    <div
                        className="p-3 rounded-lg flex flex-col items-center"
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(46,197,112,0.22) 0%, rgba(30,120,80,0.10) 100%)",
                            border: "1px solid rgba(46,197,112,0.23)",
                        }}
                    >
                        <p className="text-[11px] sm:text-xs font-bold text-green-300 flex items-center gap-1">
                            Cashback{" "}
                            <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4 text-green-200" />
                        </p>
                        <p className="text-base sm:text-lg font-bold text-white mt-1">
                            ₹{claim.claimValue}
                        </p>
                    </div>
                </div>
            </div>

            {/* Rating and Reason for Rejected Claims */}
            {(localStatus === "rejected" || localStatus === "approved-v3" ) && (
                <div className="px-4 pb-2">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${
                                    star <= claim.adminApprovalRating!
                                        ? "text-yellow-500 fill-current"
                                        : "text-gray-400"
                                }`}
                            />
                        ))}
                    </div>
                    {claim.approvalRejectionReason && (
                        <p className="text-xs text-red-400 text-center">Note from Admin: {claim.approvalRejectionReason}</p>
                    )}
                </div>
            )}

            {/* Buttons */}
            <div className="px-4 pb-4 mt-auto space-y-2">
                <button
                    className="w-full px-3 py-2 rounded-md text-xs sm:text-sm font-medium bg-primary text-white shadow hover:bg-primary/90 transition"
                    onClick={() =>
                        window.open(
                            `https://hive.blog/@${currentUser}/${claim.permlink}`,
                            "_blank"
                        )
                    }
                >
                    See Business Review
                </button>

                {/* Claim now button */}
                {localStatus === "approved-v3" && (
                    <>
                        <button
                            className="w-full px-3 py-2 rounded-md text-xs sm:text-sm font-medium bg-emerald-500 text-white shadow hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center"
                            onClick={handleClaimNow}
                            disabled={claiming}
                        >
                            {claiming && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Claim now
                        </button>

                        {claimResult && (
                            <div
                                className={`text-xs mt-1 ${claimResult.success ? "text-green-300" : "text-red-300"
                                    }`}
                            >
                                {claimResult.message}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );

};
export default ClaimCard;