/* eslint-disable @typescript-eslint/no-explicit-any */
export const RoleType = {
  ADMIN: "admin",
  SUPER: "super",
  GUIDE: "guide",
  USER: "user",
  OWNER: "owner",
} as const;

export type RoleType = (typeof RoleType)[keyof typeof RoleType];

export const RoleActionType = {
  ADD: "add",
  REMOVE: "remove",
  BAN: "ban",
  UNBAN: "unban",
} as const;

export type RoleActionType = (typeof RoleActionType)[keyof typeof RoleActionType];

export const GuideRoleActionType = {
  ADD: "add",
  REMOVE: "remove",
  UPDATE: "update",
} as const;

export type GuideRoleActionType =
  (typeof GuideRoleActionType)[keyof typeof GuideRoleActionType];


export interface RoleModel {
  username: string;
  banned: boolean;
  dailyLimit?: number;
  biWeeklyLimit?: number;
  city?: string;
  country?: string;
  type?: string;
  provider?: string;
  authType?: string;
  loginType?: string;
  profileImageUrl?: string;
}

export interface RoleActionModel {
  message: string;
}

export interface RoleNavigationModel {
  token: string;
  roleType: RoleType;
}

export function createRoleModel(json: any): RoleModel {
  return {
    username: json.username || '',
    banned: json.banned || false,
    dailyLimit: json.daily,
    biWeeklyLimit: json.biweekly,
    city: json.city,
    country: json.country,
    type: json.type,
    provider: json.provider,
    authType: json.authType,
    loginType: json.loginType,
    profileImageUrl: json.profileImageUrl,
  };
}

export function createRoleActionModel(json: any): RoleActionModel {
  return {
    message: json.message || '',
  };
}