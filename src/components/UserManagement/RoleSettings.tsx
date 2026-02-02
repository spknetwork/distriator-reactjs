import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { type RoleModel, RoleType, RoleActionType } from '../../types/role';
import { useRoleManagement } from '../../hooks/useRoleManagement';
import CommonLayout from '../CommonLayout';
import { useAuthData } from '../../utils/auth-utils';

export const RoleSettings: React.FC = () => {
  const { roleType } = useParams<{ roleType: string; username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [formData, setFormData] = useState<RoleModel>({
    username: '',
    banned: false,
    dailyLimit: 10,
    biWeeklyLimit: 50,
  });
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const {token, type: userRoleType} = useAuthData();
  const roleTypeEnum = roleType as RoleType;
  
  // Check if user has admin or super admin access
  const hasAccess = userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;

  // Redirect non-admin users to home
  useEffect(() => {
    if (!hasAccess && token) {
      navigate("/");
    }
  }, [hasAccess, token, navigate]);
  
  const { updateLimit, banUnbanMember, removeMember, getRoleName } = useRoleManagement(token, roleTypeEnum);

  useEffect(() => {
    if (location.state?.role) {
      const role = location.state.role as RoleModel;
      setFormData({
        ...role,
        dailyLimit: role.dailyLimit ?? 10,
        biWeeklyLimit: role.biWeeklyLimit ?? 50,
      });
    }
  }, [location.state]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const success = await updateLimit(formData);
      if (success) {
        navigate(`/manage-users/${roleType}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUnban = async () => {
    setIsLoading(true);
    try {
      const action = formData.banned ? RoleActionType.UNBAN : RoleActionType.BAN;
      const success = await banUnbanMember(formData, action);
      if (success) {
        setFormData(prev => ({ ...prev, banned: !prev.banned }));
        setShowBanDialog(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const success = await removeMember(formData);
      if (success) {
        navigate(`/manage-users/${roleType}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSliderChange = (field: 'dailyLimit' | 'biWeeklyLimit', value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!token) {
    return (
      <CommonLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">You need to be logged in to access this page</p>
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
            <h2 className="text-2xl font-bold text-foreground mb-4">Access Denied</h2>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access this page. Only Admin and Super Admin users can manage user settings.
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
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/manage-users/${roleType}`)}
                className="p-2 hover:bg-accent rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground truncate">
                  {formData.username} Settings
                </h1>
                <p className="text-muted-foreground">
                  Manage limits and permissions
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBanDialog(true)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  formData.banned
                    ? 'bg-success/10 text-success hover:bg-success/20'
                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                }`}
                disabled={isLoading}
              >
                {formData.banned ? 'Unban' : 'Ban'}
              </button>
              
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="p-2 hover:bg-destructive/10 rounded-full transition-colors"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          </div>

          {/* Settings Form */}
          <div className="space-y-8">
            {/* Daily Limit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Max Claims Per Day
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium text-foreground">
                    {formData.dailyLimit}
                  </span>
                  <span>10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={formData.dailyLimit}
                  onChange={(e) => handleSliderChange('dailyLimit', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Biweekly Limit */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">
                Biweekly Max Claims
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>0</span>
                  <span className="font-medium text-foreground">
                    {formData.biWeeklyLimit}
                  </span>
                  <span>50</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={formData.biWeeklyLimit}
                  onChange={(e) => handleSliderChange('biWeeklyLimit', parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-center">
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ban/Unban Dialog */}
      <AlertDialog.Root open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-6 shadow-lg z-50">
            <AlertDialog.Title className="text-lg font-semibold text-foreground mb-2">
              {formData.banned ? 'Unban' : 'Ban'} {getRoleName()}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground mb-4">
              Are you sure you want to {formData.banned ? 'unban' : 'ban'} {formData.username}?
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={handleBanUnban}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : (formData.banned ? 'Unban' : 'Ban')}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Delete Dialog */}
      <AlertDialog.Root open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-card p-6 shadow-lg z-50">
            <AlertDialog.Title className="text-lg font-semibold text-foreground mb-2">
              Remove {getRoleName()}
            </AlertDialog.Title>
            <AlertDialog.Description className="text-muted-foreground mb-4">
              Are you sure you want to remove {formData.username} from the {getRoleName().toLowerCase()} list?
              This action cannot be undone.
            </AlertDialog.Description>
            <div className="flex justify-end gap-3">
              <AlertDialog.Cancel className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 rounded-md">
                Cancel
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 text-sm bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-md disabled:opacity-50"
              >
                {isLoading ? 'Removing...' : 'Remove'}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </CommonLayout>
  );
};