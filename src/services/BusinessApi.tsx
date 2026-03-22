/* eslint-disable @typescript-eslint/no-explicit-any */
import CryptoJS from "crypto-js";
 import type { BusinessModel } from "../types/business";
 const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
import { handleTokenExpiration } from '../utils/auth-utils';
 
 export const createBusinessApi = async (businessData: any, token: string) => {
   const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
   const response = await fetch(`${HD_API_SERVER}/business`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': token,
     },
     body: JSON.stringify(businessData),
   });

   // Check for token expiration
   const isTokenExpired = await handleTokenExpiration(response);
   if (isTokenExpired) {
     throw new Error('Token expired');
   }

   if (!response.ok) throw new Error("Failed to create business");
   const jsonData = await response.json();
   const responseData = jsonData.data as string;
   const decryptedText = CryptoJS.AES.decrypt(responseData, apiKey).toString(
     CryptoJS.enc.Utf8
   );
   return JSON.parse(decryptedText) as BusinessModel;
 };
 
 export const createMiniBusinessApi = async (businessData: BusinessModel, token: string) => {
   const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
   const response = await fetch(`${HD_API_SERVER}/business/quickAdd`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': token,
     },
     body: JSON.stringify(businessData),
   });

   // Check for token expiration
   const isTokenExpired = await handleTokenExpiration(response);
   if (isTokenExpired) {
     throw new Error('Token expired');
   }

   if (!response.ok) throw new Error("Failed to create mini business");
   const jsonData = await response.json();
   const responseData = jsonData.data as string;
   const decryptedText = CryptoJS.AES.decrypt(responseData, apiKey).toString(
     CryptoJS.enc.Utf8
   );
   return JSON.parse(decryptedText) as BusinessModel;
 };
 
 export const updateBusinessApi = async (businessData: BusinessModel, token: string) => {
   const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
   const response = await fetch(`${HD_API_SERVER}/business/update`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': token,
     },
     body: JSON.stringify(businessData),
   });

   // Check for token expiration (use clone so we can still read body for error message)
   const isTokenExpired = await handleTokenExpiration(response.clone());
   if (isTokenExpired) {
     throw new Error('Token expired');
   }

   if (!response.ok) {
    let errorMessage = "Failed to update business";
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMessage = errorData.message;
      else if (errorData?.error) errorMessage = errorData.error;
    } catch {
      // Response body may not be valid JSON
    }
    throw new Error(errorMessage);
  }
   const jsonData = await response.json();
   const responseData = jsonData.data as string;
   const decryptedText = CryptoJS.AES.decrypt(responseData, apiKey).toString(
     CryptoJS.enc.Utf8
   );
   return JSON.parse(decryptedText) as BusinessModel;
 };
 
export const uploadPlacesImageApi = async (imageUrl: string, token: string) => {
  const response = await fetch(`${HD_API_SERVER}/places/photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token,
    },
    body: JSON.stringify({ photoUri: imageUrl }),
  });

  // Check for token expiration
  const isTokenExpired = await handleTokenExpiration(response);
  if (isTokenExpired) {
    throw new Error('Token expired');
  }

  if (!response.ok) throw new Error("Failed to upload places image");
  const result = await response.json();
  return result.url;
};

// Storage keys for caching
const BUSINESSES_CACHE_KEY = "cached_businesses_data";
const LAST_MODIFIED_TIMESTAMP_KEY = "last_modified_timestamp_new";
const OLDEST_POSSIBLE_TIMESTAMP = "1970-01-01T00:00:00.000Z";

// Interface for the API response
interface BusinessApiResponse {
  data: string; // Encrypted data
}

// Get cached businesses from localStorage
const getCachedBusinesses = (): BusinessModel[] => {
  try {
    const cachedData = localStorage.getItem(BUSINESSES_CACHE_KEY);
    if (!cachedData) return [];
    
    const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
    const decryptedText = CryptoJS.AES.decrypt(cachedData, apiKey).toString(
      CryptoJS.enc.Utf8
    );
    return JSON.parse(decryptedText) as BusinessModel[];
  } catch (error) {
    console.error("Error reading cached businesses:", error);
    return [];
  }
};

// Store encrypted businesses data in localStorage
const storeCachedBusinesses = (encryptedData: string): void => {
  try {
    localStorage.setItem(BUSINESSES_CACHE_KEY, encryptedData);
  } catch (error) {
    console.error("Error storing cached businesses:", error);
  }
};

// Get the last modified timestamp from localStorage
const getLastModifiedTimestamp = (): string => {
  return localStorage.getItem(LAST_MODIFIED_TIMESTAMP_KEY) || OLDEST_POSSIBLE_TIMESTAMP;
};

// Store the last modified timestamp in localStorage
const storeLastModifiedTimestamp = (timestamp: string): void => {
  try {
    localStorage.setItem(LAST_MODIFIED_TIMESTAMP_KEY, timestamp);
  } catch (error) {
    console.error("Error storing timestamp:", error);
  }
};

// Find the maximum date from businesses array
const findMaxDateFromBusinesses = (businesses: BusinessModel[]): string => {
  if (businesses.length === 0) return OLDEST_POSSIBLE_TIMESTAMP;
  
  let maxDate = new Date(OLDEST_POSSIBLE_TIMESTAMP);
  
  businesses.forEach(business => {
    if (business.updatedAt) {
      const businessDate = new Date(business.updatedAt);
      if (businessDate > maxDate) {
        maxDate = businessDate;
      }
    }
  });
  
  return maxDate.toISOString();
};

// Fetch businesses modified after a specific timestamp
const fetchBusinessesModifiedAfter = async (timestamp: string, signal: AbortSignal): Promise<BusinessModel[]> => {
  const response = await fetch(`${HD_API_SERVER}/business/modified-after?date=${encodeURIComponent(timestamp)}`, {
    signal: signal,
  });
  
  if (signal.aborted) {
    throw new Error("Request was aborted");
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  const jsonData = await response.json() as BusinessApiResponse;
  const responseData = jsonData.data;
  
  if (!responseData) {
    return [];
  }
  
  // Decrypt the data
  const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
  const decryptedText = CryptoJS.AES.decrypt(responseData, apiKey).toString(
    CryptoJS.enc.Utf8
  );
  
  const businesses = JSON.parse(decryptedText) as BusinessModel[];
  
  // Filter out deleted businesses
  const activeBusinesses = businesses.filter(business => !(business as BusinessModel & { isDeleted?: boolean }).isDeleted);
  
  return activeBusinesses;
};

// Main function to fetch businesses with caching
export const fetchBusinessesApi = async (signal: AbortSignal): Promise<BusinessModel[]> => {
  if (signal.aborted) {
    throw new Error("Request was aborted");
  }
  
  try {
    // Get cached businesses
    const cachedBusinesses = getCachedBusinesses();
    const lastTimestamp = getLastModifiedTimestamp();
    
    // Fetch new/modified businesses since last timestamp
    const newBusinesses = await fetchBusinessesModifiedAfter(lastTimestamp, signal);
    
    if (newBusinesses.length === 0) {
      // No new businesses, return cached data
      return cachedBusinesses;
    }
    
    // Merge new businesses with cached businesses
    // Remove any businesses that might have been updated (by ID or name)
    const updatedBusinesses = [...cachedBusinesses];
    
    newBusinesses.forEach(newBusiness => {
      const existingIndex = updatedBusinesses.findIndex(
        existing => existing.id === newBusiness.id || 
                   existing.profile.displayName === newBusiness.profile.displayName
      );
      
      if (existingIndex !== -1) {
        // Update existing business
        updatedBusinesses[existingIndex] = newBusiness;
      } else {
        // Add new business
        updatedBusinesses.push(newBusiness);
      }
    });
    
    // Filter out deleted businesses from the merged result
    const finalBusinesses = updatedBusinesses.filter(business => !(business as BusinessModel & { isDeleted?: boolean }).isDeleted);
    
    // Store the updated encrypted data
    const apiKey = import.meta.env.VITE_DECRYPTION_KEY;
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(finalBusinesses),
      apiKey
    ).toString();
    storeCachedBusinesses(encryptedData);
    
    // Update the timestamp to the max date from new businesses
    const newMaxTimestamp = findMaxDateFromBusinesses(newBusinesses);
    storeLastModifiedTimestamp(newMaxTimestamp);
    
    return finalBusinesses;
  } catch (error) {
    // If API fails, return cached data if available
    const cachedBusinesses = getCachedBusinesses();
    if (cachedBusinesses.length > 0) {
      return cachedBusinesses;
    }
    
    throw error;
  }
};

// Function to clear cache (useful for testing or manual refresh)
export const clearBusinessesCache = (): void => {
  localStorage.removeItem(BUSINESSES_CACHE_KEY);
  localStorage.removeItem(LAST_MODIFIED_TIMESTAMP_KEY);
};


 export const deleteBusinessApi = async (businessId: string, token: string) => {
   const response = await fetch(`${HD_API_SERVER}/business/delete`, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'Authorization': token,
     },
     body: JSON.stringify({ id: businessId }),
   });

   // Check for token expiration
   const isTokenExpired = await handleTokenExpiration(response);
   if (isTokenExpired) {
     throw new Error('Token expired');
   }

   if (!response.ok) throw new Error("Failed to delete business");
   return true;
 };

// Interface for unverified claims API response
export interface UnverifiedClaimItem {
  id: string;
  unverified_claims: number;
}

// Fetch unverified claims count for all businesses
export const fetchUnverifiedClaimsApi = async (signal?: AbortSignal): Promise<UnverifiedClaimItem[]> => {
  if (signal?.aborted) {
    throw new Error("Request was aborted");
  }

  const response = await fetch(`${HD_API_SERVER}/business/unverified-claims`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch unverified claims: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as UnverifiedClaimItem[];
  return data;
};