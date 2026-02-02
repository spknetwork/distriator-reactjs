/* eslint-disable @typescript-eslint/no-explicit-any */
import { type ActionSingleDataResponse, createActionSingleResponse } from '../types/responses';
import { type CartModel, createCartModel } from '../types/cart';
import { handleTokenExpiration } from '../utils/auth-utils';
import { type PaginatedCartsResponse } from '../types/paginated-cart';

const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';

export class CartService {
  static async getCartsByBusinessId(
    token: string,
    businessId: string,
    page = 1,
    limit = 20,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<PaginatedCartsResponse>> {
    try {
      const url = `${HD_API_SERVER}/carts/business/${businessId}?page=${page}&limit=${limit}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        signal,
      });

      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
          },
          (data) => data
        );
      }

      const result = await response.json();

      if (response.status === 200) {
        // Normalize into our expected shape
        const rawList =
          result?.data?.carts ??
          result?.carts ??
          result?.data?.items ??
          result?.items ??
          result?.data?.docs ??
          result?.docs ??
          [];

        const cartsRaw = Array.isArray(rawList)
          ? rawList.map((c: any) => createCartModel(c))
          : [];

        const pageNum = Number(result?.data?.page ?? result?.page ?? 1) || 1;
        const totalPages = Number(result?.data?.totalPages ?? result?.totalPages ?? 1) || 1;
        const limitNum = Number(result?.data?.limit ?? result?.limit ?? limit) || limit;
        const payload: PaginatedCartsResponse = {
          carts: cartsRaw,
          page: pageNum,
          limit: limitNum,
          totalPages,
          totalItems: result?.data?.totalItems ?? result?.totalItems,
        };

        return createActionSingleResponse(
          {
            valid: true,
            data: payload,
          },
          (data) => data
        );
      } else {
        return createActionSingleResponse(
          {
            valid: false,
            error: result?.error || `HTTP ${response.status}`,
          },
          (data) => data
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        (data) => data
      );
    }
  }
  static async createCart(
    token: string,
    data: CartModel
  ): Promise<ActionSingleDataResponse<CartModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/carts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(data),
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
          },
          (data) => data
        );
      }

      if (response.status === 200 || response.status === 201) {
        const result = await response.json();
        
        let cartData: CartModel;
        
        if (result && typeof result === 'object') {
          cartData = createCartModel(result);
        } else {
          throw new Error('Invalid response format');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: cartData,
          },
          (data) => data
        );
      } else {
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
          },
          (data) => data
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        (data) => data
      );
    }
  }

  static async getCartById(
    token: string,
    cartId: string
  ): Promise<ActionSingleDataResponse<CartModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/carts/${cartId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
          },
          (data) => data
        );
      }

      if (response.status === 200) {
        const result = await response.json();
        
        let cartData: CartModel;
        
        if (result && typeof result === 'object') {
          cartData = createCartModel(result);
        } else {
          throw new Error('Invalid response format');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: cartData,
          },
          (data) => data
        );
      } else {
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
          },
          (data) => data
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        (data) => data
      );
    }
  }

  static async updateCartStatus(
    token: string,
    cartId: string,
    transactionId?: string,
    status?: string
  ): Promise<ActionSingleDataResponse<CartModel>> {
    try {
      const body: any = {};
      if (transactionId && transactionId.trim()) {
        body.transactionId = transactionId;
      }
      if (status && status.trim()) {
        body.status = status;
      }

      const response = await fetch(`${HD_API_SERVER}/carts/${cartId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      // Check for token expiration
      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
          },
          (data) => data
        );
      }

      if (response.status === 200) {
        const result = await response.json();
        
        let cartData: CartModel;
        
        if (result && typeof result === 'object') {
          cartData = createCartModel(result);
        } else {
          throw new Error('Invalid response format');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: cartData,
          },
          (data) => data
        );
      } else {
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
          },
          (data) => data
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        (data) => data
      );
    }
  }
}