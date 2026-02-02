// Types for Prediction & Place models

export interface Prediction {
  places: Place[];
}

export interface Place {
  id?: string;
  formattedAddress: string;
  location?: Pin;
  addressComponents?: AddressComponent[];
  websiteUri?: string;
  displayName?: DisplayName;
  photos?: Photo[];
  nationalPhoneNumber?: string;
  internationalPhoneNumber: string;
  currentOpeningHours?: CurrentOpeningHours;
  primaryTypeDisplayName?: DisplayName;
  primaryType: string;
}

export interface Pin {
  latitude: number;
  longitude: number;
}

export interface AddressComponent {
  longText?: string;
  shortText?: string;
  types?: string[];
}

export interface CurrentOpeningHours {
  openNow?: boolean;
  periods?: Period[];
  weekdayDescriptions?: string[];
}

export interface Period {
  open?: Close;
  close?: Close;
}

export interface Close {
  day?: number;
  hour?: number;
  minute?: number;
  truncated?: boolean;
  date?: DateObj;
}

export interface DateObj {
  year?: number;
  month?: number;
  day?: number;
}

export interface DisplayName {
  text?: string;
}

export interface Photo {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: AuthorAttribution[];
}

export interface AuthorAttribution {
  displayName?: string;
  uri?: string;
  photoUri?: string;
}
