import { type ChartType } from "../components/charts/ReportChart";

export interface ReportSettings {
  table: boolean;
  type: ChartType;
  range: string;
  hbd?: boolean;
}

const STORAGE_KEY = "report-settings";

export const getReportSettings = (key: string): ReportSettings | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const allSettings = JSON.parse(stored);
    return allSettings[key] || null;
  } catch (error) {
    console.error("Error loading report settings:", error);
    return null;
  }
};

export const saveReportSettings = (
  key: string,
  settings: ReportSettings
): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const allSettings = stored ? JSON.parse(stored) : {};
    allSettings[key] = settings;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allSettings));
  } catch (error) {
    console.error("Error saving report settings:", error);
  }
};
