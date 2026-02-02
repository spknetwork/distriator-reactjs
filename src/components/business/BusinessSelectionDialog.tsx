import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Search } from "lucide-react";
import type { BusinessModel } from "../../types/business";

interface BusinessSelectionDialogProps {
  businesses: BusinessModel[];
  onClose: () => void;
}

export function BusinessSelectionDialog({
  businesses,
  onClose,
}: BusinessSelectionDialogProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinesses = businesses.filter((business) =>
    business.profile.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (business.distriator.owner?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleBusinessSelect = (business: BusinessModel) => {
    onClose();
    navigate(`/checkout/${business.id}`, {
      state: {
        businessId: business.id,
        businessName: business.profile.displayName,
        businessImage: business.profile.displayImage,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            Select Business
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredBusinesses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchQuery ? "No businesses match your search" : "No businesses found"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBusinesses.map((business) => (
                  <button
                    key={business.id}
                    onClick={() => handleBusinessSelect(business)}
                    className="w-full p-4 bg-card hover:bg-card/80 border border-border rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={
                          business.profile.displayImage
                            ? `https://images.hive.blog/320x0/${business.profile.displayImage}`
                            : "https://images.hive.blog/u/null/avatar"
                        }
                        alt={business.profile.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {business.profile.displayName}
                        </h3>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}