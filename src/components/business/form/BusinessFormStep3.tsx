/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { BusinessFormField } from "./BusinessFormField";
import type { BusinessFormData } from "../../../types/business-form-data";

interface BusinessFormStep3Props {
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

export function BusinessFormStep3({ formData, updateFormData, onValidationChange, onNext, onPrevious, isLoading, isFirstStep, isLastStep, canProceed }: BusinessFormStep3Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateStep();
  }, [formData.description, formData.workTime]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Description & Hours</h2>

      {/* Description */}
      <BusinessFormField
        label="Description"
        value={formData.description}
        onChange={(value) => updateFormData("description", value)}
        placeholder="Enter the description"
        multiline
        error={errors.description}
      />

      {/* Work Time */}
      <BusinessFormField
        label="Work Timings"
        value={formData.workTime}
        onChange={(value) => updateFormData("workTime", value)}
        placeholder="Enter business available timings"
        multiline
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