export interface BusinessLimitsData {
  businessId: string;
  timeRange: string;
  limits: {
    maxCashbacks: number;
    currentCount: number;
    remaining: number;
    canOfferMore: boolean;
    hivePower: number;
  };
  usage: {
    firstHalf: {
      count: number;
      limit: number;
      remaining: number;
    };
    secondHalf: {
      count: number;
      limit: number;
      remaining: number;
    };
  };
}

export interface ClaimLimitInfo {
  businessLimit: {
    canOffer: boolean;
    currentCount: number;
    limit: number;
    hivePower: number;
    reason: string;
  };
  userLimit: {
    canClaim: boolean;
    currentCount: number;
    limit: number;
    hivePower: number;
  };
  reason: string;
}
