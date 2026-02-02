/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { BusinessFormField } from "./BusinessFormField";
import type { BusinessFormData } from "../../../types/business-form-data";

interface BusinessFormStep6Props {
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

export function BusinessFormStep6({ formData, updateFormData, onValidationChange, onNext, onPrevious, isLoading, isFirstStep , canProceed }: BusinessFormStep6Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateStep();
  }, [formData.verificationHivePost, formData.verificationFacebook, formData.verificationInstagram, formData.verificationTwitter, formData.verificationLinkedIn, formData.verificationOtherSocial]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    // Example: require at least one verification link
    if (!formData.verificationHivePost && !formData.verificationFacebook && !formData.verificationInstagram && !formData.verificationTwitter && !formData.verificationLinkedIn && !formData.verificationOtherSocial) {
      newErrors.verification = "At least one verification link is required";
    }
    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Verification Links</h2>
      <p className="text-muted-foreground mb-4">
        Please provide verification links to social media posts introducing your business.
      </p>

      {/* Hive Post */}
      <BusinessFormField
        label="Verification - Link to Hive Post"
        value={formData.verificationHivePost}
        onChange={(value) => updateFormData("verificationHivePost", value)}
        placeholder="Enter link of introduction post on Hive"
        type="url"
        error={errors.verification}
      />

      {/* Facebook Post */}
      <BusinessFormField
        label="Verification - Link to Facebook Post"
        value={formData.verificationFacebook}
        onChange={(value) => updateFormData("verificationFacebook", value)}
        placeholder="Enter link of introduction post on Facebook"
        type="url"
        error={errors.verification}
      />

      {/* Instagram Post */}
      <BusinessFormField
        label="Verification - Link to Instagram Post"
        value={formData.verificationInstagram}
        onChange={(value) => updateFormData("verificationInstagram", value)}
        placeholder="Enter link of introduction post on Instagram"
        type="url"
        error={errors.verification}
      />

      {/* Twitter Post */}
      <BusinessFormField
        label="Verification - Link to Twitter Post"
        value={formData.verificationTwitter}
        onChange={(value) => updateFormData("verificationTwitter", value)}
        placeholder="Enter link of introduction post on Twitter"
        type="url"
        error={errors.verification}
      />

      {/* LinkedIn Post */}
      <BusinessFormField
        label="Verification - Link to LinkedIn Post"
        value={formData.verificationLinkedIn}
        onChange={(value) => updateFormData("verificationLinkedIn", value)}
        placeholder="Enter link of introduction post on LinkedIn"
        type="url"
        error={errors.verification}
      />

      {/* Other Social Post */}
      <BusinessFormField
        label="Verification - Link to Any Other Social Post"
        value={formData.verificationOtherSocial}
        onChange={(value) => updateFormData("verificationOtherSocial", value)}
        placeholder="Enter link of introduction post on any other social media platform"
        type="url"
        error={errors.verification}
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
            "Next"
          )}
        </button>
      </div>
    </div>
  );
}