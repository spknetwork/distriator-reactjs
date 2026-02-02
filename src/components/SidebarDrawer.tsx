import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart,
  Package,
  X,
  LifeBuoy,
  Repeat,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Link as LinkIcon,
  HelpCircle,
  Check,
  Newspaper,
  Hammer,
  DollarSign,
  UserPlus,
  Info,
  UserCheck,
  Users,
  ClipboardList,
  Wallet as WalletIcon,
  Clock,
  Star,
  History,
  ShoppingCart,
} from "lucide-react";
import { useEffect, useState } from "react";
import { MdRefresh } from "react-icons/md";

import ReattemptClaimDialog from "./ReattemptClaim";
import { RoleType } from "../types/role";
import { useAuthData } from "../utils/auth-utils";
import packageJson from "../../package.json";
import { useCashbackStore } from "../stores/cashbackStore";
import usePendingReviewsStore from "../stores/pendingReviewsStore";
import { isMobilePlatform } from "../utils/platform-detection";
import { fetchBusinessesApi } from "../services/BusinessApi";

// const isIOSSafari = () => {
//   const ua = window.navigator.userAgent;
//   const isIOS = /iP(ad|hone|od)/.test(ua);
//   const isWebKit = /WebKit/.test(ua);
//   const isChrome = /CriOS/.test(ua);
//   const isFirefox = /FxiOS/.test(ua);
//   return isIOS && isWebKit && !isChrome && !isFirefox;
// };

interface SidebarDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
  const location = useLocation();
  const [isSupportExpanded, setIsSupportExpanded] = useState(false);
  const [isLinksExpanded, setIsLinksExpanded] = useState(false);
  const [isReattemptDialogOpen, setIsReattemptDialogOpen] = useState(false);
  const [isManageUsersExpanded, setIsManageUsersExpanded] = useState(false);
  const [isManageBusinessExpanded, setIsManageBusinessExpanded] =
    useState(false);
  const [userOwnsBusiness, setUserOwnsBusiness] = useState(false);

  const { type: userRoleType, isAuthenticated, username } = useAuthData();
  const { approvedCount } = useCashbackStore();
  const { pendingReviewsCount } = usePendingReviewsStore();
  const navigate = useNavigate();
  const isMobile = isMobilePlatform();
  // const isIPhone = isIOSSafari();

  // Check if user has admin or super admin privileges
  const hasManageUsersAccess =
    userRoleType === RoleType.ADMIN || userRoleType === RoleType.SUPER;
  const handleReload = () => {
    window.location.reload();
  };

  const APP_VERSION = packageJson.version;
  const BRANCH_NAME = packageJson.deployment.branch;
  const COMMIT_HASH = packageJson.deployment.commitHash;

  const menuItems = [
    // Business-related routes moved to Manage Business section
    {
      label: "Reports",
      icon: <BarChart className="w-5 h-5" />,
      path: "/reports/distriator",
    },
    {
      label: "Businesses",
      icon: <Package className="w-5 h-5" />,
      path: "/businesses",
    },
    {
      label: "Recent Reviews",
      icon: <Star className="w-5 h-5" />,
      path: "/recent-reviews",
    },
    // Pending Cashback - Only show for admin/super users
    ...(hasManageUsersAccess
      ? [
          {
            label: "Pending Cashback",
            icon: <Clock className="w-5 h-5" />,
            path: "/pending-cashback",
          },
          {
            label: "Cashback Logs",
            icon: <History className="w-5 h-5" />,
            path: "/cashback-logs",
          },
        ]
      : []),
  ];

  const walletItems = [
    {
      label: "Cashback Status",
      icon: <ClipboardList className="w-5 h-5" />,
      path: "/cashback-status",
    },
    {
      label: "Wallet",
      icon: <WalletIcon className="w-5 h-5" />,
      path: "/user-wallet",
    },
  ];

  const manageUsersItems = [
    {
      label: "Trusted Guides",
      icon: <UserCheck className="w-5 h-5" />,
      path: "/manage-users/guide",
    },
    {
      label: "Users",
      icon: <Users className="w-5 h-5" />,
      path: "/manage-users/user",
    },
  ];

  const manageBusinessItems = [
    {
      label: "Product Catalogue",
      icon: <Package className="w-5 h-5" />,
      path: "/catalogue",
    },
    {
      label: "Point of Sale",
      icon: <ShoppingCart className="w-5 h-5" />,
      path: "/pos-select",
    },
    {
      label: "Sales",
      icon: <ClipboardList className="w-5 h-5" />,
      path: "/sales-select",
    },
  ];

  const handleManageUsersToggle = () => {
    setIsManageUsersExpanded(!isManageUsersExpanded);
  };

  const handleManageBusinessToggle = () => {
    setIsManageBusinessExpanded(!isManageBusinessExpanded);
  };

  const isManageUsersActive = location.pathname.startsWith("/manage-users");
  const isManageBusinessActive =
    location.pathname.startsWith("/catalogue") ||
    location.pathname.startsWith("/pos-select") ||
    location.pathname.startsWith("/sales-select");

  const handleMenuItemClick = () => {
    if (onClose) {
      onClose();
    }
  };

  const supportItems = [
    {
      label: "Reattempt Claim",
      icon: <Repeat className="w-5 h-5" />,
      external: false,
    },
    {
      label: "Discord",
      icon: <MessageSquare className="w-5 h-5" />,
      path: "https://discord.gg/wpBcy7Nw6w",
      external: true,
    },
  ];

  const importantLinks = [
    {
      label: "How to claim cashback?",
      icon: <HelpCircle className="w-5 h-5" />,
      path: "https://hive.blog/spendhbd/@thedistriator/how-to-claim-30-60-discount-rewards-on-your-hive-purchases-in-5-simple-steps",
    },
    {
      label: "List Business",
      icon: <Check className="w-5 h-5" />,
      path: "https://hive.blog/hive-106130/@thedistriator/how-to-list-a-business-on-distriator",
    },
    {
      label: "Blog",
      icon: <Newspaper className="w-5 h-5" />,
      path: "https://hive.blog/@thedistriator/posts",
    },
    {
      label: "Run Workshop",
      icon: <Hammer className="w-5 h-5" />,
      path: "https://hive.blog/hive-106130/@thedistriator/distriator-or-steps-to-run-a-successful-spendhbd-workshop",
    },
    {
      label: "Reward Structure",
      icon: <DollarSign className="w-5 h-5" />,
      path: "https://hive.blog/hive-106130/@thedistriator/distriator-consecutive-claim-rewards-commissions-and-leaderboards",
    },
    {
      label: "Become a Trusted Guide",
      icon: <UserPlus className="w-5 h-5" />,
      path: "https://hive.blog/hive-106130/@thedistriator/introducing-businesses-to-distriator-a-step-by-step-guide",
    },
    {
      label: "About",
      icon: <Info className="w-5 h-5" />,
      path: "https://hive.blog/hive-106130/@thedistriator/distriator-the-new-auto-cashback-reward-app-for-spending-in-bitcoin-lighting-and-hive-dollars",
    },
  ];

  const isSupportActive = location.pathname.startsWith("/support");

  useEffect(() => {
    const abortController = new AbortController();

    const checkUserBusinesses = async () => {
      try {
        const businesses = await fetchBusinessesApi(abortController.signal);
        const ownsBusiness = businesses.some(
          (business) => business.distriator?.owner === username
        );
        setUserOwnsBusiness(ownsBusiness);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          console.log("Request was aborted");
          return;
        }
        console.error("Failed to check user businesses", error);
      }
    };

    if (isAuthenticated) {
      checkUserBusinesses();
    }

    return () => {
      abortController.abort();
    };
  }, [isAuthenticated]);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed left-0 w-64 bg-background text-white border-r border-border z-50 transform transition-transform duration-300 ${
          isMobile 
            ? `top-[env(safe-area-inset-top,0px)] h-[calc(100%-env(safe-area-inset-top,0px))]` 
            : "top-0 h-full"
        } ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <img src="distriator_text_logo.png" alt="Distriator Logo" width={145} onClick={() => navigate("/")}/>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex flex-col h-[calc(100%-64px)] justify-between overflow-y-auto">
          <nav className="p-4 space-y-2">
            {/* Manage Business Section - groups business related routes */}
            {userOwnsBusiness && (
              <>
                <button
                  onClick={handleManageBusinessToggle}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isManageBusinessActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Package className="w-5 h-5" />
                    <span className="text-sm font-medium">Manage Business</span>
                  </div>
                  {isManageBusinessExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isManageBusinessExpanded && (
                  <div className="ml-4 space-y-1">
                    {manageBusinessItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === item.path
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleMenuItemClick}
                className={`flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {item.label === "Pending Cashback" &&
                  pendingReviewsCount > 0 && (
                    <span className="w-4 h-4 inline-flex items-center justify-center text-[9px] font-bold text-red-100 bg-red-600 rounded-full">
                      {pendingReviewsCount}
                    </span>
                  )}
              </Link>
            ))}

            {/* Wallet Section - Only show when logged in */}
            {isAuthenticated && walletItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleMenuItemClick}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {item.icon}
                <span className="text-sm font-medium">{item.label}</span>
                {item.label === "Cashback Status" && approvedCount > 0 && (
                  <span className="w-4 h-4 inline-flex items-start justify-center text-[9px] font-bold text-red-100 bg-red-600 rounded-full">
                    {approvedCount}
                  </span>
                )}
              </Link>
            ))}

            {/* Manage Users Section - Only show for admin/super users */}
            {hasManageUsersAccess && (
              <>
                <button
                  onClick={handleManageUsersToggle}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isManageUsersActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </div>
                  {isManageUsersExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Submenu items */}
                {isManageUsersExpanded && (
                  <div className="ml-4 space-y-1">
                    {manageUsersItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={handleMenuItemClick}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                          location.pathname === item.path
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-accent"
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm font-medium">
                          {item.label}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Support Section */}
            <button
              onClick={() => setIsSupportExpanded(!isSupportExpanded)}
              className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors ${
                isSupportActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-3">
                <LifeBuoy className="w-5 h-5" />
                <span className="text-sm font-medium">Support</span>
              </div>
              {isSupportExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isSupportExpanded && (
              <div className="ml-4 space-y-1">
                {supportItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.label}
                      href={item.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </a>
                  ) : (
                    <button
                      key={item.label}
                      onClick={() => setIsReattemptDialogOpen(true)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
                    >
                      {item.icon}
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Important Links Section */}
            <button
              onClick={() => setIsLinksExpanded(!isLinksExpanded)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
            >
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Important Links</span>
              </div>
              {isLinksExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {isLinksExpanded && (
              <div className="ml-4 space-y-1">
                {importantLinks.map((item) => (
                  <a
                    key={item.label}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-foreground hover:bg-accent"
                  >
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </a>
                ))}
              </div>
            )}
          </nav>

          {/* Footer with version + reload */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col items-center justify-between sticky bottom-0 bg-background">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              App Version {APP_VERSION}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400"> 
              Branch: {BRANCH_NAME}
              <br />
              Commit: {COMMIT_HASH}
            </div>
            <button
              onClick={handleReload}
              className="flex items-center space-x-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <MdRefresh className="w-4 h-4" />
              <span>Reload</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reattempt Claim Dialog */}
      <ReattemptClaimDialog
        isOpen={isReattemptDialogOpen}
        onClose={() => setIsReattemptDialogOpen(false)}
      />
    </>
  );
}
