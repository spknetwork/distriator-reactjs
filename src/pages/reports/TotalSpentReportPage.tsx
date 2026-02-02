/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import CommonLayout from "../../components/CommonLayout";
import {
  ReportChart,
  type ChartType,
} from "../../components/charts/ReportChart";
import { useTotalSpentStore } from "../../stores/totalSpentStore";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const TotalSpentReportPage = () => {
  const REPORT_KEY = "total-spent-report";
  const { viewState, data, totalAmount, fetch } = useTotalSpentStore();
  const [chartType, setChartType] = useState<ChartType>(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.type || "bar";
  });

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    saveReportSettings(REPORT_KEY, {
      table: true,
      type: chartType,
      range: "",
    });
  }, [chartType]);

  return (
    <CommonLayout title="Total Spend Report">
      <ReportChart
        title="Total Spend Report"
        data={data}
        viewState={viewState}
        chartType={chartType}
        disableAutoSort={true}
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

export default TotalSpentReportPage;
