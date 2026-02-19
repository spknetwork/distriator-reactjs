import { useAuthStore, type LoggedInUser } from 'hive-authentication';
import { RoleType } from '../types/role';

/**
 * Utility functions for extracting authentication data from the hive-authentication store
 */

export const useAuthData = () => {
  const { currentUser } = useAuthStore();
  
  const serverResponse = currentUser?.serverResponse;
  const token = serverResponse ? JSON.parse(serverResponse)['token'] : '';
  const typeString = serverResponse ? JSON.parse(serverResponse)['type'] : '';
  const type = typeString as RoleType;
  const username = currentUser?.username || '';
  
  return {
    currentUser,
    token,
    type,
    username,
    isAuthenticated: !!currentUser && !!token
  };
};

/**
 * Utility function to handle token expiration across stores
 */
export const handleTokenExpiration = async (response: Response): Promise<boolean> => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      if (errorData.error === "JsonWebTokenError: invalid signature" || errorData.error === "TokenExpiredError: jwt expired") {
        // Dispatch a custom event that components can listen to
        window.dispatchEvent(new CustomEvent('tokenExpired', {
          detail: { message: 'Your session has expired. Please log in again.' }
        }));
        return true; // Token was invalid
      }
    } catch (e) {
      // If we can't parse the error response, continue with normal error handling
      console.warn('Could not parse error response:', e);
    }
  }
  return false; // Token was not invalid
};

/**
 * Extract token from currentUser serverResponse
 */
export const getToken = (currentUser: LoggedInUser): string => {
  const serverResponse = currentUser?.serverResponse;
  return serverResponse ? JSON.parse(serverResponse)['token'] : '';
};

/**
 * Extract type from currentUser serverResponse
 */
export const getType = (currentUser: LoggedInUser): string => {
  const serverResponse = currentUser?.serverResponse;
  return serverResponse ? JSON.parse(serverResponse)['type'] : '';
};

/**
 * Extract username from currentUser
 */
export const getUsername = (currentUser: LoggedInUser): string => {
  return currentUser?.username || '';
};
