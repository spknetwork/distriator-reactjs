/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuthStore } from 'hive-authentication';
import { useUserProfileStore } from "../stores/userProfileStore";
import UserProfileCompletionModal from "../components/UserProfileCompletionModal";
export interface HiveAuthUser {
  username: string;
  provider: string;
  challenge: string;
  publicKey: string;
  proof: string;
  serverResponse?: string;
  /** Set when user logs in with private key and supplies active key (optional field) */
  privateActiveKey?: string;
  /** Set when user logs in with private key (posting key) */
  privatePostingKey?: string;
}

export interface HiveServerResponse {
  token: string;
  type: string;
}

export interface AuthUser {
  username: string;
  provider: string;
  challenge: string;
  publicKey: string;
  proof: string;
  token: string;
  type: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  loggedInUsers: AuthUser[];
  isLoading: boolean;
  error: string | null;
}
interface HiveAuthStore {
    currentUser: HiveAuthUser | null;
    loggedInUsers: HiveAuthUser[];
    isLoading: boolean;
    error: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  loggedInUsers: [],
  isLoading: false,
  error: null,
});

const parseUser = (user: HiveAuthUser): AuthUser => {
  let token = "";
  let type = "";
  if (user?.serverResponse) {
    try {
      const parsed: HiveServerResponse = JSON.parse(user.serverResponse);
      token = parsed.token;
      type = parsed.type;
    } catch (err) {
      console.warn("Invalid serverResponse JSON", err);
    }
  }
  return {
    username: user.username,
    provider: user.provider,
    challenge: user.challenge,
    publicKey: user.publicKey,
    proof: user.proof,
    token,
    type,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore();
  const [state, setState] = useState<AuthContextValue>({
    currentUser: store.currentUser ? parseUser(store.currentUser as unknown as HiveAuthUser) : null,
    loggedInUsers: Array.isArray(store.loggedInUsers)
      ? (store.loggedInUsers as unknown as HiveAuthUser[]).map(parseUser)
      : [],
    isLoading: store.isLoading,
    error: store.error,
  });
  const { fetchUser, user, showProfileCompletionModal, setShowProfileCompletionModal } = useUserProfileStore();




  useEffect(() => {
    const unsubscribe = useAuthStore.subscribe((s: HiveAuthStore) => {
      setState({
        currentUser: s.currentUser ? parseUser(s.currentUser) : null,
        loggedInUsers: Array.isArray(s.loggedInUsers)
          ? s.loggedInUsers.map(parseUser)
          : [],
        isLoading: s.isLoading,
        error: s.error,
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (state.currentUser && state.currentUser.token) {
      fetchUser(state.currentUser.token);
    }
  }, [state.currentUser, fetchUser]);



  const handleCloseModal = () => {
    setShowProfileCompletionModal(false);
    if (state.currentUser && state.currentUser.token) {
      fetchUser(state.currentUser.token);
    }
  };

  return (
    <AuthContext.Provider value={state}>
      {children}
      {user && <UserProfileCompletionModal isOpen={showProfileCompletionModal} onClose={handleCloseModal} />}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);


