import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { AdminService } from '../services/admin-service';
import { type RoleModel } from '../types/role';
import { ViewState } from '../types/enums';

export const useAdminManagement = (token: string, hasAccess?: boolean) => {
  const [admins, setAdmins] = useState<RoleModel[]>([]);
  const [filteredAdmins, setFilteredAdmins] = useState<RoleModel[]>([]);
  const [viewState, setViewState] = useState<ViewState>(ViewState.LOADING);

  const loadAdmins = useCallback(async () => {
    if (hasAccess === false) {
      setViewState(ViewState.EMPTY);
      return;
    }

    if (!token) return;

    setViewState(ViewState.LOADING);
    try {
      const response = await AdminService.getAllAdmins(token);
      if (response.isSuccess && response.data) {
        setAdmins(response.data);
        setFilteredAdmins(response.data);
        setViewState(response.data.length > 0 ? ViewState.DATA : ViewState.EMPTY);
      } else {
        const errorMsg = response.errorMessage?.toLowerCase() || '';
        const isAccessDenied =
          errorMsg.includes('forbidden') ||
          errorMsg.includes('unauthorized') ||
          errorMsg.includes('access denied') ||
          errorMsg.includes('permission') ||
          errorMsg === 'access denied';

        if (isAccessDenied) {
          setViewState(ViewState.EMPTY);
          return;
        }

        setViewState(ViewState.ERROR);
        toast.error(response.errorMessage || 'Failed to load admins');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message.toLowerCase() : '';
      const isAccessDenied =
        errorMessage.includes('forbidden') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('access denied') ||
        errorMessage.includes('permission');

      if (isAccessDenied) {
        setViewState(ViewState.EMPTY);
        return;
      }

      setViewState(ViewState.ERROR);
      toast.error(`Failed to load admins ${e instanceof Error ? ': ' + e.message : ''}`);
    }
  }, [token, hasAccess]);

  const addAdmin = async (username: string): Promise<boolean> => {
    try {
      const response = await AdminService.addAdmin(token, username);

      if (response.isSuccess) {
        const newAdmin: RoleModel = {
          username,
          banned: false,
          dailyLimit: 100,
          biWeeklyLimit: 1000,
        };
        const newAdmins = [newAdmin, ...admins];
        setAdmins(newAdmins);
        setFilteredAdmins(newAdmins);
        if (viewState === ViewState.EMPTY) {
          setViewState(ViewState.DATA);
        }
        toast.success('Admin added successfully');
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to add admin');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to add admin ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  const removeAdmin = async (admin: RoleModel): Promise<boolean> => {
    try {
      const response = await AdminService.removeAdmin(token, admin.username);

      if (response.isSuccess) {
        const updatedAdmins = admins.filter((a) => a.username !== admin.username);
        setAdmins(updatedAdmins);
        setFilteredAdmins(updatedAdmins);
        if (updatedAdmins.length === 0) {
          setViewState(ViewState.EMPTY);
        }
        toast.success('Admin removed successfully');
        return true;
      } else {
        toast.error(response.errorMessage || 'Failed to remove admin');
        return false;
      }
    } catch (e) {
      toast.error(`Failed to remove admin ${e instanceof Error ? ': ' + e.message : ''}`);
      return false;
    }
  };

  const onSearch = (keyword: string) => {
    if (!keyword.trim()) {
      setFilteredAdmins(admins);
      return;
    }

    const searchTerm = keyword.toLowerCase();
    const filtered = admins.filter((admin) =>
      admin.username.toLowerCase().includes(searchTerm)
    );
    setFilteredAdmins(filtered);
  };

  useEffect(() => {
    if (hasAccess !== false) {
      loadAdmins();
    } else {
      setViewState(ViewState.EMPTY);
    }
  }, [loadAdmins, hasAccess]);

  return {
    admins: filteredAdmins,
    viewState,
    onSearch,
    addAdmin,
    removeAdmin,
    refresh: loadAdmins,
  };
};
