import React from "react";
import { GaugeComponent } from "react-gauge-component";
import type { BusinessLimitsData } from "../types/business-limits";

interface BiWeeklyGaugeProps {
  data: BusinessLimitsData | null;
  isLoading?: boolean;
}

export const BiWeeklyGauge: React.FC<BiWeeklyGaugeProps> = ({
  data,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <span className="loading loading-ring loading-md"></span>
          <span className="text-muted-foreground text-sm">
            Loading biweekly limits...
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <div className="text-center">
          <span className="text-muted-foreground text-sm">
            No limit data available
          </span>
        </div>
      </div>
    );
  }

  // Render gauge similar to DailyLimitGauge
  try {
    const usage = data.usage;
    const normalizedTimeRange = (data.timeRange || "").toLowerCase();
    const isSecondHalf =
      normalizedTimeRange === "secondhalf" ||
      normalizedTimeRange === "second_half" ||
      normalizedTimeRange === "second" ||
      normalizedTimeRange === "second half";
    const currentUsage = isSecondHalf ? usage.secondHalf : usage.firstHalf;

    const limit =
      typeof currentUsage?.limit === "number" && currentUsage.limit > 0
        ? currentUsage.limit
        : data.limits.maxCashbacks || 0;
    const count =
      typeof currentUsage?.count === "number" ? currentUsage.count : 0;

    const percentage = limit > 0 ? (count / limit) * 100 : 0;
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    const isLimitReached = count >= limit && limit > 0;
    const isNearLimit = clampedPercentage >= 80 && !isLimitReached;

    return (
      <div className="w-full flex flex-col items-center justify-center space-y-4 p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg">
        <h3 className="text-lg font-semibold text-foreground">
          Biweekly Cashback Power
        </h3>

        <div className="relative">
          <GaugeComponent
            value={clampedPercentage}
            min={0}
            max={100}
            width={200}
            height={150}
            arc={{
              subArcs: [
                {
                  limit: 50,
                  color: "#10b981",
                  showTick: true,
                  tooltip: { text: "Safe zone" },
                },
                {
                  limit: 80,
                  color: "#f59e0b",
                  showTick: true,
                  tooltip: { text: "Warning zone" },
                },
                {
                  limit: 100,
                  color: "#ef4444",
                  showTick: true,
                  tooltip: { text: "Limit reached" },
                },
              ],
            }}
            labels={{
              valueLabel: {
                formatTextValue: (value) => `${Number(value).toFixed(1)}%`,
                style: {
                  fontSize: "20px",
                  fontWeight: "bold",
                  fill: isLimitReached
                    ? "#ef4444"
                    : isNearLimit
                    ? "#f59e0b"
                    : "#10b981",
                },
              },
              tickLabels: {
                type: "outer",
                ticks: [
                  { value: 0 },
                  { value: 50 },
                  { value: 80 },
                  { value: 100 },
                ],
                defaultTickValueConfig: {
                  formatTextValue: (value) => `${value}`,
                },
              },
            }}
            needle={{
              color: isLimitReached
                ? "#ef4444"
                : isNearLimit
                ? "#f59e0b"
                : "#10b981",
              length: 0.8,
              width: 4,
            }}
          />
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-muted-foreground"> Cashback Power : {limit}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Hive Power: {data.limits.hivePower.toLocaleString()}
          </div>

          {!data.limits.canOfferMore && (
            <div className="text-xs text-red-500 font-semibold">
              ⚠️ Business limit reached
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("BiWeeklyGauge error:", error);
    return (
      <div className="w-full flex items-center justify-center py-6">
        <div className="text-center">
          <div className="text-red-500 text-sm mb-2">
            Error loading gauge data
          </div>
          <div className="text-xs text-muted-foreground">
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      </div>
    );
  }
};
