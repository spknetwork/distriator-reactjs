import type { UserClaimResponseBiweeklyDTO } from "../types/claim";
import { useBusinesses } from "../hooks/useBusinesses";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useAuthData } from "../utils/auth-utils";

dayjs.extend(relativeTime);

const ThisMonthClaims = ({
    monthly,
}: {
    monthly?: UserClaimResponseBiweeklyDTO[];
}) => {
    const { businesses } = useBusinesses();
    const { username } = useAuthData();

    const getBusinessImage = (username: string) => {
        const filteredItems = businesses.filter(
            (b) => b.distriator?.owner === username
        );
        if (filteredItems.length > 0) {
            return (
                `https://images.hive.blog/320x0/${filteredItems[0].profile?.displayImage }`||
                "https://images.hive.blog/u/null/avatar"
            );
        } else {
            return "https://images.hive.blog/u/null/avatar";
        }
    };

    const getBusinessDisplayName = (username: string) => {
        const filteredItems = businesses.filter(
            (b) => b.distriator?.owner === username
        );
        if (filteredItems.length > 0) {
            return (
                filteredItems[0].profile?.displayName ||
                "Cafe Coffee Jitters"
            );
        } else {
            return "Cafe Coffee Jitters";
        }
    };

    return (
        <ul className="bg-background text-foreground rounded-box shadow-md max-w-xl mx-auto">
            <li className="p-3 text-xs opacity-60 tracking-wide">
                Your claims from this month
            </li>
            {monthly?.map((claim, index) => (
                <li
                    key={index}
                    onClick={() => window.open(`https://hive.blog/@${username}/${claim.permlink}`, "_blank")}
                    className="flex gap-3 items-start py-3 border-b last:border-0 cursor-pointer sm:hover:bg-gray-600 transition"
                >
                    {/* Profile Pic */}
                    <img
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0"
                        src={getBusinessImage(claim.business)}
                        alt="Business Profile"
                    />

                    {/* Text */}
                    <div className="flex flex-col text-xs sm:text-sm leading-snug sm:leading-relaxed">
                        <p className="break-words">
                            Claimed cashback of{" "}
                            <span className="font-semibold">{claim.claimValue}</span>{" "}
                            {dayjs(claim.timestamp + 'Z').fromNow()}
                        </p>
                        <p className="text-muted-foreground break-words">
                            for payment made at{" "}
                            <span className="font-medium">
                                {getBusinessDisplayName(claim.business)}
                            </span>{" "}
                            of {" "}
                            <span className="font-mono">{claim.amount}</span>
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
};

export default ThisMonthClaims;
