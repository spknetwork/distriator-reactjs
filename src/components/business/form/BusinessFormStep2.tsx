/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { BusinessFormField } from "./BusinessFormField";
import { BusinessDropdown } from "./BusinessDropdown";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { BusinessGuideEditor } from "./BusinessGuideEditor";
import type { BusinessFormData } from "../../../types/business-form-data";

const BUSINESS_STATUS_OPTIONS = ["whitelisted", "listed", "underInvestigation"];
const PAYMENT_METHOD_OPTIONS = ["HBD", "Sats", "Lightning", "Bitcoin"];

interface BusinessFormStep2Props {
  formData: BusinessFormData;
  updateFormData: (field: keyof BusinessFormData, value: any) => void;
  isEdit: boolean;
  isAdmin: boolean;
  isGuide: boolean;
  isGuideOfBusiness: boolean;
  isGuideOfBusinessEditing: boolean;
  onValidationChange: (isValid: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
}

export function BusinessFormStep2({
  formData,
  updateFormData,
  isEdit,
  isAdmin,
  isGuide,
  isGuideOfBusiness,
  isGuideOfBusinessEditing,
  onValidationChange,
  onNext,
  onPrevious,
  isLoading,
  isFirstStep,
  isLastStep,
  canProceed,
}: BusinessFormStep2Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const showSecondPageFields = () => {
    return (
      (isEdit && isAdmin) ||
      (!isEdit && (isAdmin || isGuideOfBusiness)) ||
      isGuideOfBusinessEditing
    );
  };

  useEffect(() => {
    validateStep();
  }, [formData.hiveUsername, formData.businessStatus, formData.paymentMethods]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if ((!isEdit && isGuide) || showSecondPageFields()) {
      if (!formData.hiveUsername.trim()) {
        newErrors.hiveUsername = "Hive username is required";
      }

      if (showSecondPageFields() && (isAdmin || isGuideOfBusinessEditing)) {
        if (!formData.businessStatus) {
          newErrors.businessStatus = "Business status is required";
        }
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  };

  const handleHiveUsernameChange = (value: string) => {
    updateFormData("hiveUsername", value);

    // Auto-set defaults when username is entered
    if (!isEdit && value.trim() && (isAdmin || isGuide)) {
      if (!formData.businessStatus) {
        updateFormData("businessStatus", "whitelisted");
      }

      if (formData.paymentMethods.length === 0) {
        updateFormData("paymentMethods", ["HBD", "Sats"]);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        Business Details
      </h2>

      {/* Hive Username */}
      {((!isEdit && isGuide) ||
        (showSecondPageFields() && (isAdmin || isGuideOfBusiness))) && (
          <BusinessFormField
            label="Hive Username"
            value={formData.hiveUsername}
            onChange={handleHiveUsernameChange}
            placeholder="Enter the hive username"
            required
            error={errors.hiveUsername}
            prefix={
              <div className="w-8 h-8 rounded-full overflow-hidden">
                {formData.hiveUsername ? (
                  <img
                    src={`https://images.hive.blog/u/${formData.hiveUsername}/avatar`}
                    alt="User avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://images.hive.blog/u/null/avatar`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            }
          />
        )}

      {/* Business Status */}
      {showSecondPageFields() && (isAdmin || isGuideOfBusinessEditing) && (
        <BusinessDropdown
          label="Status"
          value={formData.businessStatus}
          onChange={(value) => updateFormData("businessStatus", value)}
          options={BUSINESS_STATUS_OPTIONS}
          placeholder="Select status"
          required
          error={errors.businessStatus}
        />
      )}

      {/* Payment Methods */}
      {showSecondPageFields() && (
        <PaymentMethodSelector
          label="Payment Methods"
          value={formData.paymentMethods}
          onChange={(value) => updateFormData("paymentMethods", value)}
          options={PAYMENT_METHOD_OPTIONS}
          required
        />
      )}

      {/* Trusted Guides */}
      {showSecondPageFields() && (isAdmin || !isEdit) && (
        <BusinessGuideEditor
          label="Trusted Guides"
          guides={formData.guides}
          onChange={(guides) => updateFormData("guides", guides)}
          required
        />
      )}

      {/* Spend HBD URL */}
      {showSecondPageFields() && (
        <BusinessFormField
          label="Spend HBD URL"
          value={formData.spendHbdUrl}
          onChange={(value) => updateFormData("spendHbdUrl", value)}
          placeholder="Enter spend HBD URL"
          type="url"
        />
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-4 mt-8">
        {!isFirstStep && (
          <button
            onClick={onPrevious}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            Previous
          </button>
        )}
        <button
          onClick={onNext}
          disabled={isLoading || Object.keys(errors).length > 0 || !canProceed}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            isLastStep ? "Save" : "Next"
          )}
        </button>
      </div>
    </div>
  );
}
