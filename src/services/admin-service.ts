const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import { type ActionListDataResponse, createActionListResponse } from '../types/responses';
import { type ActionSingleDataResponse, createActionSingleResponse } from '../types/responses';
import { type RoleModel, createRoleModel, createRoleActionModel, type RoleActionModel } from '../types/role';
import { handleTokenExpiration } from '../utils/auth-utils';

export class AdminService {
  /**
   * GET /admin - Get all admins
   */
  static async getAllAdmins(token: string): Promise<ActionListDataResponse<RoleModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/admin`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
      });

      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionListResponse(
          {
            valid: false,
            error: 'Token expired',
            data: [],
          },
          createRoleModel
        );
      }

      if (response.status === 200) {
        const data = await response.json();
        return createActionListResponse(
          {
            valid: true,
            error: '',
            data: Array.isArray(data) ? data : [],
          },
          createRoleModel
        );
      } else {
        const isAccessDenied = response.status === 403 || response.status === 401;
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: `HTTP ${response.status}` };
        }
        return createActionListResponse(
          {
            valid: false,
            error: isAccessDenied ? 'Access Denied' : (errorData.message || `HTTP ${response.status}`),
            data: [],
          },
          createRoleModel
        );
      }
    } catch (error) {
      return createActionListResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: [],
        },
        createRoleModel
      );
    }
  }

  /**
   * GET /admin/add/{username} - Add a new admin
   */
  static async addAdmin(token: string, username: string): Promise<ActionSingleDataResponse<RoleActionModel>> {
    return this.adminAction(token, 'add', username);
  }

  /**
   * GET /admin/remove/{username} - Remove an admin
   */
  static async removeAdmin(token: string, username: string): Promise<ActionSingleDataResponse<RoleActionModel>> {
    return this.adminAction(token, 'remove', username);
  }

  private static async adminAction(
    token: string,
    action: 'add' | 'remove' ,
    username: string
  ): Promise<ActionSingleDataResponse<RoleActionModel>> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/admin/${action}/${encodeURIComponent(username)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'authorization': token,
          },
        }
      );

      const isTokenExpired = await handleTokenExpiration(response);
      if (isTokenExpired) {
        return createActionSingleResponse(
          {
            valid: false,
            error: 'Token expired',
          },
          createRoleActionModel
        );
      }

      if (response.status === 200) {
        const result = await response.json();
        return createActionSingleResponse(
          {
            valid: true,
            error: '',
            data: result,
          },
          createRoleActionModel
        );
      } else {
        let errorResult;
        try {
          errorResult = await response.json();
        } catch {
          errorResult = { message: `HTTP ${response.status}` };
        }
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.message || errorResult.error || `HTTP ${response.status}`,
          },
          createRoleActionModel
        );
      }
    } catch (error) {
      return createActionSingleResponse(
        {
          valid: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        createRoleActionModel
      );
    }
  }
}
