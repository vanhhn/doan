import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authAPI, customerAPI, LoginResponse } from "../services/api";

interface User {
  id: number;
  username: string;
  fullName: string;
  phone: string;
  email: string;
  currentBatteryUid: string | null;
  totalSwaps: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; message: string }>;
  register: (userData: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
    email?: string;
  }) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const userData = await AsyncStorage.getItem("userData");

      if (token && userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error checking auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      console.log("🔐 AuthContext: Attempting login with:", { username });
      const response = await authAPI.login({ username, password });
      console.log("🔐 AuthContext: Login response:", response);

      if (response.success && response.data) {
        const { customer } = response.data;
        console.log("🔐 AuthContext: Setting user data:", customer);
        setUser(customer);

        // Save user data to AsyncStorage
        await AsyncStorage.setItem("userData", JSON.stringify(customer));
        console.log("🔐 AuthContext: User data saved to storage");

        return { success: true, message: "Đăng nhập thành công!" };
      } else {
        console.error("🔐 AuthContext: Login failed:", response.message);
        return {
          success: false,
          message: response.message || "Đăng nhập thất bại",
        };
      }
    } catch (error) {
      console.error("🔐 AuthContext: Login error:", error);
      return { success: false, message: "Có lỗi xảy ra khi đăng nhập" };
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
    email?: string;
  }) => {
    try {
      const response = await authAPI.register(userData);

      if (response.success) {
        return {
          success: true,
          message: response.message || "Đăng ký thành công!",
        };
      } else {
        return {
          success: false,
          message: response.message || "Đăng ký thất bại",
        };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Có lỗi xảy ra khi đăng ký" };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      await AsyncStorage.removeItem("userData");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refreshUser = async () => {
    try {
      console.log("🔄 Refreshing user data from server...");
      // Fetch updated user data from the server
      const response = await customerAPI.getProfile();
      if (response.success && response.data) {
        const updatedUser = {
          ...user,
          ...response.data,
        };
        setUser(updatedUser);
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
        console.log("✅ User data refreshed:", updatedUser);
      }
    } catch (error) {
      console.error("Refresh user error:", error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
