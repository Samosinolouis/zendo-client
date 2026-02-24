"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { User } from "@/types";
import { mockUsers, getBusinessesByUserId } from "@/lib/mock-data";
import type { Business } from "@/types";

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  role: "user" | "owner";
  businessName?: string;
  businessDescription?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isOwner: boolean;
  businesses: Business[];
  login: (userId?: string) => void;
  logout: () => void;
  switchUser: (userId: string) => void;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isOwner: false,
  businesses: [],
  login: () => {},
  logout: () => {},
  switchUser: () => {},
  register: async () => ({ success: false, message: "" }),
  loginWithCredentials: async () => ({ success: false, message: "" }),
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Start logged out

  const isLoggedIn = user !== null;
  const isOwner = user?.role === "owner";
  const businesses = user ? getBusinessesByUserId(user.id) : [];

  const login = useCallback((userId?: string) => {
    const target = userId ? mockUsers.find((u) => u.id === userId) : mockUsers[0];
    setUser(target ?? null);
  }, []);

  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; message: string }> => {
      void password; // intentionally ignored in mock — real impl will verify against Keycloak
      // Mock: simulate a 600ms network call
      await new Promise((r) => setTimeout(r, 600));
      const found = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );
      if (found) {
        setUser(found);
        return { success: true, message: "Welcome back!" };
      }
      return { success: false, message: "Invalid email or password. Try any mock user's email." };
    },
    []
  );

  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; message: string }> => {
    // Mock: simulate a 800ms network call
    await new Promise((r) => setTimeout(r, 800));
    // Check if email already exists
    const exists = mockUsers.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    if (exists) {
      return { success: false, message: "An account with this email already exists." };
    }
    // Create a new mock user
    const newUser: User = {
      id: `u${Date.now()}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      username: data.username,
      profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.firstName}`,
      role: data.role,
    };
    mockUsers.push(newUser);
    setUser(newUser);
    return { success: true, message: `Account created! Welcome to Zendo, ${data.firstName}.` };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const target = mockUsers.find((u) => u.id === userId);
    setUser(target ?? null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn, isOwner, businesses, login, logout, switchUser, register, loginWithCredentials }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
