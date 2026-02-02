
import { handleTokenExpiration } from '../utils/auth-utils';
import type { User, UserProfile, UserProfileUpdateResponse } from '../types/user';

const HD_API_SERVER = import.meta.env.VITE_HD_API_SERVER || 'https://beta-api.distriator.com';

export class UserService {
  static async getUser(token: string, signal?: AbortSignal): Promise<User | null> {
    try {
      const response = await fetch(`${HD_API_SERVER}/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        signal,
      });

      await handleTokenExpiration(response);

      if (response.ok) {
        const data = await response.json();
        return data as User;
      }
      return null;
    } catch (error) {
      console.error('Failed to get user', error);
      return null;
    }
  }

  static async updateUserProfile(
    token: string,
    profile: UserProfile,
    signal?: AbortSignal
  ): Promise<UserProfileUpdateResponse | null> {
    try {
      const response = await fetch(`${HD_API_SERVER}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
        signal,
      });

      await handleTokenExpiration(response);

      if (response.ok) {
        const data = await response.json();
        return data as UserProfileUpdateResponse;
      }
      return null;
    } catch (error) {
      console.error('Failed to update user profile', error);
      return null;
    }
  }
}
