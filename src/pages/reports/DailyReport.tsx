/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useRef } from "react";
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useDailyClaimsStore } from "../../stores/dailyClaimsStore";
import { useInitDaysFetch } from "../../utils/report-filters";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const DailyReport = () => {
  const REPORT_KEY = "daily-report";
  const {
    viewState,
    data,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
    totalAmount,
  } = useDailyClaimsStore();
  const [isHbd, setIsHbd] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? false;
  });
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "bar";
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
      table: true, // DailyReport doesn't have table toggle, but interface requires it
      type: chartType,
      hbd: isHbd,
      range: selectedFilter.label,
    });
  }, [chartType, isHbd, selectedFilter.label]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const monthIdx: Record<string, number> = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
    const parseDate = (s: string): number => {
      // Try ISO first
      const iso = Date.parse(s);
      if (!Number.isNaN(iso)) return iso;
      // Try dd-MMM-yyyy (e.g., 25-Jan-2025)
      const m = s.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
      if (m) {
        const d = Number(m[1]);
        const mo = monthIdx[m[2] as keyof typeof monthIdx] ?? 0;
        const y = Number(m[3]);
        return new Date(y, mo, d).getTime();
      }
      return 0;
    };
    return [...data].sort((a, b) => parseDate(a.name) - parseDate(b.name));
  }, [data]);

  return (
    <CommonLayout title="Daily Report">
      <ReportChart
        title="Daily Cashbacks"
        data={chartData}
        viewState={viewState}
        chartType={chartType}
        disableAutoSort={true}
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={applyFilter}
        primaryToggle={{
          onLabel: "Claims in HBD",
          offLabel: "Number of Claims",
          isOn: isHbd,
          onToggle: setIsHbd,
        }}
        secondaryToggle={{
          options: ["Line chart", "Bar chart"],
          value: chartType === "line" ? "Line chart" : "Bar chart",
          onChange: (value) =>
            setChartType(value === "Line chart" ? "line" : "bar"),
        }}
        totalAmount={totalAmount}
      />
    </CommonLayout>
  );
};

export default DailyReport;
