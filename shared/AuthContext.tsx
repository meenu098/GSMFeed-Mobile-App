import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: any;
  setUser: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setInternalUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStorageData = async () => {
      try {
        const authDataSerialized = await AsyncStorage.getItem("@AuthData");
        if (authDataSerialized) {
          const _authData = JSON.parse(authDataSerialized);
          setInternalUser(_authData);
        }
      } catch (error) {
        console.error("Failed to load auth data", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStorageData();
  }, []);

  const setUser = async (userData: any) => {
    setInternalUser(userData);
    await AsyncStorage.setItem("@AuthData", JSON.stringify(userData));
  };

  const logout = async () => {
    setInternalUser(null);
    await AsyncStorage.removeItem("@AuthData");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
