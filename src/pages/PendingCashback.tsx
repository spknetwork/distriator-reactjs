import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthData } from "../utils/auth-utils";
import { RoleType } from "../types/role";
import { ApiService } from "../services/api";
import type { PendingCashback } from "../types/responses";
import { toast } from "sonner";
import PendingCashbackDetail from "../components/PendingCashbackDetail";
import PendingCashbackList from "../components/PendingCashbackList";
import CommonLayout from "../components/CommonLayout";
import { ViewState } from "../types/enums";

const PendingCashbackPage = () => {
  const { type: userRoleType, token } = useAuthData();
  const navigate = useNavigate();
  const [pendingCashbacks, setPendingCashbacks] = useState<PendingCashback[]>([]);
  const [selectedCashback, setSelectedCashback] = useState<PendingCashback | null>(null);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  // Check if user has admin or super admin access
  const hasAccess = userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;

  useEffect(() => {
    if (hasAccess && token) {
      const abortController = new AbortController();
      fetchPendingCashbacks(abortController.signal);
      return () => {
        abortController.abort();
      };
    } else {
      setViewState(ViewState.EMPTY);
    }
  }, [hasAccess, token]);

  const fetchPendingCashbacks = async (signal?: AbortSignal) => {
    setViewState(ViewState.LOADING);
    const response = await ApiService.getPendingCashbacks(token!, signal);
    if (response.viewState === ViewState.DATA && response.data) {
      setPendingCashbacks(response.data);
    }
    setViewState(response.viewState);
  };

  const handleApproveReject = async (cashback: PendingCashback, approved: boolean, reason: string, rating: number) => {
    const response = await ApiService.approveRejectCashback(
      token!,
      cashback.username,
      cashback.permlink,
      cashback.invoice,
      { approved, reason, rating }
    );

    if (response.viewState === ViewState.DATA && response.data) {
      toast.success(response.data.message);
      // Refresh the list
      await fetchPendingCashbacks();
      // Close detail view
      setSelectedCashback(null);
    } else {
      toast.error(response.error || "Failed to process the request");
    }
  };

  if (!hasAccess) {
    return (
      <CommonLayout title="Pending Cashback Reviews">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Only Admin and Super Admin users can view pending cashbacks.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary"
          >
            Go to Home
          </button>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      {selectedCashback ? (
        <PendingCashbackDetail
          cashback={selectedCashback}
          onBack={() => setSelectedCashback(null)}
          onApprove={(reason, rating) => handleApproveReject(selectedCashback, true, reason, rating)}
          onReject={(reason, rating ) => handleApproveReject(selectedCashback, false, reason, rating)}
        />
      ) : (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-foreground">Pending Cashback Reviews</h1>
            <p className="text-muted-foreground mt-2">
              Review and approve or reject pending cashback claims
            </p>
          </div>
          <PendingCashbackList
            cashbacks={pendingCashbacks}
            onSelectCashback={setSelectedCashback}
            viewState={viewState}
          />
        </>

      )}
    </CommonLayout>
  );
};

export default PendingCashbackPage;
