import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Loader2 } from "lucide-react";
import { ApiService } from "../services/api";
import { useAuthData } from '../utils/auth-utils';

interface AuthorPermlink {
  author: string;
  permlink: string;
}

export default function ReattemptClaimDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthData();

  // Extract @author/permlink
  const extractAuthorPermlink = (text: string): AuthorPermlink | null => {
    const regex = /@([^/]+)\/([^/]+)/;
    const match = regex.exec(text.trim());
    if (match) {
      return { author: match[1], permlink: match[2] };
    }
    return null;
  };

  const handleSubmit = async () => {
    const parsed = extractAuthorPermlink(input);
    if (!parsed) {
      setError("Input should contain @author/permlink");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await ApiService.reattemptClaim(
        token!,
        parsed.author,
        parsed.permlink
      );

      if (result) {
        alert("Claimed successfully ✅");
      } else {
        alert("Claim failed ❌");
      }
      onClose();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Modal panel */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-gray-900 p-6 shadow-2xl border border-gray-800">
          <Dialog.Title className="text-lg font-semibold text-white">
            Check Link
          </Dialog.Title>

          <div className="mt-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Full url or @author/permlink"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 p-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-600"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
