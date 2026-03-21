/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { BusinessFormField } from "./BusinessFormField";
import { ImageUploadPreview } from "./ImageUploadPreview";
import type { BusinessFormData } from "../../../types/business-form-data";
import { useBusinessTypesStore } from "../../../stores/businessTypesStore";
import { BusinessDropdown } from "./BusinessDropdown";
import { stripHiveImageProxy } from "../../../utils/image-url";

interface BusinessFormStep1Props {
  formData: any;
  updateFormData: (field: keyof BusinessFormData, value: any) => void;
  onValidationChange: (isValid: boolean) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  canProceed: boolean;
}

export function BusinessFormStep1({ formData, updateFormData, onValidationChange, onNext, onPrevious, isLoading, isFirstStep, isLastStep, canProceed }: BusinessFormStep1Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { businessTypes, fetchBusinessTypes } = useBusinessTypesStore();

  useEffect(() => {
    fetchBusinessTypes();
  }, []);

  const typeOptions = Object.keys(businessTypes);
  const subtypeOptions = formData.business_type ? (businessTypes[formData.business_type] || []) : [];

  useEffect(() => {
    validateStep();
  }, [formData.displayName, formData.business_type, formData.business_subtype, businessTypes]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }
    if (!formData.business_type) {
      newErrors.business_type = "Business type is required";
    } else if (!typeOptions.includes(formData.business_type)) {
      newErrors.business_type = "Please select a business type from the list";
    }
    if (!formData.business_subtype) {
      newErrors.business_subtype = "Business subtype is required";
    } else if (!subtypeOptions.includes(formData.business_subtype)) {
      newErrors.business_subtype = "Please select a business subtype from the list";
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    onValidationChange(isValid);
  };

  const handleBusinessTypeChange = (value: string) => {
    updateFormData("business_type", value);
    updateFormData("business_subtype", ""); // Reset subtype when type changes
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Basic Information</h2>

      <ImageUploadPreview
        title="Display Image"
        isSingle={true}
        images={formData.displayImage ? [stripHiveImageProxy(formData.displayImage)] : []}
        onChanged={(images) => updateFormData("displayImage", images[0] || "")}
      />

      <ImageUploadPreview
        title="Business Images"
        isSingle={false}
        images={formData.images.map((img: string) => stripHiveImageProxy(img))}
        onChanged={(images) => updateFormData("images", images)}
      />

      <BusinessFormField
        label="Display Name"
        value={formData.displayName}
        onChange={(value) => updateFormData("displayName", value)}
        placeholder="Enter business display name"
        required
        error={errors.displayName}
      />

      <BusinessDropdown
        label="Business Type"
        value={typeOptions.includes(formData.business_type) ? formData.business_type : ""}
        onChange={handleBusinessTypeChange}
        options={typeOptions}
        placeholder="Select business type"
        required
        error={errors.business_type}
      />

      <BusinessDropdown
        label="Business Subtype"
        value={subtypeOptions.includes(formData.business_subtype) ? formData.business_subtype : ""}
        onChange={(value) => updateFormData("business_subtype", value)}
        options={subtypeOptions}
        placeholder="Select business subtype"
        required
        error={errors.business_subtype}
      />

      <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border border-border">
        <input
          type="checkbox"
          id="isOnline"
          checked={formData.isOnline}
          onChange={(e) => updateFormData("isOnline", e.target.checked)}
          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
        />
        <label htmlFor="isOnline" className="text-sm font-medium text-foreground">
          eCommerce business
        </label>
      </div>

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