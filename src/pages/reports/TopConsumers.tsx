/* eslint-disable @typescript-eslint/no-explicit-any */
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useState, useEffect, useRef } from "react";
import { useTopConsumersStore } from "../../stores/topConsumersStore";
import { useInitDaysFetch } from "../../utils/report-filters";
import { ViewState } from "../../types/enums";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const TopConsumersReport = () => {
  const REPORT_KEY = "top-consumers";
  const {
    viewState,
    data,
    totalAmount,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
  } = useTopConsumersStore();

  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "pie";
  });
  const [showTable, setShowTable] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.table ?? true;
  });
  const [isClaimsInHbd, setIsClaimsInHbd] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? true;
  });

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
      hbd: isClaimsInHbd,
      range: selectedFilter.label,
    });
  }, [showTable, chartType, isClaimsInHbd, selectedFilter.label]);

  const chartData = data ? [...data].sort((a, b) => a.total - b.total) : [];

  const handleCopyCsv = async () => {
    try {
      if (!data || data.length === 0) {
        toast.error("No data available to copy");
        return;
      }

      const header = [
        "Rank",
        "Username",
        isClaimsInHbd ? "Amount (HBD)" : "Claims",
      ];
      const rows = [...data]
        .sort((a, b) => (isClaimsInHbd ? b.total - a.total : b.count - a.count))
        .map((user, index) => [
          `#${index + 1}`,
          user.name,
          isClaimsInHbd ? user.total.toFixed(2) : user.count,
        ]);

      const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
      await navigator.clipboard.writeText(csv);

      toast.success("Data copied to clipboard");
    } catch (error) {
      console.error("Clipboard copy failed:", error);
      toast.error("Failed to copy data to clipboard");
    }
  };

  return (
    <CommonLayout title="Top Rewarded Consumers">
      <ReportChart
        title="Top Rewarded Consumers"
        data={chartData}
        viewState={viewState}
        chartType={chartType}
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={applyFilter}
        primaryToggle={{
          onLabel: "HBD",
          offLabel: "Claims",
          isOn: isClaimsInHbd,
          onToggle: setIsClaimsInHbd,
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
        <div className="text-center">No consumers found for this period.</div>
      )}

      {/* Table */}
      {showTable && viewState === ViewState.DATA && data.length > 0 && (
        <div className="p-4 sm:p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-800 mt-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-white text-center flex-1">
              Top Consumers Table
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
                      Username
                    </th>
                    <th className="text-right py-2 px-4 text-muted-foreground">
                      {isClaimsInHbd ? "Amount (HBD)" : "Claims"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data]
                    .sort((a, b) =>
                      isClaimsInHbd ? b.total - a.total : b.count - a.count
                    )
                    .map((user, index) => (
                      <tr key={user.name} className="border-b border-border/50">
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
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <img
                              src={`https://images.hive.blog/u/${user.name}/avatar`}
                              alt={`${user.name} avatar`}
                              className="w-8 h-8 rounded-full mr-3"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  "https://images.hive.blog/u/null/avatar";
                              }}
                            />
                            <span className="font-medium text-foreground">
                              @{user.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {isClaimsInHbd ? user.total.toFixed(2) : user.count}
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

export default TopConsumersReport;
