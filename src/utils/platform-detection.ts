import { Capacitor } from "@capacitor/core";

/**
 * Detects if the app is running on a mobile platform
 * Returns true for iOS and Android, false for web
 */
export const isMobilePlatform = (): boolean => {
  const platform = Capacitor.getPlatform();
  return platform === "ios" || platform === "android";
};

/**
 * Gets the current platform
 */
export const getPlatform = (): string => {
  return Capacitor.getPlatform();
};
