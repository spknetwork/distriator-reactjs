import React from 'react';
import { X, MapPin } from 'lucide-react';

interface BusinessCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFullListing: () => void;
  onQuickListing: () => void;
  isQuickListingAllowed: boolean;
}

export const BusinessCreateDialog: React.FC<BusinessCreateDialogProps> = ({
  isOpen,
  onClose,
  onFullListing,
  // onQuickListing,
  // isQuickListingAllowed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add Business</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          {/* <div className="text-sm text-gray-600 mb-4">
            Choose how you'd like to add this business:
          </div> */}
          
          <button
            onClick={() => {
              onFullListing();
              onClose();
            }}
            className="w-full p-4 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-3"
          >
            <MapPin className="w-5 h-5" />
            <div className="text-left">
              <div className="font-semibold">Full Listing</div>
              <div className="text-sm opacity-90">Complete business profile with location</div>
            </div>
          </button>
          
          {/* {isQuickListingAllowed && (
            <button
              onClick={() => {
                onQuickListing();
                onClose();
              }}
              className="w-full p-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors flex items-center gap-3"
            >
              <Zap className="w-5 h-5" />
              <div className="text-left">
                <div className="font-semibold">Quick Add</div>
                <div className="text-sm opacity-90">Fast setup for trusted guides</div>
              </div>
            </button>
          )} */}
        </div>
      </div>
    </div>
  );
};