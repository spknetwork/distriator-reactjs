/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";
import { type UserGraphModel } from "../../types/claim-reports";
import { ArrowLeft, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { ViewState } from "../../types/enums";
import { toast } from "sonner";

export type ChartType = "bar" | "line" | "pie";

interface ReportChartProps {
  data: UserGraphModel[];
  title: string;
  viewState: ViewState;
  chartType: ChartType;
  filters?: { label: string; targetDate: () => Date }[];
  selectedFilter?: { label: string; targetDate: () => Date };
  onFilterChange?: (filter: any) => void;
  primaryToggle?: {
    onLabel: string;
    offLabel: string;
    isOn: boolean;
    onToggle: (isOn: boolean) => void;
  };
  secondaryToggle?:
    | {
        onLabel: string;
        offLabel: string;
        isOn: boolean;
        onToggle: (isOn: boolean) => void;
      }
    | {
        options: string[];
        value: string;
        onChange: (value: string) => void;
      };
  tableToggle?: {
    isOn: boolean;
    onToggle: (isOn: boolean) => void;
  };
  disableAutoSort?: boolean; // when true, preserve incoming data order
  totalAmount?: string;
}
const COLORS = ["#4F46E5", "#06B6D4", "#F59E0B", "#EF4444", "#10B981"];

const isLikelyHiveUsername = (value: string): boolean => {
  if (!value) return false;
  const s = String(value);
  // Exclude common date formats first
  // ISO-like yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  // dd-MMM-yyyy (e.g., 25-Jan-2025)
  if (/^\d{1,2}-[A-Za-z]{3}-\d{4}$/.test(s)) return false;
  // dd/MM/yy
  if (/^\d{1,2}\/\d{1,2}\/\d{2}$/.test(s)) return false;
  // Heuristic for Hive usernames: start with a letter, 3-16 chars, lowercase letters, digits, single dashes allowed, must end alnum
  if (!/^[a-z][a-z0-9-]{1,14}[a-z0-9]$/.test(s)) return false;
  // Disallow consecutive dashes
  if (s.includes("--")) return false;
  return true;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/90 border border-gray-700 rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 mb-1">
          {isLikelyHiveUsername(label) && (
            <img
              src={`https://images.hive.blog/u/${label}/avatar`}
              alt={`${label} avatar`}
              className="w-6 h-6 rounded-full"
            />
          )}
          <p className="text-sm font-semibold text-white">{label}</p>
        </div>
        {payload.map((p: any, index: number) => (
          <p key={index} className="text-xs text-gray-300">{`${
            p.name
          }: ${Number(p.value).toFixed(2)}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const ReportChart = ({
  data,
  title,
  viewState,
  chartType,
  filters,
  selectedFilter,
  onFilterChange,
  primaryToggle,
  secondaryToggle,
  tableToggle,
  disableAutoSort,
  totalAmount,
}: ReportChartProps) => {
  const navigate = useNavigate();
  const dataKey = primaryToggle
    ? primaryToggle.isOn
      ? "total"
      : "count"
    : "total";
  const primaryLabel = primaryToggle
    ? primaryToggle.isOn
      ? primaryToggle.onLabel
      : primaryToggle.offLabel
    : "Cumulative Total";

  // Ensure ascending order in charts:
  // - bar: by metric value ascending (min left -> max right)
  // - line: attempt chronological by name parsing; fallback to lexical
  const sortedData = useMemo(() => {
    if (disableAutoSort) {
      return [...data];
    }
    const cloned = [...data];
    if (chartType === "bar") {
      return cloned.sort((a, b) => {
        const av = (a as any)[dataKey] ?? 0;
        const bv = (b as any)[dataKey] ?? 0;
        return av - bv;
      });
    }
    if (chartType === "line") {
      const parseDate = (s: string) => {
        // Try ISO first
        const iso = Date.parse(s);
        if (!Number.isNaN(iso)) return iso;
        // Try dd/MM/yy
        const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (m) {
          const d = Number(m[1]);
          const mo = Number(m[2]) - 1;
          const y = 2000 + Number(m[3]);
          return new Date(y, mo, d).getTime();
        }
        // Last resort lexical
        return s as unknown as number;
      };
      return cloned.sort((a, b) => parseDate(a.name) - parseDate(b.name));
    }
    return cloned;
  }, [data, chartType, dataKey]);

  const handleCopyCsv = async () => {
    try {
      const headers = ["name", "total", "count"];
      const rows = sortedData.map((row) => [row.name, row.total, row.count]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
        "\n"
      );
      await navigator.clipboard.writeText(csv);
      toast.success("Data copied to clipboard");
    } catch {
      toast.error("Failed to copy data to clipboard");
    }
  };
  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <BarChart data={sortedData as any}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: "#D1D5DB" }} />
            <YAxis tick={{ fill: "#D1D5DB" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#E5E7EB" }} />
            <Bar
              dataKey={dataKey}
              fill="url(#barGradient)"
              radius={[6, 6, 0, 0]}
              name={primaryLabel}
            />
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.7} />
              </linearGradient>
            </defs>
          </BarChart>
        );

      case "line":
        return (
          <LineChart data={sortedData as any}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" tick={{ fill: "#D1D5DB" }} />
            <YAxis tick={{ fill: "#D1D5DB" }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: "#E5E7EB" }} />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#06B6D4"
              strokeWidth={3}
              dot={{ fill: "#06B6D4", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              name={primaryLabel}
            />
          </LineChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={sortedData as any}
              dataKey={dataKey}
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={145}
              paddingAngle={1}
              labelLine={false}
              label={false}
            >
              {sortedData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {/* <Legend
              layout={isMobile ? "horizontal" : "vertical"}
              align={isMobile ? "center" : "right"}
              verticalAlign={isMobile ? "bottom" : "middle"}
              wrapperStyle={isMobile ? { paddingTop: 10 } : {}}
              formatter={(value) => {
                const item = data.find((d) => d.name === value);
                const totalValue = primaryToggle.isOn
                  ? item?.total
                  : item?.count;
                return `${value} (${totalValue?.toFixed(2)})`;
              }}
            /> */}
          </PieChart>
        );

      default:
        // Return an empty fragment to satisfy ReactElement requirement
        return <></>;
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
      {/* Header Row */}
      <div className="flex items-center justify-between mb-4">
        {/* Left side: Back Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/reports/distriator")}
            className="flex items-center text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Title (centered) */}
        <h2 className="text-lg sm:text-xl font-bold text-white text-center flex-1">
          {title}
        </h2>

        {/* Copy button */}
        <button
          onClick={handleCopyCsv}
          className="flex items-center text-white"
        >
          <Copy className="w-6 h-6" />
        </button>
      </div>

      {/* Filters + Toggles */}
      <div className="flex flex-wrap gap-3 items-center justify-end mb-4">
        {filters && onFilterChange && selectedFilter && (
          <select
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1 text-sm"
            value={selectedFilter.label}
            onChange={(e) =>
              onFilterChange(filters.find((f) => f.label === e.target.value))
            }
          >
            {filters.map((f) => (
              <option key={f.label} value={f.label}>
                {f.label}
              </option>
            ))}
          </select>
        )}

        {/* Primary Dropdown */}
        {primaryToggle && (
          <select
            className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1 text-sm"
            value={
              primaryToggle.isOn
                ? primaryToggle.onLabel
                : primaryToggle.offLabel
            }
            onChange={(e) =>
              primaryToggle.onToggle(e.target.value === primaryToggle.onLabel)
            }
          >
            <option value={primaryToggle.offLabel}>
              {primaryToggle.offLabel}
            </option>
            <option value={primaryToggle.onLabel}>
              {primaryToggle.onLabel}
            </option>
          </select>
        )}

        {/* Secondary Dropdown (if exists) */}
        {secondaryToggle &&
          ("options" in secondaryToggle ? (
            <select
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1 text-sm"
              value={secondaryToggle.value}
              onChange={(e) => secondaryToggle.onChange(e.target.value)}
            >
              {secondaryToggle.options.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="bg-gray-800 border border-gray-700 text-gray-200 rounded-lg px-3 py-1 text-sm"
              value={
                secondaryToggle.isOn
                  ? secondaryToggle.onLabel
                  : secondaryToggle.offLabel
              }
              onChange={(e) =>
                secondaryToggle.onToggle(
                  e.target.value === secondaryToggle.onLabel
                )
              }
            >
              <option value={secondaryToggle.offLabel}>
                {secondaryToggle.offLabel}
              </option>
              <option value={secondaryToggle.onLabel}>
                {secondaryToggle.onLabel}
              </option>
            </select>
          ))}

        {/* Table Toggle */}
        {tableToggle && (
          <label className="flex items-center gap-2 text-white cursor-pointer">
            <input
              type="checkbox"
              checked={tableToggle.isOn}
              onChange={(e) => tableToggle.onToggle(e.target.checked)}
              className="rounded border-gray-600 bg-gray-800 text-primary focus:ring-primary"
            />
            <span className="text-sm">Show Table</span>
          </label>
        )}
      </div>

      {/* Total Amount */}
      {totalAmount && (
        <div className="mb-4 text-center">
          <span className="text-white font-semibold text-lg">
            Total: {totalAmount}
          </span>
        </div>
      )}

      {/* Chart */}
      <div
        style={{ width: "100%", height: window.innerWidth < 640 ? 300 : 500 }}
      >
        {viewState === ViewState.LOADING && (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        )}
        {viewState === ViewState.ERROR && (
          <div className="text-center text-red-500">Failed to load data.</div>
        )}
        {viewState === ViewState.EMPTY && (
          <div className="text-center text-gray-400">
            No data available for this period.
          </div>
        )}
        {viewState === ViewState.DATA && (
          <div className="flex-1 w-full" style={{ height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};
