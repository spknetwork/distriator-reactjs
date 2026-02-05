import React, { useState } from "react";
import {
  Trash2,
  Ban,
  UserCheck,
  MoreVertical,
  Circle,
} from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type RoleModel } from "../../types/role";
import { useIsMobile } from "../../hooks/use-mobile";

interface AdminTileProps {
  admin: RoleModel;
  removeAdmin: (admin: RoleModel) => Promise<boolean>;
  banUnbanAdmin: (admin: RoleModel, ban: boolean) => Promise<boolean>;
}

export const AdminTile: React.FC<AdminTileProps> = ({
  admin,
  removeAdmin,
  banUnbanAdmin,
}) => {
  const isMobile = useIsMobile();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const success = await removeAdmin(admin);
    setIsLoading(false);
    if (success) setShowDeleteDialog(false);
  };

  const handleBanUnban = async () => {
    setIsLoading(true);
    const success = await banUnbanAdmin(admin, !admin.banned);
    setIsLoading(false);
    if (success) setShowBanDialog(false);
  };

  const ActionButtons = () => (
    <div className="flex items-center gap-2">
      {/* Delete */}
      <button
        onClick={() => setShowDeleteDialog(true)}
        className="btn-outline btn-error btn-xs"
        disabled={isLoading}
        title="Remove Admin"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </button>
    </div>
  );

  return (
    <>
      <div className="card bg-base-100 border shadow-md hover:shadow-lg transition">
        <div className="card-body p-4 flex flex-row items-center gap-4">
          {/* Avatar */}
          <img
            src={`https://images.hive.blog/u/${admin.username}/avatar`}
            alt={`${admin.username} avatar`}
            className="w-12 h-12 rounded-full border-2 border-primary"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "https://images.hive.blog/u/null/avatar";
            }}
          />

          {/* Admin Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base-content truncate">
              {admin.username}
            </h3>
            {admin.banned && (
              <span className="text-sm text-error font-medium">Banned</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0">
            <ActionButtons />
          </div>
        </div>
      </div>

      {/* Remove Confirm Dialog */}
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
              Remove Admin
            </AlertDialog.Title>
            <AlertDialog.Description className="py-2">
              Are you sure you want to remove{" "}
              <span className="font-semibold">{admin.username}</span> from
              admins?
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
    </>
  );
};
