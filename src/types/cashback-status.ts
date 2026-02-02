export interface ClaimStatusDTO {
  _id: string;
  status: "created" | "submitted" | "approved" | "approved-v3" | "rejected";
  invoice: string;
  permlink: string;
  amount: string;
  business: string;
  claimValue: string;
  createdAt: string;
  updatedAt: string;
  sentTrxn: string;
  country: string;
  percentage: string;
  adminApprovalRating?: number;
  approvalRejectionReason?: string;
}

export interface ClaimStatusPaginationDTO {
  currentPage: number;
  totalPages: number;
  totalClaims: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface ClaimStatusResponseDTO {
  success: boolean;
  data: {
    claims: ClaimStatusDTO[];
    pagination: ClaimStatusPaginationDTO;
  };
  message: string;
}
