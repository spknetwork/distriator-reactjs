import React from 'react';
import { GaugeComponent } from 'react-gauge-component';

interface DailyLimitData {
  currentUsage: number;
  maxLimit: number;
  remaining: number;
  date: string;
  percentage: number;
}

interface DailyLimitGaugeProps {
  data: DailyLimitData;
  isLoading?: boolean;
}

export const DailyLimitGauge: React.FC<DailyLimitGaugeProps> = ({ data, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-6">
        <div className="flex items-center space-x-3">
          <span className="loading loading-ring loading-md"></span>
          <span className="text-muted-foreground text-sm">Loading daily limit...</span>
        </div>
      </div>
    );
  }

  const isLimitReached = data.currentUsage >= data.maxLimit;
  const isNearLimit = data.percentage >= 80;

  return (
    <div className="w-full flex flex-col items-center justify-center space-y-4 p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg">
      <h3 className="text-lg font-semibold text-foreground">Daily Claim Limit (GLOBAL)</h3>
      
      <div className="relative">
        <GaugeComponent
          value={data.percentage}
          min={0}
          max={100}
          width={200}
          height={150}
          arc={{
            subArcs: [
              {
                limit: 50,
                color: '#10b981', // green
                showTick: true,
                tooltip: { text: 'Safe zone' }
              },
              {
                limit: 80,
                color: '#f59e0b', // yellow
                showTick: true,
                tooltip: { text: 'Warning zone' }
              },
              {
                limit: 100,
                color: '#ef4444', // red
                showTick: true,
                tooltip: { text: 'Limit reached' }
              }
            ]
          }}
          labels={{
            valueLabel: {
              formatTextValue: (value) => `${value.toFixed(1)}%`,
              style: {
                fontSize: '20px',
                fontWeight: 'bold',
                fill: isLimitReached ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981'
              }
            }
          }}
          needle={{
            color: isLimitReached ? '#ef4444' : isNearLimit ? '#f59e0b' : '#10b981',
            length: 0.8,
            width: 4
          }}
        />
      </div>

      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Used: {data.currentUsage}</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">Limit: {data.maxLimit}</span>
          </div>
        </div>
        
        <div className="text-lg font-semibold">
          <span className={isLimitReached ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-green-500'}>
            {data.remaining} remaining
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Date: {data.date}
        </div>
      </div>
    </div>
  );
};
