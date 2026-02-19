import type { FC } from "react";
import { useState, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useBusinesses } from "../hooks/useBusinesses";
import { useAuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { isMobilePlatform } from "../utils/platform-detection";

const getBannerStorageKey = (username: string) => `isShowBanner_${username}`;

const AppWideBanner: FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const isMobile = isMobilePlatform();
  const { businesses } = useBusinesses();
  const { currentUser } = useAuthContext();

  const hiddenForever =
    typeof localStorage !== "undefined" &&
    !!currentUser &&
    localStorage.getItem(getBannerStorageKey(currentUser.username)) === "true";

  const userOwnedBusinesses = useMemo(
    () =>
      businesses.filter(
        (business) =>
          currentUser &&
          business.distriator.owner === currentUser.username &&
          !business.distriator.verification?.hivePost
      ),
    [businesses, currentUser]
  );

  const userIsGuideFor = useMemo(
    () =>
      businesses.filter(
        (business) =>
          business.distriator.guides?.some(
            (guide) => guide.name === currentUser?.username
          ) && !business.distriator.verification?.hivePost
      ),
    [businesses, currentUser]
  );

  const hasRelevantRole = userOwnedBusinesses.length > 0 || userIsGuideFor.length > 0;

  if (!currentUser || hiddenForever || !hasRelevantRole || dismissed) return null;

  const ownerMessage =
    userOwnedBusinesses.length > 0
      ? `${userOwnedBusinesses
          .map((b) => `"${b.profile.displayName}"`)
          .join(", ")} ${userOwnedBusinesses.length > 1 ? "are" : "is"} required to submit business onboarding post. Please contact trusted business guides to submit business verification onboarding post.`
      : null;

  const guideMessage =
    userIsGuideFor.length > 0
      ? "Please update business onboarding verification posts for one or many businesses."
      : null;

  const subtitle =
    userOwnedBusinesses.length > 0
      ? `Allow my business ${userOwnedBusinesses[0].profile.displayName} to expire`
      : null;

  const handleHideForever = () => {
    if (typeof localStorage !== "undefined" && currentUser) {
      localStorage.setItem(getBannerStorageKey(currentUser.username), "true");
    }
    setShowActionsModal(false);
    setDismissed(true);
  };

  const handleHideForNow = () => {
    setShowActionsModal(false);
    setDismissed(true);
  };

  return (
    <>
      <div
        className={
          isMobile
            ? "pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex justify-center p-2"
            : "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 py-3"
        }
      >
        <div className="pointer-events-auto flex w-full max-w-4xl items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-2 text-sm text-amber-900 shadow-lg backdrop-blur dark:border-amber-800 dark:bg-amber-900/70 dark:text-amber-100">
          <AlertTriangle
            aria-hidden="true"
            className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-200"
          />
          {ownerMessage || guideMessage ? (
            <div className="flex-1 text-center font-medium leading-snug sm:text-left">
              {ownerMessage && <div>{ownerMessage}</div>}
              {guideMessage && <div>{guideMessage}</div>}
            </div>
          ) : (
            <span className="flex-1 text-center font-medium leading-snug sm:text-left">
              All businesses are required to submit business onboarding post.
            </span>
          )}
          <button
            type="button"
            aria-label="Open actions"
            className="rounded-md border border-amber-700 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:border-amber-600 dark:bg-amber-800/60 dark:text-amber-100 dark:hover:bg-amber-800"
            onClick={() => setShowActionsModal(true)}
          >
            Actions
          </button>
        </div>
      </div>

      {showActionsModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="banner-modal-title"
          aria-describedby="banner-modal-subtitle"
        >
          <div className="w-full max-w-md rounded-xl border border-gray-700 bg-[#1a1a1a] p-6 shadow-xl">
            <h2
              id="banner-modal-title"
              className="text-center text-lg font-semibold text-white"
            >
              {guideMessage ??
                "All businesses are required to submit business onboarding post."}
            </h2>
            {userIsGuideFor.length > 0 && (
              <div
                id="banner-modal-subtitle"
                className="mt-4 max-h-64 space-y-3 overflow-y-auto"
              >
                {userIsGuideFor.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-[#262626] px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {b.profile.displayImage && (
                        <img
                          src={b.profile.displayImage}
                          alt={b.profile.displayName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm font-medium text-white">
                        {b.profile.displayName}
                      </span>
                    </div>
                    <Link
                      to={`/business/${b.profile.displayName}/onboarding-post`}
                      className="rounded-md bg-[#6366f1] px-3 py-1 text-xs font-semibold text-white transition hover:bg-[#5558e3]"
                      onClick={() => setShowActionsModal(false)}
                    >
                      Verify
                    </Link>
                  </div>
                ))}
              </div>
            )}
            {subtitle && (
              <p className="mt-3 text-center text-sm font-medium leading-snug text-white/90">
                {subtitle}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                className="w-full rounded-lg bg-[#6366f1] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#5558e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6366f1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                onClick={handleHideForever}
              >
                Hide Forever
              </button>
              <button
                type="button"
                className="w-full rounded-lg border border-gray-500 bg-transparent px-4 py-3 text-sm font-medium text-white transition hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a1a1a]"
                onClick={handleHideForNow}
              >
                Hide for Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppWideBanner;
