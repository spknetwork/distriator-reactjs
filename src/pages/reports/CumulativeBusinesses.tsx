/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from "react";
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useCumulativeBusinessesStore } from "../../stores/cumulativeBusinessesStore";
import { useInitDaysFetch } from "../../utils/report-filters";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const CumulativeBusinessesReport = () => {
  const REPORT_KEY = "cumulative-businesses";
  const {
    viewState,
    data,
    totalAmount,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
  } = useCumulativeBusinessesStore();
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "line";
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
      table: true,
      type: chartType,
      range: selectedFilter.label,
    });
  }, [chartType, selectedFilter.label]);

  const chartData = data ? [...data] : [];

  return (
    <CommonLayout title="Cumulative Businesses">
      <ReportChart
        title="Cumulative Businesses"
        data={chartData}
        viewState={viewState}
        chartType={chartType}
        disableAutoSort={true}
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={applyFilter}
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

export default CumulativeBusinessesReport;