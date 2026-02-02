/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { BusinessFormField } from "./BusinessFormField";
import { BusinessDropdown } from "./BusinessDropdown";
import { COUNTRIES } from "../../UserManagement/CountriesDropdown";
import type { BusinessFormData } from "../../../types/business-form-data";

interface BusinessFormStep4Props {
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

export function BusinessFormStep4({ formData, updateFormData, onValidationChange, onNext, onPrevious, isLoading, isFirstStep, isLastStep, canProceed }: BusinessFormStep4Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    validateStep();
  }, [formData.address1, formData.country, formData.city, formData.state, formData.latitude, formData.longitude]);

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.address1.trim()) {
      newErrors.address1 = "Address is required";
    }

    if (!formData.country) {
      newErrors.country = "Country is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.latitude.trim()) {
      newErrors.latitude = "Latitude is required";
    } else {
      const lat = parseFloat(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = "Invalid latitude (-90 to 90)";
      }
    }

    if (!formData.longitude.trim()) {
      newErrors.longitude = "Longitude is required";
    } else {
      const lng = parseFloat(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = "Invalid longitude (-180 to 180)";
      }
    }

    setErrors(newErrors);
    onValidationChange(Object.keys(newErrors).length === 0);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground mb-6">Location Details</h2>

      {/* Address One */}
      <BusinessFormField
        label="Address One"
        value={formData.address1}
        onChange={(value) => updateFormData("address1", value)}
        placeholder="Enter address"
        required
        error={errors.address1}
      />

      {/* Address Two */}
      <BusinessFormField
        label="Address Two"
        value={formData.address2}
        onChange={(value) => updateFormData("address2", value)}
        placeholder="Enter address"
      />

      {/* Country and City Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BusinessDropdown
          label="Country"
          value={formData.country}
          onChange={(value) => updateFormData("country", value)}
          options={COUNTRIES}
          placeholder="Select the country"
          required
          error={errors.country}
        />

        <BusinessFormField
          label="City"
          value={formData.city}
          onChange={(value) => updateFormData("city", value)}
          placeholder="Enter the city"
          required
          error={errors.city}
        />
      </div>

      {/* State */}
      <BusinessFormField
        label="State"
        value={formData.state}
        onChange={(value) => updateFormData("state", value)}
        placeholder="Enter the state"
        required
        error={errors.state}
      />

      {/* Latitude and Longitude Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BusinessFormField
          label="Latitude"
          value={formData.latitude}
          onChange={(value) => updateFormData("latitude", value)}
          placeholder="Enter the latitude"
          type="number"
          required
          error={errors.latitude}
        />

        <BusinessFormField
          label="Longitude"
          value={formData.longitude}
          onChange={(value) => updateFormData("longitude", value)}
          placeholder="Enter the longitude"
          type="number"
          required
          error={errors.longitude}
        />
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