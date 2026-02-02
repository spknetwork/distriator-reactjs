import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Edit,
  Trash2,
  Ban,
  UserCheck,
  MapPin,
  Flag,
  MoreVertical,
  Circle,
} from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type RoleModel, RoleType, RoleActionType } from "../../types/role";
import { useIsMobile } from "../../hooks/use-mobile";

interface RoleTileProps {
  role: RoleModel;
  roleType: RoleType;
  removeMember: (role: RoleModel) => Promise<boolean>;
  banUnbanMember: (role: RoleModel, action: RoleActionType) => Promise<boolean>;
}

export const RoleTile: React.FC<RoleTileProps> = ({
  role,
  roleType,
  removeMember,
  banUnbanMember,
}) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEdit = () => {
    navigate(`/manage-users/${roleType}/edit/${role.username}`, {
      state: { role },
    });
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const success = await removeMember(role);
    setIsLoading(false);
    if (success) setShowDeleteDialog(false);
  };

  const handleBanUnban = async () => {
    setIsLoading(true);
    const action = role.banned ? RoleActionType.UNBAN : RoleActionType.BAN;
    const success = await banUnbanMember(role, action);
    setIsLoading(false);
    if (success) setShowBanDialog(false);
  };

  /** ================= ACTION BUTTONS ================= */
  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      {/* Ban / Unban */}
      <button
        onClick={() => setShowBanDialog(true)}
        className={`cursor-pointer rounded-full ${role.banned ? "btn-success" : "btn-error"
          }`}
        disabled={isLoading}
        title={role.banned ? "Unban User" : "Ban User"} // hover message
      >
        {role.banned ? (
          <Ban className="w-4 h-4 text-red-500" />
        ) : (
          <Circle className="w-4 h-4 text-green-500" />
        )}
      </button>

      {roleType === RoleType.GUIDE && (
        <button
          onClick={handleEdit}
          className="btn btn-circle btn-ghost btn-xs"
          disabled={isLoading}
          title="Edit Role"
        >
          <Edit className="w-4 h-4 text-yellow-300" />
        </button>
      )}

      {/* Delete */}
      <button
        onClick={() => setShowDeleteDialog(true)}
        className="btn-outline btn-error btn-xs"
        disabled={isLoading}
        title="Delete Role" // hover message
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );

  /** ================= MOBILE MENU ================= */
  const MobileMenu = () => (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="btn btn-circle btn-ghost btn-xs">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu bg-base-100 rounded-box shadow-md w-26 p-2">
          <DropdownMenu.Item
            onClick={() => setShowBanDialog(true)}
            className="flex gap-2 items-center cursor-pointer py-2 px-3 hover:bg-base-200 rounded-md"
          >
            {role.banned ? (
              <UserCheck className="w-4 h-4" />
            ) : (
              <Ban className="w-4 h-4" />
            )}
            {role.banned ? "Unban" : "Ban"}
          </DropdownMenu.Item>

          {roleType === RoleType.GUIDE && (
            <DropdownMenu.Item
              onClick={handleEdit}
              className="flex gap-2 items-center cursor-pointer py-2 px-3 hover:bg-base-200 rounded-md"
            >
              <Edit className="w-4 h-4" /> Edit
            </DropdownMenu.Item>
          )}

          <DropdownMenu.Item
            onClick={() => setShowDeleteDialog(true)}
            className="flex gap-2 items-center cursor-pointer py-2 px-3 text-error hover:bg-error/10 rounded-md"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );

  return (
    <>
      <div className="card bg-base-100 border shadow-md hover:shadow-lg transition">
        <div className="card-body p-4 flex flex-row items-center gap-4">
          {/* Avatar */}
          <img
            src={`https://images.hive.blog/u/${role.username}/avatar`}
            alt={`${role.username} avatar`}
            className="w-12 h-12 rounded-full border-2 border-primary"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `https://images.hive.blog/u/null/avatar`;
            }}
          />


          {/* User Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base-content truncate">
              {role.username}
            </h3>

            {roleType === RoleType.GUIDE && (role.country || role.city) && (
              <div className="flex flex-wrap gap-4 mt-1 text-sm text-base-content/70">
                {role.country && (
                  <div className="flex items-center gap-1">
                    <Flag className="w-4 h-4" />
                    <span>{role.country}</span>
                  </div>
                )}
                {role.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{role.city}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0">
            {isMobile && roleType === RoleType.GUIDE ? (
              <MobileMenu />
            ) : (
              <ActionButtons />
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      <AlertDialog.Root
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      >
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[9998]" />
          <AlertDialog.Content
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
             bg-base-100 p-6 rounded-lg shadow-xl w-[90%] max-w-sm mx-auto"
          >
            <AlertDialog.Title className="font-bold text-lg">
              Remove User
            </AlertDialog.Title>
            <AlertDialog.Description className="py-2">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{role.username}</span>?
            </AlertDialog.Description>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialog.Cancel className="btn">Cancel</AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={handleDelete}
                disabled={isLoading}
                className="btn btn-error"
              >
                {isLoading ? "Removing..." : "Remove"}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>

      {/* Ban/Unban Confirm Dialog */}
      <AlertDialog.Root open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-[9998]" />
          <AlertDialog.Content
            className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
             bg-base-100 p-6 rounded-lg shadow-xl w-[90%] max-w-sm mx-auto"
          >
            <AlertDialog.Title className="font-bold text-lg">
              {role.banned ? "Unban" : "Ban"} User
            </AlertDialog.Title>
            <AlertDialog.Description className="py-2">
              Are you sure you want to{" "}
              {role.banned ? "unban" : "ban"}{" "}
              <span className="font-semibold">{role.username}</span>?
            </AlertDialog.Description>
            <div className="flex justify-end gap-3 mt-4">
              <AlertDialog.Cancel className="btn">Cancel</AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={handleBanUnban}
                disabled={isLoading}
                className="btn btn-primary"
              >
                {isLoading
                  ? "Processing..."
                  : role.banned
                    ? "Unban"
                    : "Ban"}
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
};
