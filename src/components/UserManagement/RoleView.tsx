import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import { RoleType } from '../../types/role';
import { RoleTile } from './RoleTile';
import CommonLayout from '../CommonLayout';
import { useAuthData } from '../../utils/auth-utils';
import { ViewState } from '../../types/enums';

export const RoleView: React.FC = () => {
  const { roleType } = useParams<{ roleType: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const { token, type: userRoleType } = useAuthData();

  // Check if user has admin or super admin access
  const hasAccess = userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;

  // Redirect non-admin users to home
  useEffect(() => {
    if (!hasAccess && token) {
      navigate("/");
    }
  }, [hasAccess, token, navigate]);

  const roleTypeEnum = roleType as RoleType;
  const {
    roles,
    viewState,
    onSearch,
    getRoleName,
    refresh,
    removeMember,
    banUnbanMember,
  } = useRoleManagement(token, roleTypeEnum, hasAccess);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value.trim());
  };

  const handleAddMember = () => {
    navigate(`/manage-users/${roleType}/add`);
  };

  if (!token) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-base-content mb-4">
              Access Denied
            </h2>
            <p className="text-base-content/60 mb-6">
              You need to be logged in to access this page
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </CommonLayout>
    );
  }

  if (!hasAccess) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-base-content mb-4">
              Access Denied
            </h2>
            <p className="text-base-content/60 mb-6">
              You don't have permission to access this page. Only Admin and Super Admin users can manage users.
            </p>
            <button
              onClick={() => navigate("/")}
              className="btn btn-primary"
            >
              Go to Home
            </button>
          </div>
        </div>
      </CommonLayout>
    );
  }

  return (
    <CommonLayout>
      <div className="max-w-7xl mx-auto m-0 px-4 sm:px-6 lg:px-8 pt-2">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-base-content">
              {getRoleName()}s
            </h1>
            <p className="text-base-content/70">
              Manage {getRoleName().toLowerCase()}s in the system
            </p>
          </div>

          <button
            onClick={handleAddMember}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add {getRoleName()}
          </button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center rounded-lg px-2 mb-6 border border-gray-300 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <input
            type="text"
            placeholder={
              roleTypeEnum === RoleType.GUIDE
                ? "Search name, city or country"
                : "Search username"
            }
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="ml-2 bg-transparent px-2 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none flex-1"
          />
        </div>

        {/* Content */}
        {viewState === ViewState.LOADING && (
          <div className="flex items-center justify-center py-12">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        )}

        {viewState === ViewState.ERROR && (
          <div className="text-center py-12">
            <p className="text-error mb-4">Failed to load data</p>
            <button onClick={refresh} className="btn btn-primary">
              Retry
            </button>
          </div>
        )}

        {viewState === ViewState.EMPTY && (
          <div className="text-center py-12">
            <p className="text-base-content/60">
              No {getRoleName().toLowerCase()}s found
            </p>
          </div>
        )}

        {viewState === ViewState.DATA && (
          <div className="space-y-4">
            {roles.map((role, index) => (
              <RoleTile
                key={`${role.username}-${roleTypeEnum}-${index}`}
                role={role}
                roleType={roleTypeEnum}
                removeMember={removeMember}
                banUnbanMember={banUnbanMember}
              />
            ))}
          </div>
        )}

      </div>
    </CommonLayout>
  );
};