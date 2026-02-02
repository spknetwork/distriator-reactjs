/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useBusinesses } from "../../../hooks/useBusinesses";
import { BusinessConfirmationDialog } from "./BusinessConfirmationDialogue";
import { BusinessFormStep1 } from "./BusinessFormStep1";
import { BusinessFormStep2 } from "./BusinessFormStep2";
import { BusinessFormStep3 } from "./BusinessFormStep3";
import { BusinessFormStep4 } from "./BusinessFormStep4";
import { BusinessFormStep5 } from "./BusinessFormStep5";
import { BusinessFormStep6 } from "./BusinessFormStep6";
import type { BusinessModel } from "../../../types/business";
import { RoleType } from "../../../types/role";
import React from "react";
import { useAuthData } from '../../../utils/auth-utils';
import { BusinessFormStep7Onboarding } from "./BusinessFormStep7Onboarding";
import type { BusinessFormData } from "../../../types/business-form-data";


const initialFormData: BusinessFormData = {
  displayName: "",
  businessType: "",
  business_type: "",
  business_subtype: "",
  isOnline: false,
  displayImage: "",
  images: [],
  hiveUsername: "",
  businessStatus: "",
  paymentMethods: [],
  guides: [],
  spendHbdUrl: "",
  description: "",
  workTime: "",
  address1: "",
  address2: "",
  country: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  phoneNumber: "",
  email: "",
  instagram: "",
  facebook: "",
  twitter: "",
  website: "",
  verificationHivePost: "",
  verificationFacebook: "",
  verificationInstagram: "",
  verificationTwitter: "",
  verificationLinkedIn: "",
  verificationOtherSocial: "",
};

export default function BusinessFormView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateBusiness } = useBusinesses();

  const { type: userRole, username } = useAuthData();

  // Check if this is edit mode
  const businessToEdit = location.state?.business as BusinessModel | undefined;
  const isEdit = !!businessToEdit;

  // Check permissions
  let isAdmin = userRole === RoleType.ADMIN || userRole === RoleType.SUPER;
      if (isEdit &&
        (businessToEdit?.distriator.creator == username &&
            userRole == RoleType.GUIDE)) {
      isAdmin = true;
    }
  const isGuide = userRole === RoleType.GUIDE;
  const isGuideOfBusiness = businessToEdit?.distriator.guides?.some(g => g.name === username) || (businessToEdit?.distriator.owner === username) || false;
  const isGuideOfBusinessEditing = isEdit && isGuideOfBusiness;
  const contactVisibility = !isEdit || (isAdmin || username === businessToEdit?.distriator.owner || isGuideOfBusiness);

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stepValidation, setStepValidation] = useState<boolean[]>([]);

  // Initialize form data
  useEffect(() => {
    if (isEdit && businessToEdit) {
      setInitialDataForEdit();
    } else {
      setInitialDataForCreate();
    }
  }, [isEdit, businessToEdit]);

  const setInitialDataForEdit = () => {
    if (!businessToEdit) return;

    const newFormData: BusinessFormData = {
      displayName: businessToEdit.profile.displayName,
      businessType: businessToEdit.profile.businessType || businessToEdit.profile.business_type || "",
      business_type: businessToEdit.profile.business_type || "",
      business_subtype: businessToEdit.profile.business_subtype || "",
      isOnline: businessToEdit.profile.isOnline || false,
      displayImage: businessToEdit.profile.displayImage || "",
      images: businessToEdit.profile.images || [],
      hiveUsername: businessToEdit.distriator.owner || "",
      businessStatus: businessToEdit.distriator.subscriptionStatus || "",
      paymentMethods: businessToEdit.distriator.paymentMethods || [],
      guides: businessToEdit.distriator.guides || [],
      spendHbdUrl: businessToEdit.distriator.spendHbdLink || "",
      description: businessToEdit.contact?.notes || "",
      workTime: businessToEdit.profile.workTime || "",
      address1: businessToEdit.location.address.address1 || "",
      address2: businessToEdit.location.address.address2 || "",
      country: businessToEdit.location.address.country,
      city: businessToEdit.location.address.city,
      state: businessToEdit.location.address.state || "",
      latitude: businessToEdit.location.pin?.latitude?.toString() || "",
      longitude: businessToEdit.location.pin?.longitude?.toString() || "",
      phoneNumber: businessToEdit.contact?.phone || "",
      email: businessToEdit.contact?.email || "",
      instagram: businessToEdit.contact?.instagram || "",
      facebook: businessToEdit.contact?.facebook || "",
      twitter: businessToEdit.contact?.twitter || "",
      website: businessToEdit.contact?.website || "",
      verificationHivePost: businessToEdit.distriator.verification?.hivePost || "",
      verificationFacebook: businessToEdit.distriator.verification?.facebook || "",
      verificationInstagram: businessToEdit.distriator.verification?.instagram || "",
      verificationTwitter: businessToEdit.distriator.verification?.twitter || "",
      verificationLinkedIn: businessToEdit.distriator.verification?.linkedin || "",
      verificationOtherSocial: businessToEdit.distriator.verification?.social || "",
    };

    setFormData(newFormData);
  };

  const setInitialDataForCreate = () => {
    const placeDetail = location.state;
    let newFormData = { ...initialFormData };

    // Set data from Google Places if available
    if (placeDetail) {
      newFormData = {
        ...newFormData,
        displayName: placeDetail.displayName || placeDetail.query || "",
        businessType: placeDetail.businessType || "",
        workTime: placeDetail.workTime || "",
        address1: placeDetail.address1 || "",
        city: placeDetail.city || "",
        state: placeDetail.state || "",
        country: placeDetail.country || "",
        latitude: placeDetail.latitude || placeDetail.lat?.toString() || "",
        longitude: placeDetail.longitude || placeDetail.lng?.toString() || "",
        phoneNumber: placeDetail.phoneNumber || "",
        displayImage: placeDetail.displayImage || "",
        images: placeDetail.images || [],
      };
    }

    // Add current user as guide for non-edit mode
    if (!isEdit && (isAdmin || isGuide)) {
      newFormData.guides = [{ name: username, percent: 10000 }]; // 100% in 0-10000 scale
      newFormData.businessStatus = isAdmin ? "whitelisted" : "listed";
      newFormData.paymentMethods = ["HBD", "Sats"];
    }

    setFormData(newFormData);
  };

  const updateFormData = (field: keyof BusinessFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (!canProceed) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (isLastStep) {
      handleSave();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const generateBusinessModel = (): BusinessModel => {
    return {
      id: isEdit ? businessToEdit?.id : undefined,
      distriator: {
        guides: formData.guides.length > 0 ? formData.guides : undefined,
        owner: formData.hiveUsername || undefined,
        creator: isEdit ? businessToEdit?.distriator.creator : username,
        spendHbdLink: formData.spendHbdUrl || undefined,
        subscriptionStatus: formData.businessStatus || undefined,
        expiry: isEdit && businessToEdit?.distriator.expiry
          ? businessToEdit.distriator.expiry
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        verification: {
          hivePost: formData.verificationHivePost || undefined,
          facebook: formData.verificationFacebook || undefined,
          instagram: formData.verificationInstagram || undefined,
          twitter: formData.verificationTwitter || undefined,
          linkedin: formData.verificationLinkedIn || undefined,
          social: formData.verificationOtherSocial || undefined,
        },
        paymentMethods: formData.paymentMethods,
      },
      profile: {
        displayName: formData.displayName.trim(),
        displayImage: formData.displayImage || undefined,
        workTime: formData.workTime || undefined,
        businessType: formData.businessType || formData.business_type || undefined,
        business_type: formData.business_type || undefined,
        business_subtype: formData.business_subtype || undefined,
        images: formData.images,
        isOnline: formData.isOnline,
      },
      location: {
        address: {
          address1: formData.address1.trim(),
          address2: formData.address2 || undefined,
          city: formData.city.trim(),
          state: formData.state.trim(),
          country: formData.country,
        },
        pin: formData.latitude && formData.longitude ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        } : undefined,
      },
      contact: {
        instagram: formData.instagram || undefined,
        twitter: formData.twitter || undefined,
        phone: formData.phoneNumber || undefined,
        notes: formData.description || undefined,
        facebook: formData.facebook || undefined,
        website: formData.website || undefined,
        email: formData.email || undefined,
      },
    };
  };


  const getSteps = () => {
    // Calculate total steps dynamically as we build the array
    const stepsArr = [];

    stepsArr.push({
      title: "Basic Info",
      component: (
        <BusinessFormStep1
          formData={formData}
          updateFormData={updateFormData}
          onValidationChange={(isValid) => updateStepValidation(0, isValid)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          isLoading={isLoading}
          isFirstStep={currentStep === 0}
          isLastStep={false} // will be set after array is built
          canProceed={stepValidation[0] !== false}
        />
      ),
    });

    if (showSecondPage()) {
      stepsArr.push({
        title: "Details",
        component: (
          <BusinessFormStep2
            formData={formData}
            updateFormData={updateFormData}
            isEdit={isEdit}
            isAdmin={isAdmin}
            isGuide={isGuide}
            isGuideOfBusiness={isGuideOfBusiness}
            isGuideOfBusinessEditing={isGuideOfBusinessEditing}
            onValidationChange={(isValid) => updateStepValidation(stepsArr.length, isValid)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            isFirstStep={currentStep === 0}
            isLastStep={false}
            canProceed={stepValidation[stepsArr.length] !== false}
          />
        ),
      });
    }

    if (contactVisibility || isGuideOfBusinessEditing) {
      stepsArr.push(
        {
          title: "Description",
          component: (
            <BusinessFormStep3
              formData={formData}
              updateFormData={updateFormData}
              onValidationChange={(isValid) => updateStepValidation(stepsArr.length, isValid)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
              isFirstStep={currentStep === 0}
              isLastStep={false}
              canProceed={stepValidation[stepsArr.length] !== false}
            />
          ),
        },
        {
          title: "Location",
          component: (
            <BusinessFormStep4
              formData={formData}
              updateFormData={updateFormData}
              onValidationChange={(isValid) => updateStepValidation(stepsArr.length + 1, isValid)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
              isFirstStep={currentStep === 0}
              isLastStep={false}
              canProceed={stepValidation[stepsArr.length + 1] !== false}
            />
          ),
        },
        {
          title: "Contact",
          component: (
            <BusinessFormStep5
              formData={formData}
              updateFormData={updateFormData}
              onValidationChange={(isValid) => updateStepValidation(stepsArr.length + 2, isValid)}
              onNext={handleNext}
              onPrevious={handlePrevious}
              isLoading={isLoading}
              isFirstStep={currentStep === 0}
              isLastStep={false}
              canProceed={stepValidation[stepsArr.length + 2] !== false}
            />
          ),
        }
      );
    }

    if (isEdit && formData.businessStatus === "underInvestigation") {
      stepsArr.push({
        title: "Verification",
        component: (
          <BusinessFormStep6
            formData={formData}
            updateFormData={updateFormData}
            onValidationChange={(isValid) => updateStepValidation(stepsArr.length, isValid)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            isLoading={isLoading}
            isFirstStep={currentStep === 0}
            isLastStep={false}
            canProceed={stepValidation[stepsArr.length] !== false}
          />
        ),
      });
    }

    // Add onboarding post as the final step for create flow (not for edit)
    if (!isEdit) {
      const builtBusinessData = generateBusinessModel();
      stepsArr.push({
        title: "Onboarding Post",
        component: (
          <BusinessFormStep7Onboarding
            businessData={builtBusinessData}
            isMini={false}
            onPrevious={handlePrevious}
            onCompleted={() => navigate('/businesses')}
          />
        )
      });
    }
    // Now set isLastStep for the current step
    stepsArr.forEach((step, idx) => {
      if (step.component && typeof step.component === 'object') {
        step.component = React.cloneElement(step.component, {
          isLastStep: idx === stepsArr.length - 1
        });
      }
    });

    return stepsArr;
  };

  const showSecondPage = () => {
    return showSecondPageFields() || (!isEdit && isGuide);
  };

  const showSecondPageFields = () => {
    return (isEdit && isAdmin) ||
      (!isEdit && (isAdmin || isGuideOfBusiness)) ||
      isGuideOfBusinessEditing;
  };

  const updateStepValidation = (stepIndex: number, isValid: boolean) => {
    setStepValidation(prev => {
      const newValidation = [...prev];
      newValidation[stepIndex] = isValid;
      return newValidation;
    });
  };

  const steps = getSteps();
  const isLastStep = currentStep === steps.length - 1;
  const canProceed = stepValidation[currentStep] !== false;

  const handleSave = () => {
    if (!isEdit) {
      setShowConfirmation(true);
    } else {
      performSave();
    }
  };

  const performSave = async () => {
    setIsLoading(true);

    try {
      const businessData = generateBusinessModel();

      if (isEdit) {
        await updateBusiness(businessData);
        toast.success("Business updated successfully!");
        navigate(-1);
      } else {
        // Route to onboarding post flow; business is created after publishing
        navigate("/business/create/onboarding", { state: { businessData, isMini: false } });
      }
    } catch (error) {
      console.error("Error saving business:", error);
      toast.error(`Failed to ${isEdit ? "update" : "create"} business`);
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold text-foreground">
            {isEdit ? "Edit Business" : "Create Business"}
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Step Indicator */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            {steps.map((_step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors mb-1 ${index < currentStep
                      ? "bg-primary text-primary-foreground"
                      : index === currentStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                >
                  {index < currentStep ? "✓" : index + 1}
                </div>
                <span
                  className={`text-xs text-center ${
                    index <= currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {steps[index].title}
                </span>
                {index < steps.length - 1 && (
                  <div
                    className={`absolute top-2  h-0.5 transition-colors ${
                      index < currentStep ? "bg-primary" : "bg-muted"
                      }`}
                    style={{
                      left: `${(index) * (100 / steps.length)}%`,
                      width: `${100 / steps.length}%`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          {steps[currentStep]?.component}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <BusinessConfirmationDialog
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={performSave}
        isLoading={isLoading}
        isQuickAdd={false}
      />
    </div>
  );
}