import { Link } from "react-router-dom";
import HiveUserAvatarButton from "./HiveUserAvatarButton";
import { Menu } from "lucide-react";
import { useState } from "react";
import type { FC } from "react";
import SidebarDrawer from "./SidebarDrawer";
import { useCashbackStore } from "../stores/cashbackStore";
import usePendingReviewsStore from "../stores/pendingReviewsStore";
import { useAuthData } from "../utils/auth-utils";
import { RoleType } from "../types/role";

interface NavBarProps {
  title?: string;
  subtitle?: string;
}

const NavBar: FC<NavBarProps> = ({ title, subtitle }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { approvedCount } = useCashbackStore();
  const { type: userRole } = useAuthData();
  const { pendingReviewsCount } = usePendingReviewsStore();


  const isAdminOrSuper =
    userRole === RoleType.ADMIN || userRole === RoleType.SUPER;
  const totalCount = isAdminOrSuper ? approvedCount + pendingReviewsCount : approvedCount;

  return (
    <>
      <div className="navbar bg-background shadow-sm border-b border-border">
        <div className="flex-1 flex items-center">
          {/* Drawer Menu Button */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex p-2 hover:bg-accent rounded-full mr-2 item-start"
          >
            <Menu className="w-6 h-6 text-foreground" />
            {totalCount > 0 && (
              <span className="w-4 h-4 inline-flex items-start justify-center text-[9px] font-bold text-red-100 bg-red-600 rounded-full">
                {totalCount}
              </span>
            )}
          </button>

          {/* If title is provided, render it as non-clickable text to disable redirect to "/" */}
          {title ? (
            <div
              className="flex flex-col text-foreground leading-tight"
              role="heading"
              aria-level={1}
            >
              <span className="text-xl font-semibold">{title}</span>
              {subtitle && (
                <span className="text-sm text-muted-foreground">{subtitle}</span>
              )}
            </div>
          ) : (
            <Link to="/" className="btn btn-ghost text-xl text-foreground">
              Distriator
            </Link>
          )}
        </div>
        <div className="flex-none">
          <HiveUserAvatarButton />
        </div>
      </div>

      {/* Sidebar Drawer */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
};

export default NavBar;
