import type { UserClaimResponseDTO } from "../types/claim";
import { handleTokenExpiration } from "../utils/auth-utils";

const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';
export const fetchUserClaimsApi = async ( token: string, signal: AbortSignal): Promise<UserClaimResponseDTO> => {
  if (signal.aborted) {
    throw new Error("Request was aborted");
  }
  const response = await fetch(`${HD_API_SERVER}/claims/v2`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: token
    },
    signal: signal,
  });

  // Check for token expiration
  const isTokenExpired = await handleTokenExpiration(response);
  if (isTokenExpired) {
    throw new Error('Token expired');
  }

  if (!response.ok) {
    console.error("Claims API failed:", response.status, response.statusText);
    throw new Error("Failed to fetch user claims");
  }
  
  const data = await response.json();
  return data;
};

export const fetchPrivilegedUserClaimsApi = async (token: string, signal: AbortSignal): Promise<UserClaimResponseDTO> => {
  if (signal.aborted) {
    throw new Error("Request was aborted");
  }
  const response = await fetch(`${HD_API_SERVER}/claims/v2/privileged-users`, {
    method: "GET",
    headers: {
      Accept: "*/*",
      "Content-Type": "application/json",
      Authorization: token
    },
    signal: signal,
  });

  const isTokenExpired = await handleTokenExpiration(response);
  if (isTokenExpired) {
    throw new Error('Token expired');
  }

  if (!response.ok) {
    console.error("Privileged Claims API failed:", response.status, response.statusText);
    throw new Error("Failed to fetch privileged user claims");
  }

  const data = await response.json();
  return data;
};