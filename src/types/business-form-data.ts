import type { Guide } from "./business";

export interface BusinessFormData {
  // Step 1 - Basic Info
  displayName: string;
  businessType: string;
  business_type: string;
  business_subtype: string;
  isOnline: boolean;
  displayImage: string;
  images: string[];

  // Step 2 - Business Details
  hiveUsername: string;
  businessStatus: string;
  paymentMethods: string[];
  guides: Guide[];
  spendHbdUrl: string;

  // Step 3 - Description & Work Time
  description: string;
  workTime: string;

  // Step 4 - Location
  address1: string;
  address2: string;
  country: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;

  // Step 5 - Contact
  phoneNumber: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  website: string;

  // Step 6 - Verification
  verificationHivePost: string;
  verificationFacebook: string;
  verificationInstagram: string;
  verificationTwitter: string;
  verificationLinkedIn: string;
  verificationOtherSocial: string;
}