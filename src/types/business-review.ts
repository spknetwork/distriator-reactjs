/* eslint-disable @typescript-eslint/no-explicit-any */
export const ReviewStatus = {
  VISIBLE: "visible",
  HIDDEN: "hidden",
} as const;

export type ReviewStatus =
  (typeof ReviewStatus)[keyof typeof ReviewStatus];

export interface BusinessReviewModel {
  id: string;
  username: string;
  permlink: string;
  photos: string[];
  reviewText: string;
  reviewBody?: string;
  created?: Date;
  invoiceId?: string;
  totalValue?: string;
  paidAmount?: string;
  cashbackAmount?: string;
  reviewStatus: ReviewStatus;
  modifiedAt?: Date;
}

export function createBusinessReviewModel(json: any): BusinessReviewModel {
  const safeCreateDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    if (typeof dateValue === 'string') {
      return new Date(dateValue.endsWith('Z') ? dateValue : dateValue + 'Z');
    }
    // Fallback for other types like number (timestamp) or Date object
    return new Date(dateValue);
  };

  const parseAmountsFromReviewBody = (reviewBody: string | undefined) => {
    if (!reviewBody) return { paidAmount: undefined, cashbackAmount: undefined };

    // Parse paid amount - look for "Paid Amount: X.XXX Hive Dollars"
    const paidAmountMatch = reviewBody.match(/Paid Amount:\s*([\d,]+\.?\d*)\s*(?:Hive Dollars|HBD)/i);
    const paidAmount = paidAmountMatch ? paidAmountMatch[1] : undefined;

    // Parse cashback amount - look for "Rewards Claimed: X.XXX Hive Dollars"
    const cashbackAmountMatch = reviewBody.match(/Rewards Claimed:\s*([\d,]+\.?\d*)\s*(?:Hive Dollars|HBD)/i);
    const cashbackAmount = cashbackAmountMatch ? cashbackAmountMatch[1] : undefined;

    return { paidAmount, cashbackAmount };
  };

  const { paidAmount, cashbackAmount } = parseAmountsFromReviewBody(json.reviewBody);

  return {
    id: json.id,
    username: json.username,
    permlink: json.permlink,
    photos: Array.isArray(json.photos) ? json.photos : [],
    reviewText: json.reviewText || '',
    reviewBody: json.reviewBody,
    created: safeCreateDate(json.created),
    invoiceId: json.invoiceId,
    totalValue: json.totalValue,
    paidAmount,
    cashbackAmount,
    reviewStatus: json.reviewStatus === 'hidden' ? ReviewStatus.HIDDEN : ReviewStatus.VISIBLE,
    modifiedAt: safeCreateDate(json.modifiedAt),
  };
}