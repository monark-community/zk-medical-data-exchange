"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { UserProfile } from "@/services/api/auditService";

interface ProfileContextType {
  currentProfile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  getProfileDisplayName: (profile: UserProfile) => string;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentProfile, setCurrentProfile] = useState<UserProfile>(UserProfile.DATA_SELLER);

  const setProfile = useCallback((profile: UserProfile) => {
    setCurrentProfile(profile);
  }, []);

  const getProfileDisplayName = useCallback((profile: UserProfile): string => {
    switch (profile) {
      case UserProfile.DATA_SELLER:
        return "Data Seller";
      case UserProfile.RESEARCHER:
        return "Researcher";
      case UserProfile.ADMIN:
        return "Admin";
      case UserProfile.COMMON:
        return "Common";
      default:
        return "Unknown";
    }
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        currentProfile,
        setProfile,
        getProfileDisplayName,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = (): ProfileContextType => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
};
