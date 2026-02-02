
import { create } from 'zustand';
import { UserService } from '../services/user-service';
import type { User, UserProfile } from '../types/user';

interface UserProfileState {
  user: User | null;
  showProfileCompletionModal: boolean;
  fetchUser: (token: string) => Promise<void>;
  updateUserProfile: (token: string, profile: UserProfile) => Promise<void>;
  setShowProfileCompletionModal: (show: boolean) => void;
}

export const useUserProfileStore = create<UserProfileState>((set, get) => ({
  user: null,
  showProfileCompletionModal: false,
  fetchUser: async (token: string) => {
    const user = await UserService.getUser(token);
    set({ user });
    if (user && (user.ageGroup === null || user.gender === null) && user.type.toLowerCase() !== 'super') {
      set({ showProfileCompletionModal: true });
    }
  },
  updateUserProfile: async (token: string, profile: UserProfile) => {
    const updatedProfile = await UserService.updateUserProfile(token, profile);
    if (updatedProfile) {
      const user = get().user;
      if (user) {
        set({
          user: {
            ...user,
            ageGroup: updatedProfile.ageGroup,
            gender: updatedProfile.gender,
          },
          showProfileCompletionModal: false,
        });
      }
    }
  },
  setShowProfileCompletionModal: (show: boolean) => {
    set({ showProfileCompletionModal: show });
  },
}));
