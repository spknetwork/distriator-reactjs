/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect, useRef } from "react";
import { useAioha } from "@aioha/react-ui";
import { useAuthData } from "../../utils/auth-utils";
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useMyActivityReportStore } from "../../stores/myActivityReportStore";
import { useInitDaysFetch, type DaysParam } from "../../utils/report-filters";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const MyActivityReport = () => {
  const REPORT_KEY = "my-activity-report";
  const { user } = useAioha();
  const { token } = useAuthData();
  const {
    viewState,
    chartData,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
  } = useMyActivityReportStore();

  const wrappedFetch = useCallback(
    (days: DaysParam) => fetchForDays(days, token || ""),
    [fetchForDays, token]
  );

  useInitDaysFetch(selectedFilter, wrappedFetch);
  const [showClaims, setShowClaims] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? true;
  });
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "bar";
  });

  // Load saved range when filters are available
  useEffect(() => {
    const saved = getReportSettings(REPORT_KEY);
    if (saved && saved.range) {
      const filter = filters.find((f) => f.label === saved.range);
      if (filter) applyFilter(filter, token || "");
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
      type: chartType,
      hbd: showClaims,
      range: selectedFilter.label,
    });
  }, [showClaims, chartType, selectedFilter.label]);

  if (!user) {
    return (
      <CommonLayout title="My Activity Report">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Please Login
            </h2>
            <p className="text-muted-foreground">
              You need to login to view your activity report
            </p>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout title="My Activity Report">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src={`https://images.hive.blog/u/${user}/avatar`}
              alt={`${user} avatar`}
              className="w-12 h-12 rounded-full"
            />
            <h2 className="text-2xl font-bold text-foreground">
              {user}'s Activity Report
            </h2>
          </div>
          <p className="text-muted-foreground">
            Your personal transaction history and activity patterns
          </p>
        </div>

        <ReportChart
          title="Personal Activity"
          data={chartData}
          viewState={viewState}
          chartType={chartType}
          filters={filters}
          selectedFilter={selectedFilter}
          onFilterChange={(filter) => applyFilter(filter, token || "")}
          primaryToggle={{
            onLabel: "Claims Received",
            offLabel: "Amount Spent",
            isOn: showClaims,
            onToggle: setShowClaims,
          }}
          secondaryToggle={{
            options: ["Line chart", "Bar chart"],
            value: chartType === "line" ? "Line chart" : "Bar chart",
            onChange: (value) =>
              setChartType(value === "Line chart" ? "line" : "bar"),
          }}
        />
      </div>
    </CommonLayout>
  );
};

export default MyActivityReport;
