/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { BusinessFormField } from "./BusinessFormField";
import type { BusinessFormData } from "../../../types/business-form-data";

interface BusinessFormStep5Props {
  formData: BusinessFormData;
  updateFormData: (field: keyof BusinessFormData, value: any) => void;
  onValidationChange: (isValid: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
}

export function BusinessFormStep5({ formData, updateFormData, onValidationChange, onNext, onPrevious, isLoading, isFirstStep, isLastStep, canProceed }: BusinessFormStep5Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateStep();
  }, [formData.phoneNumber, formData.email]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>

      {/* Phone Number */}
      <BusinessFormField
        label="Phone Number"
        value={formData.phoneNumber}
        onChange={(value) => updateFormData("phoneNumber", value)}
        placeholder="Enter the phone number"
        type="tel"
      />

      {/* Email */}
      <BusinessFormField
        label="Email"
        value={formData.email}
        onChange={(value) => updateFormData("email", value)}
        placeholder="Enter the email"
        type="email"
      />

      {/* Website */}
      <BusinessFormField
        label="Website"
        value={formData.website}
        onChange={(value) => updateFormData("website", value)}
        placeholder="Enter website URL"
        type="url"
      />

      {/* Instagram */}
      <BusinessFormField
        label="Instagram"
        value={formData.instagram}
        onChange={(value) => updateFormData("instagram", value)}
        placeholder="Enter Instagram profile URL"
        type="url"
      />

      {/* Facebook */}
      <BusinessFormField
        label="Facebook"
        value={formData.facebook}
        onChange={(value) => updateFormData("facebook", value)}
        placeholder="Enter Facebook profile URL"
        type="url"
      />

      {/* Twitter */}
      <BusinessFormField
        label="Twitter"
        value={formData.twitter}
        onChange={(value) => updateFormData("twitter", value)}
        placeholder="Enter Twitter profile URL"
        type="url"
      />

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