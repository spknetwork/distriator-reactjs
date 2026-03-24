import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface BusinessConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  isQuickAdd: boolean;
}

export const BusinessConfirmationDialog: React.FC<BusinessConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  isQuickAdd
}) => {
  const [countdown, setCountdown] = useState(5);
  const [canConfirm, setCanConfirm] = useState(false);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      setCanConfirm(false);
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanConfirm(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmationText = `I hereby confirm, as a trusted guide, that this business is a legitimate business and that the business's Hive account is owned by the business owner and I shall provide verification evidence if requested in a timely manner.${
    isQuickAdd 
      ? " I shall also complete the business's profile within 2 weeks of this listing. Should the business profile not be completed within 2 weeks of this listing, there is a risk of the business being de-listed from the Distriator cashback program."
      : ""
  }`;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border shrink-0">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Verification Confirmation
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <p className="text-sm text-foreground mb-6 leading-relaxed">
            {confirmationText}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {countdown > 0 && (
                <div className="flex items-center justify-center w-8 h-8 bg-primary text-white rounded-full text-sm font-semibold">
                  {countdown}
                </div>
              )}
            </div>
            
            <button
              onClick={onConfirm}
              disabled={!canConfirm || isLoading}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Saving...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};