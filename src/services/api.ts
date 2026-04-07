const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import type { ClaimStatusResponseDTO } from '../types/cashback-status';
import type { BusinessLimitsData } from '../types/business-limits';
import type { PendingCashbacksResponse, ApproveRejectResponse, CashbackLogsResponse } from '../types/responses';
import { handleTokenExpiration } from '../utils/auth-utils';
import { ViewState } from '../types/enums';

export class ApiService {
  static async getPendingCashbacks(
    token: string,
    signal?: AbortSignal
  ): Promise<{ viewState: ViewState; data?: PendingCashbacksResponse['data']; error?: string }> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/claims/pending-cashbacks`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
          signal,
        }
      );

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return { viewState: ViewState.ERROR, error: 'Token expired' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          viewState: ViewState.ERROR,
          error: `Failed to fetch pending cashbacks - ${response.status} ${response.statusText}: ${errorText}`
        };
      }

      const result = (await response.json()) as PendingCashbacksResponse;
      return {
        viewState: result.success && result.data.length > 0 ? ViewState.DATA : ViewState.EMPTY,
        data: result.data
      };
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        return { viewState: ViewState.LOADING };
      }
      return { viewState: ViewState.ERROR, error: e instanceof Error ? e.message : 'An error occurred' };
    }
  }

  static async approveRejectCashback(
    token: string,
    username: string,
    permlink: string,
    invoice: string,
    body: { approved: boolean; reason: string, rating: number }
  ): Promise<{ viewState: ViewState; data?: ApproveRejectResponse; error?: string }> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/claims/approve/${username}/${permlink}/${invoice}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
            'accept': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return { viewState: ViewState.ERROR, error: 'Token expired' };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          viewState: ViewState.ERROR,
          error: `Failed to approve/reject cashback - ${response.status} ${response.statusText}: ${errorText}`
        };
      }

      const result = (await response.json()) as ApproveRejectResponse;
      return {
        viewState: result.success ? ViewState.DATA : ViewState.ERROR,
        data: result
      };
    } catch (e) {
      return { viewState: ViewState.ERROR, error: e instanceof Error ? e.message : 'An error occurred' };
    }
  }
  static async reviewClaim(
    token: string,
    permlink: string,
    invoiceId: string
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/claims/v3/reward/${permlink}/${invoiceId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
        }
      );

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        throw new Error('Token expired');
      }

      const result = await response.json();

      if (response.status === 200) {
        return {
          success: result.success || false,
          message: result.message,
          data: result.data
        };
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      throw e;
    }
  }

  static async reattemptClaim(
    token: string,
    username: string,
    permlink: string
  ): Promise<boolean> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/claims/v3/reattempt/${username}/${permlink}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
        }
      );

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        throw new Error('Token expired');
      }

      const result = await response.json();

      if (response.status === 200) {
        return result.success || false;
      } else {
        throw new Error(result.error);
      }
    } catch (e) {
      throw e;
    }
  }

  static async uploadImage(name: string, file: File, token: string): Promise<string> {
    const formData = new FormData();
    formData.append('image', file, name);

    const response = await fetch(`${HD_API_SERVER}/image/upload`, {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    // Check for token expiration
    const isTokenExpired = await handleTokenExpiration(response);
    if (isTokenExpired) {
      throw new Error('Token expired');
    }

    if (response.ok) {
      const result = await response.json();
      return result.fileUrl;
    } else {
      throw new Error(`Failed to upload image - ${response.statusText}`);
    }
  }

  static async getClaimStatus(
    token: string,
    page: number = 1,
    limit: number = 25,
    signal?: AbortSignal,
    status?: "created" | "submitted" | "approved" | "rejected"
  ): Promise<ClaimStatusResponseDTO> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (status) {
      params.append("status", status);
    }

    const response = await fetch(
      `${HD_API_SERVER}/claims/v3/status?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        signal,
      }
    );

    // Check for token expiration
    const isTokenExpired = await handleTokenExpiration(response);
    if (isTokenExpired) {
      throw new Error('Token expired');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch claim status - ${response.status} ${response.statusText}: ${errorText}`
      );
    }
    return (await response.json()) as ClaimStatusResponseDTO;
  }

  static async getDailyLimit(
    token: string,
    signal?: AbortSignal
  ): Promise<{
    success: boolean;
    data: {
      currentUsage: number;
      maxLimit: number;
      remaining: number;
      date: string;
      percentage: number;
    };
  }> {
    const response = await fetch(
      `${HD_API_SERVER}/claims/daily-limit`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        signal,
      }
    );

    // Check for token expiration
    const isTokenExpired = await handleTokenExpiration(response);
    if (isTokenExpired) {
      throw new Error('Token expired');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch daily limit - ${response.status} ${response.statusText}: ${errorText}`
      );
    }
    return (await response.json()) as {
      success: boolean;
      data: {
        currentUsage: number;
        maxLimit: number;
        remaining: number;
        date: string;
        percentage: number;
      };
    };
  }

  static async getBusinessLimits(
    businessId: string,
    token?: string,
    signal?: AbortSignal
  ): Promise<BusinessLimitsData> {
    const response = await fetch(
      `${HD_API_SERVER}/business/limits?business-id=${businessId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        signal,
      }
    );

    // Check for token expiration if token is provided
    if (token) {
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        throw new Error('Token expired');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch business limits - ${response.status} ${response.statusText}: ${errorText}`
      );
    }
    
    const data = await response.json();
    return data as BusinessLimitsData;
  }

  static async getRecentReviews(
    signal?: AbortSignal
  ): Promise<{
    success: boolean;
    data: Array<{
      id: string;
      username: string;
      permlink: string;
      photos: string[];
      reviewText: string;
      reviewBody?: string;
      totalValue?: string;
      invoiceId?: string;
      created: string;
      reviewStatus: string;
      modifiedAt?: string;
      businessId?: string;
    }>;
    count: number;
  }> {
    const response = await fetch(
      `${HD_API_SERVER}/claims/recentReviews`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch recent reviews - ${response.status} ${response.statusText}: ${errorText}`
      );
    }
    
    return (await response.json()) as {
      success: boolean;
      data: Array<{
        id: string;
        username: string;
        permlink: string;
        photos: string[];
        reviewText: string;
        reviewBody?: string;
        totalValue?: string;
        invoiceId?: string;
        created: string;
        reviewStatus: string;
        modifiedAt?: string;
        businessId?: string;
      }>;
      count: number;
    };
  }

  static async claimApproved(
    token: string,
    permlink: string,
    invoice: string,
    signal?: AbortSignal
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/claims/v3/claim-approved/${permlink}/${invoice}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          signal,
        }
      );

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        throw new Error("Token expired");
      }

      const result = await response.json();

      if (response.status === 200) {
        return {
          success: result.success || false,
          message: result.message,
          data: result.data,
        };
      } else {
        throw new Error(result.error || "Failed to claim reward");
      }
    } catch (e) {
      throw e;
    }
  }

  static async submitPrivilegedReview(
    token: string,
    claim: any,
    review: { rating: number; liked: string; improvement: string; experience: string; images: string[] }
  ): Promise<{ success: boolean; message?: string; data?: any }> {
    const response = await fetch(
      `${HD_API_SERVER}/claims/v2/reward-privileged`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
        body: JSON.stringify({ claim, review }),
      }
    );

    const isTokenExpired = await handleTokenExpiration(response);
    if (isTokenExpired) {
      throw new Error('Token expired');
    }

    const result = await response.json();

    if (response.ok) {
      return {
        success: result.success || false,
        message: result.message,
        data: result.data,
      };
    } else {
      throw new Error(result.error || result.message || 'Failed to submit privileged review');
    }
  }

  static async getCashbackLogs(
    token: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    signal?: AbortSignal
  ): Promise<CashbackLogsResponse> {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) {
      params.append("search", search);
    }

    const response = await fetch(
      `${HD_API_SERVER}/claims/cashback-logs?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        signal,
      }
    );

    // Check for token expiration
    const isTokenExpired = await handleTokenExpiration(response);
    if (isTokenExpired) {
      throw new Error("Token expired");
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch cashback logs - ${response.status} ${response.statusText}: ${errorText}`
      );
    }

    return (await response.json()) as CashbackLogsResponse;
  }
}
