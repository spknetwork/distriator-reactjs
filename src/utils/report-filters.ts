import { useEffect } from 'react';

export type DaysParam = 'lastWeek' | 'last2Weeks' | 'lastMonth' | 'last3Months' | 'last6Months';

export const mapFilterLabelToDays = (label: string): DaysParam => {
  switch (label) {
    case 'Last Week':
      return 'lastWeek';
    case 'Last 2 Weeks':
      return 'last2Weeks';
    case 'Last Month':
      return 'lastMonth';
    case 'Last 3 Months':
      return 'last3Months';
    case 'Last 6 Months':
      return 'last6Months';
    default:
      return 'lastWeek';
  }
};

export const useInitDaysFetch = (
  selectedFilter: { label: string } | undefined,
  fetchForDays: (days: DaysParam) => Promise<void>
) => {
  useEffect(() => {
    const daysMap: Record<string, DaysParam> = {
      'Last Week': 'lastWeek',
      'Last 2 Weeks': 'last2Weeks',
      'Last Month': 'lastMonth',
      'Last 3 Months': 'last3Months',
      'Last 6 Months': 'last6Months',
    };
    const key = selectedFilter?.label || 'Last Week';
    void fetchForDays(daysMap[key] || 'lastWeek');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};


