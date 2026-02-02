// Use the POC project types
export interface UserClaimResponseDTO {
  claim?: UserClaimResponseClaimDTO;
  claims?: UserClaimResponseClaimDTO[];
  monthly: UserClaimResponseBiweeklyDTO[];
  biweekly: UserClaimResponseBiweeklyDTO[];
  businessDisplayName?: string;
  unverified_claims?: number;
}

export interface UserClaimResponseBiweeklyDTO {
  amount: string;
  memo: string;
  invoice: string;
  timestamp: Date;
  business: string;
  claimValue: string;
  permlink: string;
}

export interface UserClaimResponseClaimDTO {
  amount: string;
  memo: string;
  invoice: string;
  timestamp: Date;
  business: string;
  guides: UserClaimResponseOnborderDTO[];
  country: string;
  onborder: UserClaimResponseOnborderDTO;
  percentage: string;
  claimValue: string;
  transactionAmount: string;
  percentAsPerTransactionAmount: string;
}

export interface UserClaimResponseOnborderDTO {
  name: string;
  percent: string;
  guidesPercent?: string;
  value: string;
}

// Keep existing types for backward compatibility
export interface Guide {
  name: string;
  percent: string;
  guidesPercent: string;
  value: string;
}

export interface OnBorder {
  name: string;
  percent: string;
  value: string;
}

export interface ClaimModel {
  amount: string;
  memo?: string;
  invoice?: string;
  timestamp: string;
  business?: string;
  guides?: Guide[];
  country?: string;
  onborder?: OnBorder;
  percentage?: string;
  claimValue?: string;
  transactionAmount?: string;
  percentAsPerTransactionAmount?: string;
}

export function getWeeklyClaimsTotal(weeklyClaims: UserClaimResponseBiweeklyDTO[]): string {
  let total = 0;
  for (const claim of weeklyClaims) {
    total += parseFloat(claim.amount.split(" ")[0]);
  }
  return `$ ${total.toFixed(3)}`;
}

export function getMonthlyClaimsTotal(monthlyClaims: UserClaimResponseBiweeklyDTO[]): string {
  let total = 0;
  for (const claim of monthlyClaims) {
    total += parseFloat(claim.amount.split(" ")[0]);
  }
  return `$ ${total.toFixed(3)}`;
}