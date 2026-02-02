/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BusinessFormField } from './form/BusinessFormField';
import { BusinessDropdown } from './form/BusinessDropdown';
import { PaymentMethodSelector } from './form/PaymentMethodSelector';
import { BusinessGuideEditor } from './form/BusinessGuideEditor';
import { BusinessFormStep7Onboarding } from './form/BusinessFormStep7Onboarding';
import { COUNTRIES } from '../UserManagement/CountriesDropdown';
import { useAuthData } from '../../utils/auth-utils';

const BUSINESS_STATUS = {
  WHITELISTED: 'whitelisted',
  LISTED: 'listed',
  UNDER_INVESTIGATION: 'underInvestigation'
};

const PAYMENT_METHODS = ['HBD', 'Sats', 'Lightning', 'Bitcoin'];

export const BusinessMiniForm: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useAuthData();

  const [formData, setFormData] = useState({
    displayName: '',
    hiveUsername: '',
    city: '',
    country: '',
    businessStatus: BUSINESS_STATUS.WHITELISTED,
    paymentMethods: ['HBD', 'Sats'],
    isOnline: false
  });

  const [guides, setGuides] = useState([{
    name: username || '',
    percent: 10000
  }]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-muted text-foreground rounded-full hover:bg-muted-foreground/20"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-semibold">Quick Add Business</h1>
          <div className="w-10"></div> {/* Placeholder for symmetry */}
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <BusinessFormField
          label="Display Name"
          value={formData.displayName}
          onChange={(value) => handleInputChange('displayName', value)}
          placeholder="Enter business display name"
          required
        />

        <BusinessFormField
          label="Hive Username"
          value={formData.hiveUsername}
          onChange={(value) => handleInputChange('hiveUsername', value)}
          placeholder="Enter the hive username"
          required
        />

        <BusinessDropdown
          label="Country"
          value={formData.country}
          onChange={(value) => handleInputChange('country', value)}
          options={COUNTRIES}
          placeholder="Select the country"
          required
        />

        <BusinessFormField
          label="City"
          value={formData.city}
          onChange={(value) => handleInputChange('city', value)}
          placeholder="Enter the city"
          required
        />


        <BusinessDropdown
          label="Status"
          value={formData.businessStatus}
          onChange={(value) => handleInputChange('businessStatus', value)}
          options={[BUSINESS_STATUS.WHITELISTED, BUSINESS_STATUS.LISTED, BUSINESS_STATUS.UNDER_INVESTIGATION]}
          placeholder="Select status"
          required
        />

        <PaymentMethodSelector
          label="Payment Methods"
          value={formData.paymentMethods}
          onChange={(value) => handleInputChange('paymentMethods', value)}
          options={PAYMENT_METHODS}
          required
        />

        <BusinessGuideEditor
          label="Trusted Guides"
          guides={guides}
          onChange={setGuides}
          required
        />

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isOnline"
            checked={formData.isOnline}
            onChange={(e) => handleInputChange('isOnline', e.target.checked)}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isOnline" className="text-sm text-foreground">
            eCommerce business
          </label>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <BusinessFormStep7Onboarding
          businessData={{
            profile: {
              displayName: formData.displayName,
              isOnline: formData.isOnline
            },
            distriator: {
              guides: guides,
              owner: formData.hiveUsername || undefined,
              creator: username || '',
              subscriptionStatus: formData.businessStatus,
              paymentMethods: formData.paymentMethods
            },
            location: {
              address: {
                city: formData.city,
                country: formData.country
              }
            }
          } as any}
          isMini={true}
          onPrevious={() => false}
          onCompleted={() => navigate('/businesses')}
        />
      </div>
    </div>
  );
};