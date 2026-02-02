/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { ApiService } from "../services/api";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useAuthData } from '../utils/auth-utils';
import type {
  ClaimStatusDTO,
  ClaimStatusResponseDTO,
} from "../types/cashback-status";
import { Header } from "./Header";
import ClaimCard from "./ClaimCard";

// Main screen container
export function ClaimStatusScreen() {
  const [claims, setClaims] = useState<ClaimStatusDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const { token, username } = useAuthData();
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const signal = abortController.signal;

    const fetchClaims = async (signal: AbortSignal) => {
      try {
        setError(null);
        if (page === 1) {
          setClaims([]);
          setTotalPages(0);
          setLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        const response: ClaimStatusResponseDTO =
          await ApiService.getClaimStatus(token, page, 10, signal);

        // append on subsequent pages and sort to show approved-v3 first
        const sortedClaims = response.data.claims.sort((a, b) => {
          if (a.status === "approved-v3" && b.status !== "approved-v3") return -1;
          if (a.status !== "approved-v3" && b.status === "approved-v3") return 1;
          return 0;
        });
        setClaims((prev) =>
          page === 1 ? sortedClaims : [...prev, ...sortedClaims]
        );
        setTotalPages(response.data.pagination.totalPages);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setClaims([]);
          setTotalPages(0);
        }
      } finally {
        if (page === 1) {
          setLoading(false);
        } else {
          setIsLoadingMore(false);
        }
      }
    };

    if (token) {
      fetchClaims(signal);
    }
  }, [token, page]);

  // observe sentinel to auto-load next page
  useEffect(() => {
    if (!sentinelRef.current) return;
    // don't observe if already loading or no more pages
    if (!token || loading || isLoadingMore || page >= totalPages) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setPage((p) => {
            if (p < totalPages) return p + 1;
            return p;
          });
        }
      },
      { root: null, rootMargin: "200px", threshold: 0.1 }
    );

    observer.current.observe(sentinelRef.current);

    return () => {
      if (observer.current && sentinelRef.current) {
        observer.current.unobserve(sentinelRef.current);
      }
    };
  }, [token, loading, isLoadingMore, page, totalPages]);

  // Status icons for improved visibility
  const renderStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "submitted":
      case "onchain":
      case "created":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header title={"Cashback status"} isDrawerMenuRequired={false} />
        <div className="flex items-center justify-center h-screen pb-14 text-gray-400 bg-[#181A20]">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-400">Loading claims...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header title={"Cashback status"} isDrawerMenuRequired={false} />
        <div className="flex items-center justify-center h-screen pb-14 text-gray-400 bg-[#181A20]">
        <AlertCircle className="w-6 h-6 mr-2" />
        <span>{error}</span>
        </div>
      </div>
    );
  }

  if (claims.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <Header title={"Cashback status"} isDrawerMenuRequired={false} />
        <div className="flex items-center justify-center h-screen pb-14 text-gray-400 bg-[#181A20]">
          <AlertCircle className="w-6 h-6 mr-2" />
          <span>No claims found</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header title={"Cashback status"} isDrawerMenuRequired={false} />

      {/* Claims */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claims.map((claim) => (
            <ClaimCard
              key={claim._id}
              claim={claim}
              renderStatusIcon={renderStatusIcon}
              currentUser={username}
            />
          ))}
        </div>

        {/* Infinite scroll status area */}
        <div className="flex flex-col items-center mt-6">
          {/* bottom loader when fetching next page */}
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading more claims...</span>
            </div>
          )}
          {/* sentinel element observed by IntersectionObserver */}
          <div ref={sentinelRef} className="w-full h-1" />
        </div>
      </div>
    </div>
  );
}

export default ClaimStatusScreen;
