/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { type BusinessHistoryModel } from '../../types/business-history';
import { ViewState } from '../../types/enums';
import { format, parse } from "date-fns";

interface BusinessChartProps {
  history: BusinessHistoryModel[];
  viewState: ViewState;
  businessName: string;
}
function groupByMonth(history: BusinessHistoryModel[]) {
  const map = new Map<string, { amount: number; transactionCount: number }>();

  history.forEach(item => {
    const dateObj = item.date instanceof Date ? item.date : new Date(item.date as any);
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return;
    }

    const monthKey = format(dateObj, "MMM yyyy");
    if (!map.has(monthKey)) {
      map.set(monthKey, { amount: 0, transactionCount: 0 });
    }
    const entry = map.get(monthKey)!;
    entry.amount += item.amount;
    entry.transactionCount += item.transactionCount ?? 0;
  });

  return Array.from(map.entries()).map(([month, values]) => ({
    displayName: month,
    amount: values.amount,
    transactionCount: values.transactionCount,
  }));
}

export function BusinessChart({ history, viewState, businessName }: BusinessChartProps) {
  if (viewState === ViewState.LOADING) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (viewState === ViewState.ERROR) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load chart data</p>
      </div>
    );
  }

  if (viewState === ViewState.EMPTY || history.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data found</p>
      </div>
    );
  }

  // 👇 Group by month
  const monthlyData = groupByMonth(history);
  // Sort monthlyData by date in chronological order
  monthlyData.sort((a, b) => {
    const dateA = parse(a.displayName, "MMM yyyy", new Date());
    const dateB = parse(b.displayName, "MMM yyyy", new Date());
    return dateA.getTime() - dateB.getTime();
  });

  if (monthlyData.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No data found</p>
      </div>
    );
  }

  const maxAmount = Math.max(0, ...monthlyData.map(item => item.amount)) + 50;

  const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'hsl(var(--card))', 
          color: '#ffffff',           
          border: '1px solid #374151', 
          borderRadius: '8px',
          padding: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          minWidth: '150px',
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#3b82f6', marginBottom: '2px' }}>
          Amount: {data.amount.toFixed(2)} HBD
        </p>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Transactions: {data.transactionCount}
        </p>
      </div>
    );
  }
  return null;
};

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        {businessName}'s Revenue in Hive Dollar
      </h2>
      
      <div className="h-80 w-full bg-transparent">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={monthlyData} 
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            style={{ background: 'transparent' }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="displayName"
            />
            <YAxis
              domain={[0, maxAmount]}
              tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="amount" 
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}