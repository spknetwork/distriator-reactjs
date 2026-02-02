export interface BusinessHistoryModel {
  id: string;
  date: Date;
  amount: number;
  transactionCount: number;
  displayName: string;
}

export function createBusinessHistoryModel(json: any): BusinessHistoryModel {
  const safeCreateDate = (value: any): Date => {
    if (!value) return new Date(NaN);
    if (value instanceof Date) return value;
    if (typeof value === 'number') return new Date(value);
    if (typeof value === 'string') {
      // Accept ISO-like strings, ensure they parse consistently
      // Many environments parse '2023-10-03T18:43:21.000Z' fine
      // If milliseconds-only string without Z, still attempt parse
      return new Date(value);
    }
    return new Date(NaN);
  };

  const rawDate = json.date ?? json.timestamp ?? json.trxnTs;
  const parsedDate = safeCreateDate(rawDate);

  const amountNum = (() => {
    const v = json.amount ?? json.spendingAmount ?? 0;
    if (typeof v === 'string') return parseFloat(v.replace(/,/g, '')) || 0;
    return Number(v) || 0;
  })();

  const txnCount = (() => {
    const v = json.transactionCount ?? json.txnCount ?? 0;
    if (typeof v === 'string') return parseInt(v);
    return Number(v) || 0;
  })();

  const display = json.displayName ?? json.businessName ?? '';
  const stableId = json.id ?? `${rawDate ?? ''}-${display}`;

  return {
    id: String(stableId),
    date: parsedDate,
    amount: amountNum,
    transactionCount: txnCount,
    displayName: String(display),
  };
}
