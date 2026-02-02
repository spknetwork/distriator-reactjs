import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { RoleService } from '../services/role-service';
import { type RoleModel, RoleType, RoleActionType, GuideRoleActionType } from '../types/role';
import { ViewState } from '../types/enums';


export const useRoleManagement = (token: string, roleType: RoleType, hasAccess?: boolean) => {
  const [roles, setRoles] = useState<RoleModel[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<RoleModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);
  const [searchKey, setSearchKey] = useState('');

  /**
   * Load roles from API
   */
  const loadRoles = useCallback(async () => {
    // Don't load if user doesn't have access - silently return
    if (hasAccess === false) {
      setViewState(ViewState.EMPTY);
      return;
    }

    if (!token || !roleType) return; // guard against invalid values

    setViewState(ViewState.LOADING);
    try {
      const response = await RoleService.viewRoleMembers(token, roleType);
      if (response.isSuccess && response.data) {
        setRoles(response.data);
        setFilteredRoles(response.data);
        setViewState(response.data.length > 0 ? ViewState.DATA : ViewState.EMPTY);
      } else {
        // Check if error is due to access denied (403/401) - handle silently
        const errorMsg = response.errorMessage?.toLowerCase() || '';
        const isAccessDenied = errorMsg.includes('forbidden') ||
                               errorMsg.includes('unauthorized') ||
                               errorMsg.includes('access denied') ||
                               errorMsg.includes('permission') ||
                               errorMsg === 'access denied';
        
        if (isAccessDenied) {
          setViewState(ViewState.EMPTY);
          return; // Silently handle access denied - no toast shown
        }
        
        setViewState(ViewState.ERROR);
        toast.error(response.errorMessage || 'Failed to load roles');
      }
    } catch (e) {
      // Check if error is due to access denied - handle silently
      const errorMessage = e instanceof Error ? e.message.toLowerCase() : '';
      const isAccessDenied = errorMessage.includes('forbidden') ||
                            errorMessage.includes('unauthorized') ||
                            errorMessage.includes('access denied') ||
                            errorMessage.includes('permission');
      
      if (isAccessDenied) {
        setViewState(ViewState.EMPTY);
        return; // Silently handle access denied
      }
      
      setViewState(ViewState.ERROR);
      toast.error(`Failed to load roles ${e instanceof Error ? ': ' + e.message : ''}`);
    }
  }, [token, roleType, hasAccess]);

  /**
   * Add new member
   */
  const addMember = async (data: RoleModel): Promise<boolean> => {
    try {
      let response;
      if (roleType !== RoleType.GUIDE) {
        response = await RoleService.roleAction(token, data, RoleActionType.ADD, roleType);
      } else {
        response = await RoleService.guideAction(token, data, GuideRoleActionType.ADD);
      }

      if (response.isSuccess) {
        const newRoles = [data, ...roles];
        setRoles(newRoles);
        setFilteredRoles(newRoles);
        if (viewState === ViewState.EMPTY) {
          setViewState(ViewState.DATA);
        }
        toast.success(`${getRoleName(roleType)} added successfully`);
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to add member');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to add member ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  /**
   * Update existing member (only for guide)
   */
  const updateMember = async (data: RoleModel): Promise<boolean> => {
    try {
      if (roleType !== RoleType.GUIDE) {
        throw new Error('Update not implemented for this role type');
      }

      const response = await RoleService.guideAction(token, data, GuideRoleActionType.UPDATE);
      if (response.isSuccess) {
        const updatedRoles = roles.map(role =>
          role.username === data.username ? data : role
        );
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
        toast.success(`${getRoleName(roleType)} updated successfully`);
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to update member');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to update member${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  /**
   * Remove member
   */
  const removeMember = async (data: RoleModel): Promise<boolean> => {
    try {
      let response;
      if (roleType !== RoleType.GUIDE) {
        response = await RoleService.roleAction(token, data, RoleActionType.REMOVE, roleType);
      } else {
        response = await RoleService.guideAction(token, data, GuideRoleActionType.REMOVE);
      }

      if (response.isSuccess) {
        const updatedRoles = roles.filter(role => role.username !== data.username);
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
        if (updatedRoles.length === 0) {
          setViewState(ViewState.EMPTY);
        }
        toast.success(`${getRoleName(roleType)} removed successfully`);
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to remove member');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to remove member ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  /**
   * Ban or Unban member
   */
  const banUnbanMember = async (data: RoleModel, type: RoleActionType): Promise<boolean> => {
    try {
      let response;
      if (roleType !== RoleType.GUIDE) {
        response = await RoleService.roleAction(token, data, type, roleType);
      } else {
        const updatedData = { ...data, banned: type === RoleActionType.BAN };
        response = await RoleService.guideAction(token, updatedData, GuideRoleActionType.UPDATE);
      }

      if (response.isSuccess) {
        const updatedRoles = roles.map(role =>
          role.username === data.username
            ? { ...role, banned: type === RoleActionType.BAN }
            : role
        );
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
        toast.success(
          `${getRoleName(roleType)} ${type === RoleActionType.BAN ? 'banned' : 'unbanned'} successfully`
        );
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to update member status');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to update member status ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  /**
   * Update role limit
   */
  const updateLimit = async (data: RoleModel): Promise<boolean> => {
    try {
      const response = await RoleService.setRoleLimit(token, roleType, data);
      if (response.isSuccess) {
        const updatedRoles = roles.map(role =>
          role.username === data.username ? data : role
        );
        setRoles(updatedRoles);
        setFilteredRoles(updatedRoles);
        toast.success('Limit updated successfully');
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to update limit');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to update limit ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  /**
   * Search members
   */
  const onSearch = (keyword: string) => {
    setSearchKey(keyword);
    if (!keyword.trim()) {
      setFilteredRoles(roles);
      return;
    }

    const filtered = roles.filter(role => {
      const searchTerm = keyword.toLowerCase();
      return (
        role.username.toLowerCase().includes(searchTerm) ||
        role.city?.toLowerCase().includes(searchTerm) ||
        role.country?.toLowerCase().includes(searchTerm)
      );
    });
    setFilteredRoles(filtered);
  };

  /**
   * Get role name for display
   */
  const getRoleName = (roleType: RoleType): string => {
    switch (roleType) {
      case RoleType.ADMIN:
        return 'Admin';
      case RoleType.OWNER:
        return 'Owner';
      case RoleType.GUIDE:
        return 'Trusted Guide';
      case RoleType.USER:
        return 'User';
      case RoleType.SUPER:
        return 'Super Admin';
      default:
        return 'Role';
    }
  };

  /**
   * Initial load - only load if user has access
   */
  useEffect(() => {
    if (hasAccess !== false) {
      loadRoles();
    } else {
      setViewState(ViewState.EMPTY);
    }
  }, [loadRoles, hasAccess]);

  return {
    roles: filteredRoles,
    viewState,
    searchKey,
    onSearch,
    addMember,
    updateMember,
    removeMember,
    banUnbanMember,
    updateLimit,
    refresh: loadRoles,
    getRoleName: () => getRoleName(roleType),
  };
};
