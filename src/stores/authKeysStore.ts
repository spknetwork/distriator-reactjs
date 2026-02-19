import { create } from "zustand";

interface UserAuthKeys {
  hasActiveKey: boolean;
  privateActiveKey?: string;
  privatePostingKey?: string;
}

export interface AuthKeysState {
  /** Per-username: whether active key was supplied at login (and the key for programmatic auth) */
  keysByUser: Record<string, UserAuthKeys>;
  setKeys: (username: string, hasActiveKey: boolean, privateActiveKey?: string, privatePostingKey?: string) => void;
  getKeys: (username: string) => UserAuthKeys | undefined;
  clearKeys: (username: string) => void;
}

export const useAuthKeysStore = create<AuthKeysState>((set, get) => ({
  keysByUser: {},
  setKeys: (username, hasActiveKey, privateActiveKey, privatePostingKey) => {
    set((s) => ({
      keysByUser: {
        ...s.keysByUser,
        [username]: { hasActiveKey, privateActiveKey, privatePostingKey },
      },
    }));
  },
  getKeys: (username) => get().keysByUser[username],
  clearKeys: (username) => {
    set((s) => {
      const next = { ...s.keysByUser };
      delete next[username];
      return { keysByUser: next };
    });
  },
}));
