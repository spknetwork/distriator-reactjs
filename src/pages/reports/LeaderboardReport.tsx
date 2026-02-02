import { useState, useEffect, useRef } from "react";
import CommonLayout from "../../components/CommonLayout";
import { ReportChart } from "../../components/charts/ReportChart";
import { useLeaderboardStore } from "../../stores/leaderboardStore";
import { ViewState } from "../../types/enums";
import type { UserGraphModel } from "../../types/claim-reports";
import {
  getReportSettings,
  saveReportSettings,
} from "../../utils/report-settings";

const LeaderboardReport = () => {
  const REPORT_KEY = "leaderboard-report";
  const {
    viewState,
    data,
    totalAmount,
    filters,
    selectedFilter,
    applyFilter,
    fetchForMonth,
  } = useLeaderboardStore();
  const [isHbd, setIsHbd] = useState(() => {
    const saved = getReportSettings(REPORT_KEY);
    return saved?.hbd ?? true;
  });

  // initial load
  useState(() => {
    void fetchForMonth(selectedFilter.monthParam);
  });

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
      type: "bar",
      hbd: isHbd,
      range: selectedFilter.label,
    });
  }, [isHbd, selectedFilter.label]);

  return (
    <CommonLayout title={`Leaderboard - ${selectedFilter.label}`}>
      <div className="space-y-6">
        <ReportChart
          title="Monthly Leaderboard"
          // headerRightText={`Total: ${totalAmount.toFixed(3)} HBD`}
          data={
            [...data].sort((a, b) =>
              isHbd ? a.total - b.total : a.count - b.count
            ) as unknown as UserGraphModel[]
          }
          viewState={viewState}
          chartType="bar"
          filters={filters.map((f) => ({
            label: f.label,
            targetDate: () => new Date(),
          }))}
          selectedFilter={{
            label: selectedFilter.label,
            targetDate: () => new Date(),
          }}
          onFilterChange={(f) => {
            const found = filters.find((x) => x.label === f.label);
            if (found) applyFilter(found);
          }}
          primaryToggle={{
            onLabel: "Claims in HBD",
            offLabel: "Number of Claims",
            isOn: isHbd,
            onToggle: setIsHbd,
          }}
          totalAmount={totalAmount}
        />

        {/* Leaderboard Table */}
        {viewState === ViewState.DATA && data.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              Top 10 Rankings
            </h3>
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
                      {isHbd ? "Amount (HBD)" : "Claims"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...data]
                    .sort((a, b) =>
                      isHbd ? b.total - a.total : b.count - a.count
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
                                (
                                  e.currentTarget as HTMLImageElement
                                ).src = `https://images.hive.blog/u/null/avatar`;
                              }}
                            />
                            <span className="font-medium text-foreground">
                              @{user.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-primary">
                          {isHbd ? user.total.toFixed(2) : user.count}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </CommonLayout>
  );
};

export default LeaderboardReport;
