import type { FC } from "react";
import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useBusinesses } from "../hooks/useBusinesses";
import { useAuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { isMobilePlatform } from "../utils/platform-detection";

const AppWideBanner: FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isMobile = isMobilePlatform();
  const { businesses } = useBusinesses();
  const { currentUser } = useAuthContext();

  if (dismissed || !currentUser) return null;

  const userOwnedBusinesses = businesses.filter(
    (business) =>
      business.distriator.owner === currentUser.username &&
      !business.distriator.verification?.hivePost
  );
  console.log(userOwnedBusinesses);

  const userIsGuideFor = businesses.filter(
    (business) =>
      business.distriator.guides?.some(
        (guide) => guide.name === currentUser.username
      ) && !business.distriator.verification?.hivePost
  );
  console.log(userIsGuideFor);

  const ownerMessage =
    userOwnedBusinesses.length > 0
      ? `${userOwnedBusinesses
        .map((b) => `"${b.profile.displayName}"`)
        .join(", ")} ${userOwnedBusinesses.length > 1 ? "are" : "is"
      } required to submit business onboarding post. Please contact trusted business guides to submit business verification onboarding post.`
      : null;

  const guideMessage =
    userIsGuideFor.length > 0 ? (
      <>
        {userIsGuideFor.map((b, index) => (
          <span key={b.id}>
            <Link
              to={`/business/${b.profile.displayName}/onboarding-post`}
              className="font-bold underline"
            >
              "{b.profile.displayName}"
            </Link>
            {index < userIsGuideFor.length - 1 && ", "}
          </span>
        ))}{" "}
        {userIsGuideFor.length > 1 ? "are" : "is"} required to submit business
        onboarding post.
      </>
    ) : null;

  return (
    <div className={isMobile ? "pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-50 flex justify-center p-2" : "pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 py-3"} >
      <div className="pointer-events-auto flex w-full max-w-4xl items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-2 text-sm text-amber-900 shadow-lg backdrop-blur dark:border-amber-800 dark:bg-amber-900/70 dark:text-amber-100">
        <AlertTriangle
          aria-hidden="true"
          className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-200"
        />
        {(ownerMessage || guideMessage)?
        <div className="flex-1 text-center font-medium leading-snug sm:text-left">
          {ownerMessage && <div>{ownerMessage}</div>}
          {guideMessage && <div>{guideMessage}</div>}
        </div>
        : (
          <span className="flex-1 text-center font-medium leading-snug sm:text-left">
            All businesses are required to submit business onboarding post.
          </span>
        )}
        <button
          type="button"
          aria-label="Dismiss announcement"
          className="rounded p-1 text-amber-900/80 transition hover:bg-amber-100 hover:text-amber-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:text-amber-50/80 dark:hover:bg-amber-800/60 dark:hover:text-amber-50 dark:focus-visible:ring-amber-600"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default AppWideBanner;

