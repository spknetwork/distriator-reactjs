/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useState, useEffect, useRef } from "react";
import CommonLayout from "../../components/CommonLayout";
import { ReportChart } from "../../components/charts/ReportChart";
import { useClaimsByCountryStore } from "../../stores/claimsByCountryStore";
import { useInitDaysFetch } from "../../utils/report-filters";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const CountryReport = () => {
  const REPORT_KEY = "country-report";
  const {
    viewState,
    data,
    filters,
    selectedFilter,
    applyFilter,
    fetchForDays,
    totalAmount,
  } = useClaimsByCountryStore();
  const [isHbd, setIsHbd] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? false;
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
      type: "pie",
      hbd: isHbd,
      range: selectedFilter.label,
    });
  }, [isHbd, selectedFilter.label]);

  return (
    <CommonLayout title="Total Claims by Countries">
      <ReportChart
        title="Claims by Country"
        data={useMemo(() => [...data], [data])}
        viewState={viewState}
        chartType={"pie"}
        filters={filters}
        selectedFilter={selectedFilter}
        onFilterChange={applyFilter}
        primaryToggle={{
          onLabel: "Claims in HBD",
          offLabel: "Number of Claims",
          isOn: isHbd,
          onToggle: setIsHbd,
        }}
        totalAmount={totalAmount}
      />
    </CommonLayout>
  );
};

export default CountryReport;
