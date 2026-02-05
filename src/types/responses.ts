import { ResponseStatus } from './enums';

export interface ActionListDataResponse<T> {
  data?: T[];
  valid: boolean;
  errorMessage: string;
  status: ResponseStatus;
  isSuccess: boolean;
}

export interface ActionSingleDataResponse<T> {
  error?: string;
  data?: T;
  valid: boolean;
  errorMessage: string;
  status: ResponseStatus;
  isSuccess: boolean;
}

export function createActionListResponse<T>(
  json: any,
  fromJson: (item: any) => T
): ActionListDataResponse<T> {
  return {
    data: (json.data as any[])?.map((item) => fromJson(item)) || [],
    status: json.valid && !json.error ? ResponseStatus.success : ResponseStatus.failed,
    isSuccess: json.valid && !json.error && json.data != null,
    valid: json.valid as boolean,
    errorMessage: json.error as string,
  };
}

export function createActionSingleResponse<T>(
  json: any,
  fromJson?: (item: any) => T,
  parseFromList = false
): ActionSingleDataResponse<T> {
  return {
    data: fromJson == null
      ? json.data
      : parseFromList
      ? fromJson(json.data[0])
      : json.data == null
      ? null
      : fromJson(json.data),
    valid: json.valid as boolean,
    status: json.valid && !json.error ? ResponseStatus.success : ResponseStatus.failed,
    isSuccess: json.valid && !json.error,
    errorMessage: json.error as string,
  };
}

export interface Guide {
  name: string;
  percent: string;
  guidesPercent: string;
  value: string;
  _id: string;
}

export interface Onborder {
  name: string;
  percent: string;
  value: string;
}

export interface PendingCashback {
  _id: string;
  username: string;
  permlink: string;
  invoice: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  sentTrxn: string | null;
  ratingPercentageSentTrxn: string;
  initialPercentageSentTrxn: string;
  remainingPercentageTrxn: string | null;
  rejectionReason: string | null;
  amount: string;
  memo: string;
  timestamp: string;
  business: string;
  guides: Guide[];
  country: string;
  percentage: string;
  claimValue: string;
  transactionAmount: string;
  percentAsPerTransactionAmount: string;
  initialPercentageSent: number;
  ratingPercentageSent: number;
  totalPercentageSent: number;
  remainingPercentage: number;
  approvedByAdmin: boolean;
  approvedByAdminName: string | null;
  approvalDate: string | null;
  rejectedByAdmin: boolean;
  rejectedByAdminName: string | null;
  rejectionDate: string | null;
  approvalRejectionReason: string | null;
  onborder: Onborder;
  __v: number;
}

export interface PendingCashbacksResponse {
  success: boolean;
  data: PendingCashback[];
  count: number;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
  data: {
    remainingAmount: string;
    remainingPercentage: number;
    transactionId: string;
  };
}

export interface CashbackLog {
  _id: string;
  status: string;
  invoice: string;
  permlink: string;
  username: string;
  amount: string;
  business: string;
  claimValue: string;
  createdAt: string;
  updatedAt: string;
  sentTrxn: string | null;
  country: string;
  percentage: string;
  memo: string;
  timestamp: string;
  transactionAmount: string;
  percentAsPerTransactionAmount: string;
  approvalRejectionReason: string | null;
  rejectionDate: string | null;
  rejectedByAdminName: string | null;
  rejectedByAdmin: boolean;
  approvedByAdminName: string | null;
  approvedByAdmin: boolean;
  approvalDate: string | null;
  adminApprovalRating: number;
}

export interface CashbackLogsResponse {
  success: boolean;
  data: CashbackLog[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalClaims: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ReportedUser {
  _id: string;
  reporter: string;
  reportedUser: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportedReview {
  _id: string;
  reporter: string;
  author: string;
  permlink: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportedUsersResponse {
  success: boolean;
  data: ReportedUser[];
}

export interface ReportedReviewsResponse {
  success: boolean;
  data: ReportedReview[];
}
