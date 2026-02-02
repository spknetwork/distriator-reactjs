/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Guide {
  name: string;
  percent: number;
}

export interface Verification {
  hivePost?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
  instagram?: string;
  social?: string;
}

export interface ReviewField {
  id: string;
  title: string;
  type: 'rating' | 'singleChoice' | 'multiChoice' | 'yesNo' | 'text';
  choices?: string[]; // Only for singleChoice and multiChoice
}

export interface Distriator {
  guides?: Guide[];
  owner?: string;
  creator?: string;
  subscriptionStatus?: string;
  paymentMethods: string[];
  spendHbdLink?: string;
  expiry?: Date;
  verification?: Verification;
  reviewFields?: ReviewField[]; // Custom review fields for this business
}

export interface Pin {
  latitude?: number;
  longitude?: number;
}

export interface Address {
  address1?: string;
  address2?: string;
  city: string;
  state?: string;
  country: string;
}

export interface Location {
  pin?: Pin;
  address: Address;
}

export interface Profile {
  displayName: string;
  displayImage?: string;
  businessType?: string;
  business_type?: string;
  business_subtype?: string;
  images?: string[];
  workTime?: string;
  isOnline?: boolean;
}

export interface Contact {
  email?: string;
  phone?: string;
  notes?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
}

export interface BusinessModel {
  distriator: Distriator;
  profile: Profile;
  location: Location;
  contact?: Contact;
  id?: string;
  v?: number;
  createdAt?: string; // ISO8601 timestamp
  updatedAt?: string; // ISO8601 timestamp
}


export interface BusinessFilter {
  cities: string[];
  guides: string[];
  currencies: string[];
  countries?: string[];
  ownerFilter?: string[];
  verified?: boolean;
}

export interface BusinessFilterData {
  data: BusinessModel[];
}

export interface SpendHistoryItem {
  businessName: string;
  spendingAmount: string;
  trxnTs: string;
  country?: string;
  state?: string;
  city?: string;
}

export interface ActionResponse<T> {
  data?: T;
  valid: boolean;
  errorMessage: string;
  isSuccess: boolean;
}

export function createBusinessModel(json: any): BusinessModel {
  return {
    distriator: {
      guides: json.distriator.guides?.map((g: any) => ({
        name: g.name,
        percent: Math.floor(g.percent / 100),
      })) || [],
      owner: json.distriator.owner,
      creator: json.distriator.creator,
      subscriptionStatus: json.distriator.subscriptionStatus,
      paymentMethods: json.distriator.paymentMethods || [],
      spendHbdLink: json.distriator.spendHBDLink,
      expiry: json.distriator.expiry ? new Date(json.distriator.expiry) : undefined,
      verification: json.distriator.verification || undefined,
      reviewFields: json.distriator.reviewFields || [],
    },
    profile: {
      displayName: json.profile.displayName,
      displayImage: json.profile.displayImage,
      businessType: json.profile.businessType,
      business_type: json.profile.business_type,
      business_subtype: json.profile.business_subtype,
      images: json.profile.images || [],
      workTime: json.profile.workTime,
      isOnline: json.profile.isOnline || false,
    },
    location: {
      pin: json.location.pin ? {
        latitude: json.location.pin.latitude,
        longitude: json.location.pin.longitude,
      } : undefined,
      address: {
        address1: json.location.address.address1,
        address2: json.location.address.address2,
        city: json.location.address.city,
        state: json.location.address.state,
        country: json.location.address.country,
      },
    },
    contact: json.contact ? {
      email: json.contact.email,
      phone: json.contact.phone,
      notes: json.contact.notes,
      website: json.contact.website,
      instagram: json.contact.instagram,
      facebook: json.contact.facebook,
      twitter: json.contact.twitter,
    } : undefined,
    id: json.id,
    v: json.__v,
    createdAt: json.createdAt || json.created_at,
    updatedAt: json.updatedAt || json.updated_at,
  };
}

export function getBusinessFromUserName(
  businessHiveUserName: string,
  businesses: BusinessModel[]
): BusinessModel[] {
  return businesses.filter(
    (business) => business.distriator.owner === businessHiveUserName
  );
}