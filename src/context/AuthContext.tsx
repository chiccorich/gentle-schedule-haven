
import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "minister";

interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}

// Mock users for demo purposes
const MOCK_USERS = [
  {
    id: "1",
    username: "admin",
    password: "admin123",
    name: "Admin User",
    role: "admin" as UserRole
  },
  {
    id: "2",
    username: "minister1",
    password: "church123",
    name: "John Smith",
    role: "minister" as UserRole
  },
  {
    id: "3",
    username: "minister2",
    password: "church123",
    name: "Mary Johnson",
    role: "minister" as UserRole
  }
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved user on component mount
    const savedUser = localStorage.getItem("minister-user");
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse saved user", error);
        localStorage.removeItem("minister-user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, remember: boolean): Promise<boolean> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const foundUser = MOCK_USERS.find(
      u => u.username === username && u.password === password
    );
    
    if (foundUser) {
      // Remove password before saving user info
      const { password: _, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      
      if (remember) {
        localStorage.setItem("minister-user", JSON.stringify(userWithoutPassword));
      }
      return true;
    }
    
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("minister-user");
  };

  const isAdmin = () => {
    return user?.role === "admin";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
