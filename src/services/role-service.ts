const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import { type ActionListDataResponse, createActionListResponse } from '../types/responses';
import { type ActionSingleDataResponse, createActionSingleResponse } from '../types/responses';
import { type RoleModel, type RoleActionModel, createRoleModel, createRoleActionModel, RoleType, RoleActionType, GuideRoleActionType } from '../types/role';
import { handleTokenExpiration } from '../utils/auth-utils';

export class RoleService {
  static async viewRoleMembers(
    token: string,
    roleType: RoleType
  ): Promise<ActionListDataResponse<RoleModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/${roleType}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
      });

      // Check for token expiration
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
            data: data,
          },
          createRoleModel
        );
      } else {
        // Check if it's an access denied error (403 or 401)
        const isAccessDenied = response.status === 403 || response.status === 401;
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}` };
        }
        return createActionListResponse(
          {
            valid: false,
            error: isAccessDenied ? 'Access Denied' : (errorData.error || `HTTP ${response.status}`),
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

  static async roleAction(
    token: string,
    data: RoleModel,
    type: RoleActionType,
    roleType: RoleType
  ): Promise<ActionSingleDataResponse<RoleActionModel>> {
    try {
      const response = await fetch(
        `${HD_API_SERVER}/${roleType}/${type}/${data.username}`,
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
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
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

  static async guideAction(
    token: string,
    role: RoleModel,
    type: GuideRoleActionType
  ): Promise<ActionSingleDataResponse<RoleActionModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/guide/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        body: JSON.stringify(role),
      });

      // Check for token expiration
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
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
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

  static async setRoleLimit(
    token: string,
    roleType: RoleType,
    data: RoleModel
  ): Promise<ActionSingleDataResponse<RoleActionModel>> {
    try {
      const response = await fetch(`${HD_API_SERVER}/${roleType}/limit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': token,
        },
        body: JSON.stringify({
          username: data.username,
          daily: data.dailyLimit,
          biweekly: data.biWeeklyLimit,
        }),
      });

      // Check for token expiration
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
        const errorResult = await response.json();
        return createActionSingleResponse(
          {
            valid: false,
            error: errorResult.error || `HTTP ${response.status}`,
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