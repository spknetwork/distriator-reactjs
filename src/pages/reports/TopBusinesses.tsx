/* eslint-disable @typescript-eslint/no-explicit-any */
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useState, useEffect, useRef } from "react";
import { useTopBusinessesStore } from "../../stores/topBusinessesStore";
import { useInitDaysFetch } from "../../utils/report-filters";
import { ViewState } from "../../types/enums";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useBusinesses } from "../../hooks/useBusinesses";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const TopBusinessesReport = () => {
  const REPORT_KEY = "top-businesses";
  const {
    viewState,
    data,
    totalAmount,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
  } = useTopBusinessesStore();

  const { businesses } = useBusinesses();
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "pie";
  });
  const [showTable, setShowTable] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.table ?? true;
  });
  const [isHbd, setIsHbd] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? true;
  });
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({});

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
      table: showTable,
      type: chartType,
      hbd: isHbd,
      range: selectedFilter.label,
    });
  }, [showTable, chartType, isHbd, selectedFilter.label]);

  const chartData = data ? [...data].sort((a, b) => a.total - b.total) : [];

  // ✅ Handle Copy CSV with Toast
  const handleCopyCsv = async () => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to copy");
        return;
      }

      const header = [
        "Rank",
        "Business Name",
        isHbd ? "Amount (HBD)" : "Claims",
      ];
      const rows = [...data]
        .sort((a, b) => (isHbd ? b.total - a.total : b.count - a.count))
        .map((business, index) => [
          `#${index + 1}`,
          business.name,
          isHbd ? business.total.toFixed(2) : business.count,
        ]);

      const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
      await navigator.clipboard.writeText(csv);

      toast.success("✅ Data copied to clipboard");
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error("❌ Failed to copy data to clipboard");
    }
  };

  // ✅ Helper to render avatar with fallback (joined from businesses list)
  const renderAvatar = (businessName: string) => {
    const biz = businesses.find((b) => b.profile.displayName === businessName);

    const imgSrc = biz?.profile?.displayImage;
    const displayName = biz?.profile?.displayName || businessName;
    const hasError = imgErrorMap[businessName];

    if (imgSrc && !hasError) {
      return (
        <img
          src={imgSrc}
          alt={displayName}
          className="w-10 h-10 rounded-md object-cover border-2 border-gray-700"
          onError={() =>
            setImgErrorMap((prev) => ({ ...prev, [businessName]: true }))
          }
        />
      );
    }

    return (
      <div className="w-10 h-10 rounded-md bg-gray-600 flex items-center justify-center text-white text-lg">
        {displayName?.substring(0, 1)?.toUpperCase() || "?"}
      </div>
    );
  };

  return (
    <CommonLayout title="Top Businesses">
      <ReportChart
        title="Top Businesses"
        data={chartData}
        viewState={viewState}
        chartType={chartType}
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={applyFilter}
        primaryToggle={{
          onLabel: "HBD",
          offLabel: "Claims",
          isOn: isHbd,
          onToggle: setIsHbd,
        }}
        secondaryToggle={{
          options: ["Pie", "Bar", "Line"],
          value: chartType.charAt(0).toUpperCase() + chartType.slice(1),
          onChange: (value: string) =>
            setChartType(value.toLowerCase() as ChartType),
        }}
        tableToggle={{
          isOn: showTable,
          onToggle: setShowTable,
        }}
        totalAmount={totalAmount}
      />

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
        <div className="text-center">No businesses found for this period.</div>
      )}

      {/* Top Businesses Table */}
      {showTable && viewState === ViewState.DATA && data.length > 0 && (
        <div className="p-4 sm:p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-800 mt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white text-center flex-1">
              Top Businesses Table
            </h2>

            {/* Copy CSV */}
            <button
              onClick={handleCopyCsv}
              className="flex items-center text-white"
              title="Copy Table CSV"
            >
              <Copy className="w-6 h-6" />
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-4 text-muted-foreground">
                      Rank
                    </th>
                    <th className="text-left py-2 px-4 text-muted-foreground">
                      Business
                    </th>
                    <th className="text-right py-2 px-4 text-muted-foreground">
                      {isHbd ? "Amount (HBD)" : "Claims"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data]
                    .sort((a, b) =>
                      isHbd ? b.total - a.total : b.count - a.count
                    )
                    .map((business, index) => (
                      <tr
                        key={business.name}
                        className="border-b border-border/50 hover:bg-gray-800 transition"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span
                              className={`font-bold ${
                                index === 0
                                  ? "text-yellow-500"
                                  : index === 1
                                  ? "text-gray-400"
                                  : index === 2
                                  ? "text-amber-600"
                                  : "text-foreground"
                              }`}
                            >
                              #{index + 1}
                            </span>
                            {index < 3 && (
                              <span className="ml-2">
                                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* ✅ Avatar + Business name */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {renderAvatar(business.name)}
                            <span className="font-medium text-foreground">
                              {business.name}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {isHbd ? business.total.toFixed(2) : business.count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </CommonLayout>
  );
};

export default TopBusinessesReport;
