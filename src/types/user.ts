export interface User {
  username: string;
  type: string;
  ageGroup: string | null;
  gender: string | null;
  banned: boolean;
  role?: string;
}

export interface UserProfile {
  ageGroup: string;
  gender: string;
}

export interface UserProfileUpdateResponse {
  message: string;
  username: string;
  type: string;
  ageGroup: string;
  gender: string;
}
