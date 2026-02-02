import { type ActionSingleDataResponse, createActionSingleResponse } from '../types/responses';
import { type ProductModel, createProductModel } from '../types/product';
import { handleTokenExpiration } from '../utils/auth-utils';

const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';

export class ProductService {
  static async createProduct(
    token: string,
    data: any
  ): Promise<ActionSingleDataResponse<ProductModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/products`, {
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
        
        let productData: ProductModel;
        
        if (result && typeof result === 'object') {
          // If API returns the product directly
          if (result.name) {
            productData = createProductModel(result);
          }
          // If API returns {data: {...}}
          else if (result.data && result.data.name) {
            productData = createProductModel(result.data);
          }
          else {
            throw new Error('Unexpected response format for createProduct');
          }
        } else {
          throw new Error('Invalid response format');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: productData,
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

  static async updateProduct(
    token: string,
    productId: string,
    data: any
  ): Promise<ActionSingleDataResponse<ProductModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/products/${productId}`, {
        method: 'PUT',
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

      if (response.status === 200) {
        const result = await response.json();
        
        let productData: ProductModel;
        
        if (result && typeof result === 'object') {
          // If API returns the product directly
          if (result.name) {
            productData = createProductModel(result);
          }
          // If API returns {data: {...}}
          else if (result.data && result.data.name) {
            productData = createProductModel(result.data);
          }
          else {
            throw new Error('Unexpected response format for updateProduct');
          }
        } else {
          throw new Error('Invalid response format');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: productData,
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

  static async getProducts(
    token: string,
    businessId?: string,
    page: number = 1,
    limit: number = 10,
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<ProductModel[]>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (businessId) {
        params.append('businessId', businessId);
      }

      const response = await fetch(`${HD_API_SERVER}/products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        signal,
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
        
        let products: ProductModel[] = [];
        
        if (Array.isArray(result)) {
          products = result.map(createProductModel);
        } else if (result.data && Array.isArray(result.data)) {
          products = result.data.map(createProductModel);
        } else {
          throw new Error('Unexpected response format for products');
        }

        return createActionSingleResponse(
          {
            valid: true,
            data: products,
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

  static async deleteProduct(
    token: string,
    productId: string
  ): Promise<ActionSingleDataResponse<boolean>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/products/${productId}`, {
        method: 'DELETE',
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
        const success = result.message === "Product deleted successfully";
        
        return createActionSingleResponse(
          {
            valid: true,
            data: success,
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

  static async getProductTypes(
    signal?: AbortSignal
  ): Promise<ActionSingleDataResponse<Record<string, Record<string, string[]>>>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/products/types`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal,
      });

      if (response.status === 200) {
        const result = await response.json();
        
        return createActionSingleResponse(
          {
            valid: true,
            data: result,
          },
          (data) => data
        );
      } else {
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.message || errorResult.error || `HTTP ${response.status}`,
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