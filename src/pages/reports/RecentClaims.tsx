/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import CommonLayout from "../../components/CommonLayout";
import { useRecentClaimsStore } from "../../stores/recentClaimsStore";
import { TransferHistoryItem } from "../../components/reports/TransferHistoryItem";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ViewState } from "../../types/enums";
import { useInitDaysFetch } from "../../utils/report-filters";
import { useBusinesses } from "../../hooks/useBusinesses";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const RecentClaimsReport = () => {
  const REPORT_KEY = "recent-claims";
  const {
    viewState,
    items,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
    totalAmount,
  } = useRecentClaimsStore();
  const navigate = useNavigate();
  const { businesses } = useBusinesses();

  useInitDaysFetch(selectedFilter, fetchForDays as any);

  // Load saved range when filters are available
  useEffect(() => {
    const saved = getReportSettings(REPORT_KEY);
    if (saved && saved.range) {
      const filter = filters.find((f) => f.label === saved.range);
      if (filter) applyFilter(filter);
    }
  }, [filters]);

  // Save settings on change (skip first render to avoid overwriting saved range)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveReportSettings(REPORT_KEY, {
      table: true,
      type: "bar", // default
      range: selectedFilter.label,
    });
  }, [selectedFilter.label]);
  return (
    <CommonLayout title="Recent Claim Records">
      {/* Header Row */}
      <div className="mb-4 flex items-center justify-between gap-2">
        {/* Left side: Total Amount and Back Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/reports/distriator")}
            className="flex items-center text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <span className="text-white font-semibold">
            Total: {totalAmount} HBD
          </span>
        </div>

        {/* Filter Dropdown (right) */}
        <select
          className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1 text-sm"
          value={selectedFilter.label}
          onChange={(e) => {
            const filter = filters.find((f) => f.label === e.target.value);
            if (filter) applyFilter(filter);
          }}
        >
          {filters.map((f) => (
            <option key={f.label} value={f.label}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      {/* States */}
      {viewState === ViewState.LOADING && (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      )}
      {viewState === ViewState.ERROR && (
        <div className="text-center text-red-500">Failed to load data.</div>
      )}
      {viewState === ViewState.EMPTY && (
        <div className="text-center">No claims found for this period.</div>
      )}

      {viewState === ViewState.DATA && (
        <div className="bg-gray-900 rounded-lg">
          {items.map((item) => (
            <TransferHistoryItem
              key={item.id}
              item={item}
              businesses={businesses}
            />
          ))}
        </div>
      )}
    </CommonLayout>
  );
};

export default RecentClaimsReport;
