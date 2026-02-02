import { type AccountHistoryModel } from "../../types/account-history";
import { getBusinessName, extractLink } from "../../utils/claim-memo-parser";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import type { BusinessModel } from "../../types/business";
import { useState } from "react";

interface TransferHistoryItemProps {
  item: AccountHistoryModel;
  businesses: BusinessModel[];
}

export const TransferHistoryItem = ({
  item,
  businesses,
}: TransferHistoryItemProps) => {
  const op = item.op[1];
  const memo = op.memo || "";
  const to = op.to || "";
  const amount = op.amount || "";

  const businessName = getBusinessName(memo);
  const link = extractLink(memo);
  const timeAgo = formatDistanceToNow(new Date(item.timestamp + "Z"), {
    addSuffix: true,
  });
  const biz = businesses.find((b) => b.profile.displayName === businessName);
  const [imgError, setImgError] = useState(false);

  const handleItemClick = () => {
    if (link) {
      window.open(link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      className={`p-2 border-b border-gray-700 hover:bg-gray-800 transition ${
        link ? "cursor-pointer" : ""
      }`}
      onClick={handleItemClick}
    >
      <div className="flex items-center gap-3">
        {/* User Avatar - Free space */}
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-800 flex-shrink-0 mr-2">
          <Avatar>
            <AvatarImage
              src={`https://images.hive.blog/u/${to}/avatar`}
              alt={`${to}'s avatar`}
              className="h-10 w-10 rounded-full border-2 border-gray-700"
            />
            <AvatarFallback className="h-10 w-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-lg">
              {to.substring(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Sentence and "time ago" split */}
        <div
          className="flex flex-col flex-grow text-left leading-snug text-sm break-words"
          style={{
            maxWidth: "calc(100% - 120px)",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "normal",
            display: "block",
          }}
        >
          {/* Main sentence */}
          <span>
            <span className="font-bold text-white">{to}</span> claimed{" "}
            <span className="font-bold text-green-400">{amount}</span> on{" "}
            <span className="font-bold">{businessName}</span>
          </span>
          {/* Time ago always on new line */}
          <span className="block text-xs text-gray-400 mt-1">{timeAgo}</span>
        </div>

        {/* Business Profile Avatar - Matching space */}
        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-800 flex-shrink-0 ml-2">
          {biz?.profile?.displayImage && !imgError ? (
            <img
              src={biz.profile.displayImage}
              alt={biz.profile.displayName}
              className="w-10 h-10 rounded-md object-cover border-2 border-gray-700"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-10 h-10 rounded-md bg-gray-600 flex items-center justify-center text-white text-lg">
              {businessName?.substring(0, 1)?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
