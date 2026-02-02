import { useState, useEffect } from "react";
import { Star, Search, ArrowUpRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Header } from "../components/Header";
import { ApiService } from "../services/api";
import type { CashbackLog } from "../types/responses";
import { useAuthData } from "../utils/auth-utils";
import { useBusinesses } from "../hooks/useBusinesses";
import type { BusinessModel } from "../types/business";
import { ViewState } from "../types/enums";
import { RoleType } from "../types/role";
import { useNavigate } from "react-router-dom";

export default function CashbackLogs() {
  const { token, type: userRoleType } = useAuthData();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();
  const [logs, setLogs] = useState<CashbackLog[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [limit] = useState(20);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    pageSize: number;
    totalClaims: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  // Check if user has admin or super admin access
  const hasAccess = userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;

  const fetchLogs = async (
    searchTerm: string = "",
    pageNum: number = 1,
    append: boolean = false,
    signal?: AbortSignal
  ) => {
    if (!token) return;

    if (!append) {
      setViewState(ViewState.LOADING);
    }
    setError(null);

    try {
      const response = await ApiService.getCashbackLogs(
        token,
        pageNum,
        limit,
        searchTerm,
        signal
      );

      if (response.success) {
        const sortedLogs = response.data.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() -
            new Date(a.updatedAt).getTime()
        );

        if (append) {
          setLogs((prevLogs) => [...prevLogs, ...sortedLogs]);
        } else {
          setLogs(sortedLogs);
          setViewState(
            sortedLogs.length > 0 ? ViewState.DATA : ViewState.EMPTY
          );
        }

        setPagination(response.pagination);
      } else {
        setError("Failed to fetch cashback logs");
        if (!append) setViewState(ViewState.ERROR);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "An error occurred");
      if (!append) setViewState(ViewState.ERROR);
    } finally {
      if (append) setLoadingMore(false);
    }
  };

  /** INITIAL LOAD + SEARCH */
  useEffect(() => {
    if (!hasAccess || !token) return;
    
    const abortController = new AbortController();
    const signal = abortController.signal;

    fetchLogs(search, 1, false, signal);

    return () => abortController.abort();
  }, [token, search, hasAccess]);

  /** INFINITE SCROLL (append only) */
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
          document.body.offsetHeight - 100 &&
        pagination?.hasNextPage &&
        !loadingMore
      ) {
        setLoadingMore(true);
        const nextPage = pagination.currentPage + 1;
        fetchLogs(search, nextPage, true);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pagination, loadingMore]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setLogs([]);
    setLoadingMore(false);
  };



  const getBorderClass = (status: string) => {
    if (status === 'approved-v3') return 'border-green-500';
    if (status === 'rejected') return 'border-red-500';
    return 'border-border';
  };
  const getAdminName = (log: CashbackLog) => {
    return log.approvedByAdminName || log.rejectedByAdminName || "null";
  };

  const getRating = (log: CashbackLog) => {
    return log.adminApprovalRating || 0;
  };

  const getBusinessDetails = (businessOwner: string): BusinessModel | undefined => {
    return businesses.find(business => business.distriator.owner === businessOwner);
  };

  const handleViewPost = (username: string, permlink: string) => {
    const postUrl = `https://hive.blog/@${username}/${permlink}`;
    window.open(postUrl, '_blank');
  };

  // Redirect non-admin users to home
  useEffect(() => {
    if (!hasAccess) {
      navigate("/");
    }
  }, [hasAccess, navigate]);

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          title={"Cashback Logs"}
          isDrawerMenuRequired={true}
        />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. Only Admin and Super Admin users can view cashback logs.
          </p>
          <button
            onClick={() => navigate("/")}
            className="btn btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title={"Cashback Logs"}
        isDrawerMenuRequired={true}
      />

      {/* Page Content */}
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search by business name, admin name, or username..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Loading State */}
        {viewState === ViewState.LOADING && (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                {/* Title skeleton */}
                <div className="mb-2">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                </div>

                {/* First row: Business Profile Image, Display Name, time ago */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded mb-1 w-3/4"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>

                {/* Second row: User avatar, username, claimValue */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div>
                    <div className="h-3 bg-gray-300 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-300 rounded w-12"></div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="h-4 bg-gray-300 rounded mb-1 w-16"></div>
                    <div className="h-3 bg-gray-300 rounded w-20"></div>
                  </div>
                </div>

                {/* View post and admin info */}
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-4 bg-gray-300 rounded w-16"></div>
                </div>

                {/* Admin avatar and name */}
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-24"></div>
                </div>

                {/* Stars */}
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                  ))}
                </div>

                {/* Optional reason */}
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {viewState === ViewState.ERROR && error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {viewState === ViewState.EMPTY && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No cashback logs found.</p>
          </div>
        )}

        {/* List Screen */}
        {viewState === ViewState.DATA && (
          <div className="space-y-4">
            {logs.map((log) => {
              const business = getBusinessDetails(log.business);
              return (
                <div
                  key={log._id}
                  className={`bg-card border ${getBorderClass(log.status)} rounded-lg p-4`}
                >
                  {/* Title: Approved or Rejected */}
                  <div className="mb-2">
                    <p className={`text-sm font-medium ${log.status === 'approved-v3' ? 'text-green-600' : 'text-red-600'}`}>
                      {log.status === 'approved-v3' ? 'Approved' : 'Rejected'}
                    </p>
                  </div>

                  {/* First row: Business Profile Image, Display Name, time ago updatedAt */}
                  <div className="flex items-center gap-4 mb-2">
                    <img
                      src={business?.profile.displayImage}
                      alt="Business Profile"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {business?.profile.displayName || log.business}
                      </p>
                      <p className="text-sm text-muted-foreground">{log.transactionAmount}</p>
                    </div>
                  </div>

                  {/* Second row: User avatar, username, claimValue and transactionAmount */}
                  <div className="flex items-center gap-4 mb-2">
                    <img
                      src={`https://images.hive.blog/u/${log.username}/avatar`}
                      alt="User Avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm text-foreground">{log.username}</p>
                      <button
                      onClick={() => handleViewPost(log.username, log.permlink)}
                      className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <span>View post</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-semibold text-green-500">{log.claimValue}</p>
                    </div>
                  </div>

                  <div className="flex justify-start mb-2">
                    {log.status=== 'approved-v3'?<p> Approved By</p> : <p>Rejected By</p>}
                  </div>

                  {/* Last row: Admin avatar, name */}
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                      <img
                        src={`https://images.hive.blog/u/${getAdminName(log)}/avatar`}
                        alt="Admin Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm text-foreground">{getAdminName(log)}</p>
                        <p className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.approvalDate ?? log.rejectionDate ?? log.updatedAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    {/* Stars in golden color */}
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < getRating(log) ? "text-yellow-600 fill-current" : "text-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  {/* Reason if rating 0-3 and reason available */}
                  {getRating(log) >= 0 && getRating(log) <= 3 && log.approvalRejectionReason && (
                    <p className="text-sm text-red-600">{log.approvalRejectionReason}</p>
                  )}
                </div>
              );
            })}

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* Error Message for Load More */}
            {error && logs.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mt-4">
                <p className="text-destructive">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
