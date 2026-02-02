/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as dhive from '@hiveio/dhive';
import { type AccountHistoryModel, createAccountHistoryModel, type PostDetailModel, createPostDetailModel } from '../types/account-history';
import { type ActionListDataResponse, createActionListResponse } from '../types/responses';
import { ResponseStatus } from '../types/enums';

export class DhiveService {
  private static client = new dhive.Client([
    'https://api.hive.blog',
    'https://api.hivekings.com',
    'https://anyx.io',
    'https://api.openhive.network'
  ]);

  // ---- Local cache for transfer history (newest -> oldest) ----
  private static readonly TRANSFER_CACHE_PREFIX = "DHIVE_TRANSFER_HISTORY_";
  private static readonly TRANSFER_CACHE_META_SUFFIX = "__META";
  private static readonly DEFAULT_PAGE_LIMIT = 1000;

  private static getTransferCacheKey(accountName: string): string {
    return `${this.TRANSFER_CACHE_PREFIX}${accountName}`;
  }

   // ------------------- Wallet Helpers -------------------
  private static async getWalletDataDetail(username: string): Promise<any> {
    try {
      const accounts = await this.client.database.getAccounts([username]);
      if (!accounts || accounts.length === 0)
        throw new Error("Account not found");
      return accounts[0];
    } catch (error) {
      console.error("Error in getWalletDataDetail:", error);
      return { error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  private static readCachedTransfers(accountName: string): { items: any[]; minOperationId: number; maxOperationId: number } {
    try {
      const key = this.getTransferCacheKey(accountName);
      const raw = localStorage.getItem(key);
      const rawMeta = localStorage.getItem(key + this.TRANSFER_CACHE_META_SUFFIX);
      if (!raw || !rawMeta) return { items: [], minOperationId: Number.POSITIVE_INFINITY, maxOperationId: Number.NEGATIVE_INFINITY };
      const items = JSON.parse(raw) as any[];
      const meta = JSON.parse(rawMeta) as { minOperationId: number; maxOperationId: number };
      return { items, minOperationId: meta.minOperationId, maxOperationId: meta.maxOperationId };
    } catch {
      return { items: [], minOperationId: Number.POSITIVE_INFINITY, maxOperationId: Number.NEGATIVE_INFINITY };
    }
  }

  private static writeCachedTransfers(accountName: string, items: any[]): void {
    try {
      // Ensure items are unique by id and sorted newest->oldest (descending id)
      const uniqueMap = new Map<number, any>();
      for (const item of items) {
        uniqueMap.set(item.id, item);
      }
      const merged = Array.from(uniqueMap.values()).sort((a, b) => b.id - a.id);
      const minOperationId = merged.length > 0 ? merged[merged.length - 1].id : Number.POSITIVE_INFINITY;
      const maxOperationId = merged.length > 0 ? merged[0].id : Number.NEGATIVE_INFINITY;

      const key = this.getTransferCacheKey(accountName);
      localStorage.setItem(key, JSON.stringify(merged));
      localStorage.setItem(key + this.TRANSFER_CACHE_META_SUFFIX, JSON.stringify({ minOperationId, maxOperationId }));
    } catch {
      // ignore storage errors
    }
  }

  private static clearTransferCache(accountName: string): void {
    try {
      const key = this.getTransferCacheKey(accountName);
      localStorage.removeItem(key);
      localStorage.removeItem(key + this.TRANSFER_CACHE_META_SUFFIX);
    } catch {
      // ignore storage errors
    }
  }

  private static checkDateDistribution(items: any[], targetDateMs: number): { coverage: number; gaps: string[] } {
    if (items.length === 0) return { coverage: 0, gaps: [] };
    
    const now = Date.now();
    const totalDays = Math.ceil((now - targetDateMs) / (1000 * 60 * 60 * 24));
    const daysWithData = new Set<number>();
    
    items.forEach(item => {
      const itemDate = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
      const daysSinceTarget = Math.ceil((itemDate.getTime() - targetDateMs) / (1000 * 60 * 60 * 24));
      if (daysSinceTarget >= 0 && daysSinceTarget <= totalDays) {
        daysWithData.add(daysSinceTarget);
      }
    });
    
    const coverage = (daysWithData.size / totalDays) * 100;
    const gaps: string[] = [];
    
    // Check for gaps larger than 7 days
    for (let i = 0; i < totalDays; i += 7) {
      let hasDataInWeek = false;
      for (let j = i; j < Math.min(i + 7, totalDays); j++) {
        if (daysWithData.has(j)) {
          hasDataInWeek = true;
          break;
        }
      }
      if (!hasDataInWeek) {
        const gapStart = new Date(targetDateMs + i * 24 * 60 * 60 * 1000);
        const gapEnd = new Date(targetDateMs + Math.min(i + 7, totalDays) * 24 * 60 * 60 * 1000);
        gaps.push(`${gapStart.toISOString().split('T')[0]} to ${gapEnd.toISOString().split('T')[0]}`);
      }
    }
    
    return { coverage, gaps };
  }

  private static mergeTransfers(existing: any[], incoming: any[]): any[] {
    const map = new Map<number, any>();
    for (const item of existing) map.set(item.id, item);
    for (const item of incoming) map.set(item.id, item);
    return Array.from(map.values()).sort((a, b) => b.id - a.id);
  }

  static async getAccountHistory(
  accountName: string,
  startId: number = -1,
  limit: number = 100
): Promise<ActionListDataResponse<AccountHistoryModel> & { metadata?: any }> {
  try {
    
    // Get all operations first, then filter in JavaScript
    const operationsBitmask = dhive.utils.makeBitMaskFilter([dhive.utils.operationOrders.transfer]) as [number, number];
    const operations = await this.client.database.getAccountHistory(
      accountName,
      startId,
      limit,
      operationsBitmask
    );

    if (!Array.isArray(operations)) {
      throw new Error('Invalid response from Hive API');
    }

    // Filter for transfer operations and convert to our model
    const historyItems = operations
      .filter((op: any) => op[1]?.op?.[0] === 'transfer')
      .map((op: any) => createAccountHistoryModel(op));


    // Get the actual range of operation IDs returned (not filtered)
    const operationIds = operations.map((op: any) => op[0]);
    const minId = operations.length > 0 ? Math.min(...operationIds) : startId;
    const maxId = operations.length > 0 ? Math.max(...operationIds) : startId;
    

    return {
      data: historyItems,
      status: ResponseStatus.success,
      isSuccess: true,
      valid: true,
      errorMessage: '',
      // Add metadata for pagination
      metadata: {
        totalRawOperations: operations.length,
        minOperationId: minId,
        maxOperationId: maxId,
        requestedStartId: startId,
        requestedLimit: limit
      }
    };
  } catch (error) {
    return {
      data: [],
      status: ResponseStatus.failed,
      isSuccess: false,
      valid: false,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

  /**
   * Validate that a Hive post exists for the provided URL.
   */
  static async checkHivePostExists(url: string): Promise<boolean> {
    try {
      // Normalize and extract the pathname
      const parsed = new URL(url);
      const path = parsed.pathname; // e.g. /hive-106130/@user/permlink or /@user/permlink

      // This regex covers:
      // - /@username/permlink
      // - /community/@username/permlink
      // - /hive-XXXXX/@username/permlink
      // - optional trailing slashes
      const match = path.match(/@([a-z0-9.\-]+)\/([a-z0-9.\-]+)/i);

      if (!match) {
        return false;
      }

      const author = match[1];
      const permlink = match[2];

      const post = await this.client.database.call('get_content', [author, permlink]);

      return Boolean(post && post.author && post.permlink);
    } catch (error) {
      console.error('DhiveService: Failed to verify Hive post', error);
      return false;
    }
  }

  /**
   * Return transfer operations for an account using cache-first, newest -> oldest.
   * Ensures at least requiredCount items are returned if available from the chain.
   */
  static async getTransferHistoryWithCache(
    accountName: string,
    requiredCount: number,
    signal?: AbortSignal
  ): Promise<AccountHistoryModel[]> {
    // 1) Read cache
    const cached = this.readCachedTransfers(accountName);
    let items = cached.items as AccountHistoryModel[];

    if (items.length >= requiredCount) {
      return items.slice(0, requiredCount);
    }

    // 2) Fetch more from chain until we hit requiredCount or no more data
    let startId = Number.isFinite(cached.minOperationId) ? cached.minOperationId - 1 : -1;
    let keepFetching = true;

    while (keepFetching && items.length < requiredCount) {
      if (signal?.aborted) break;
      const { data, metadata, isSuccess } = await this.getAccountHistory(
        accountName,
        startId,
        Math.min(this.DEFAULT_PAGE_LIMIT, requiredCount - items.length)
      );
      if (!isSuccess) break;

      // Keep only transfer ops (already filtered in getAccountHistory)
      const pageTransfers = data ?? [];
      if (pageTransfers.length === 0) {
        keepFetching = false;
        break;
      }

      // Merge and continue
      items = this.mergeTransfers(items, pageTransfers);
      this.writeCachedTransfers(accountName, items);

      const minOpId = metadata?.minOperationId ?? startId;
      startId = (minOpId || 0) - 1;

      // Stop if fewer raw operations than requested were returned
      const totalRaw = metadata?.totalRawOperations ?? pageTransfers.length;
      if (totalRaw === 0 || totalRaw < Math.min(this.DEFAULT_PAGE_LIMIT, requiredCount - items.length) || startId < 0) {
        keepFetching = false;
      }
    }

    return items.slice(0, requiredCount);
  }

  /**
   * Fetch transfer history until we cover entries newer than targetDate (inclusive).
   * Returns newest -> oldest items, cache-first, minimal extra network calls.
   */
  static async getTransferHistorySinceDateWithCache(
    accountName: string,
    targetDate: Date,
    signal?: AbortSignal
  ): Promise<AccountHistoryModel[]> {
    const cached = this.readCachedTransfers(accountName);
    // Start from cache and only fetch until we cross targetDate
    let items = (cached.items as AccountHistoryModel[]);

    // Quick return if cache oldest item is already at/before targetDate
    if (items.length > 0) {
      const oldestInCache = items.reduce((oldest, it) => {
        const tsIt = new Date(it.timestamp.endsWith('Z') ? it.timestamp : it.timestamp + 'Z');
        const tsOld = new Date(oldest.timestamp.endsWith('Z') ? oldest.timestamp : oldest.timestamp + 'Z');
        return tsIt < tsOld ? it : oldest;
      }, items[0]);
      const oldestTs = new Date(oldestInCache.timestamp.endsWith('Z') ? oldestInCache.timestamp : oldestInCache.timestamp + 'Z');
      if (oldestTs <= targetDate) {
        return items
          .filter(it => new Date(it.timestamp.endsWith('Z') ? it.timestamp : it.timestamp + 'Z') >= targetDate)
          .sort((a, b) => b.id - a.id);
      }
    }

    // Otherwise fetch older pages until we cross targetDate
    let startId = Number.isFinite(cached.minOperationId) ? cached.minOperationId - 1 : -1;
    const maxFetches = 20;
    let fetchCount = 0;

    while (fetchCount < maxFetches) {
      if (signal?.aborted) break;
      fetchCount++;
      const { data, metadata, isSuccess } = await this.getAccountHistory(
        accountName,
        startId,
        Math.min(this.DEFAULT_PAGE_LIMIT, 500)
      );
      if (!isSuccess) break;

      items = this.mergeTransfers(items, data ?? []);
      this.writeCachedTransfers(accountName, items);

      // Stop only when the oldest fetched item is at/before targetDate
      if (items.length > 0) {
        const oldest = items.reduce((o, it) => {
          const tsIt = new Date(it.timestamp.endsWith('Z') ? it.timestamp : it.timestamp + 'Z');
          const tsOld = new Date(o.timestamp.endsWith('Z') ? o.timestamp : o.timestamp + 'Z');
          return tsIt < tsOld ? it : o;
        }, items[0]);
        const oldestTs = new Date(oldest.timestamp.endsWith('Z') ? oldest.timestamp : oldest.timestamp + 'Z');
        if (oldestTs <= targetDate) {
          break;
        }
      }

      const minOpId = metadata?.minOperationId ?? startId;
      startId = (minOpId || 0) - 1;
      const totalRaw = metadata?.totalRawOperations ?? (data ?? []).length;
      if (totalRaw === 0 || startId < 0) {
        break;
      }
    }

    return items
      .filter(it => new Date(it.timestamp.endsWith('Z') ? it.timestamp : it.timestamp + 'Z') >= targetDate)
      .sort((a, b) => b.id - a.id);
  }

  /**
   * Simple method to fetch ALL transfer history without caching for debugging
   */
  static async getTransferHistoryDebug(
    accountName: string,
    targetDate: Date
  ): Promise<AccountHistoryModel[]> {
   
    const allTransfers: AccountHistoryModel[] = [];
    let startId = -1;
    let fetchCount = 0;
    const maxFetches = 100; // Very high limit for debugging
    
    while (fetchCount < maxFetches) {
      fetchCount++;
      
      const { data, metadata, isSuccess } = await this.getAccountHistory(accountName, startId, 1000);
      
      if (!isSuccess || !data || data.length === 0) {
        break;
      }
      
      // Filter for target date
      const filtered = data.filter(item => {
        const ts = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
        return ts >= targetDate;
      });
      
      allTransfers.push(...filtered);
      // Check if we have data older than target date
      const hasOlder = data.some(item => {
        const ts = new Date(item.timestamp.endsWith('Z') ? item.timestamp : item.timestamp + 'Z');
        return ts < targetDate;
      });
      
      if (hasOlder) {
        break;
      }
      
      const minOpId = metadata?.minOperationId ?? startId;
      startId = (minOpId || 0) - 1;
      
      if (startId < 0) {
        break;
      }
    }
    
    return allTransfers.sort((a, b) => b.id - a.id);
  }

  static async getAccountPosts(
    accountName: string,
    limit: number = 20,
    lastAuthor?: string,
    lastPermlink?: string
  ): Promise<ActionListDataResponse<PostDetailModel>> {
    try {
      const posts = await this.client.hivemind.getAccountPosts({
        account: accountName,
        sort: 'posts',
        start_author: lastAuthor || '',
        start_permlink: lastPermlink || '',
        limit: limit,
      });

      return createActionListResponse(
        {
          valid: true,
          error: '',
          data: posts,
        },
        createPostDetailModel
      );
    } catch (error) {
      return {
        data: [],
        status: ResponseStatus.failed,
        isSuccess: false,
        valid: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Filter transactions based on claim logic:
   * 1. Get account's last 100 transactions
   * 2. Filter outgoing to businesses
   * 3. Filter out transactions without invoice-ids
   * 4. Filter out transactions for which claim is already done
   * 5. Filter out transactions older than 2 hours
   */
  static async getClaimableTransactions(
    accountName: string,
    businessAccounts: string[],
    existingClaims: string[] = []
  ): Promise<AccountHistoryModel[]> {
    try {
      // Step 1: Get last 100 transactions
      const historyResponse = await this.getAccountHistory(accountName, -1, 100);
      
      if (!historyResponse.isSuccess || !historyResponse.data) {
        return [];
      }

      const transactions = historyResponse.data;
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

      return transactions.filter(tx => {
        // Only process transfer operations
        if (tx.op[0] !== 'transfer') return false;

        const operation = tx.op[1] as any;
        
        // Step 2: Filter outgoing to businesses
        if (operation.from !== accountName) return false;
        if (!businessAccounts.includes(operation.to)) return false;

        // Step 3: Filter out transactions without invoice-ids
        const memo = operation.memo || '';
        const hasInvoiceId = memo.includes('invoice-id') || memo.includes('invoice_id') || memo.includes('invoiceId');
        if (!hasInvoiceId) return false;

        // Step 4: Filter out transactions for which claim is already done
        const txId = tx.trx_id;
        if (existingClaims.includes(txId)) return false;

        // Step 5: Filter out transactions older than 2 hours
        const txTime = new Date(tx.timestamp);
        if (txTime < twoHoursAgo) return false;

        return true;
      });
    } catch (error) {
      console.error('Error filtering claimable transactions:', error);
      return [];
    }
  }

  /**
   * Extract invoice ID from transaction memo
   */
  static extractInvoiceId(memo: string): string | null {
    // Try different patterns for invoice ID
    const patterns = [
      /invoice[-_]?id[:\s]*([a-zA-Z0-9\-_]+)/i,
      /invoice[:\s]*([a-zA-Z0-9\-_]+)/i,
      /id[:\s]*([a-zA-Z0-9\-_]+)/i
    ];

    for (const pattern of patterns) {
      const match = memo.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Get transaction details for claim processing
   */
  static getTransactionDetails(transaction: AccountHistoryModel) {
    const operation = transaction.op[1] as any;
    return {
      txId: transaction.trx_id,
      from: operation.from,
      to: operation.to,
      amount: operation.amount,
      memo: operation.memo || '',
      timestamp: transaction.timestamp,
      invoiceId: this.extractInvoiceId(operation.memo || ''),
    };
  }

  static async getAccountHBDBalance(username: string): Promise<number | any> {
    const account = await this.getWalletDataDetail(username);
    if (account.error) return account;
    const hbdBalanceRaw = account.hbd_balance; // "10.123 HBD"
    const hbdBalance = parseFloat(hbdBalanceRaw.split(" ")[0]); // 10.123

    return hbdBalance;
  }
}