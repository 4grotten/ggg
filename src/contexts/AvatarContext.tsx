import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";
const AVATAR_STORAGE_KEY = "user-avatar";

interface AvatarContextType {
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  syncWithUser: (userAvatar?: { file?: string; small?: string; medium?: string } | null) => void;
}

const AvatarContext = createContext<AvatarContextType | undefined>(undefined);

export const AvatarProvider = ({ children }: { children: React.ReactNode }) => {
  const [avatarUrl, setAvatarUrlState] = useState(() => {
    const saved = localStorage.getItem(AVATAR_STORAGE_KEY);
    return saved || DEFAULT_AVATAR;
  });

  const setAvatarUrl = useCallback((url: string) => {
    setAvatarUrlState(url);
    localStorage.setItem(AVATAR_STORAGE_KEY, url);
  }, []);

  // Sync avatar with user profile data from API
  const syncWithUser = useCallback((userAvatar?: { file?: string; small?: string; medium?: string } | null) => {
    if (userAvatar) {
      const apiAvatar = userAvatar.medium || userAvatar.small || userAvatar.file;
      if (apiAvatar) {
        setAvatarUrlState(apiAvatar);
        localStorage.setItem(AVATAR_STORAGE_KEY, apiAvatar);
      }
    }
  }, []);

  return (
    <AvatarContext.Provider value={{ avatarUrl, setAvatarUrl, syncWithUser }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error("useAvatar must be used within an AvatarProvider");
  }
  return context;
};
