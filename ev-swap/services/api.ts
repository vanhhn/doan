import AsyncStorage from "@react-native-async-storage/async-storage";

// API Base Configuration
// Choose the appropriate URL based on your setup:

// Production: Heroku backend
const API_BASE_URL = "https://ev-swap-backend-2025-b268b8b1f366.herokuapp.com";

// For ngrok public access (anyone can access from any network):
// const API_BASE_URL = "https://gwyn-electrosurgical-stochastically.ngrok-free.dev";

// For physical device on same network:
// const API_BASE_URL = "http://192.168.80.120:3000";

// For Android emulator:
// const API_BASE_URL = "http://10.0.2.2:3000";

// For iOS simulator or web:
// const API_BASE_URL = "http://localhost:3000";

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  token: string;
  customer: {
    id: number;
    username: string;
    fullName: string;
    phone: string;
    email: string;
    currentBatteryUid: string | null;
    totalSwaps: number;
    balance?: number;
  };
}

export interface Station {
  id: number;
  name: string;
  location: string;
  status: string;
  totalSlots: number;
  availableSlots: number;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface Transaction {
  type: "swap" | "topup";
  date: string;
  amount: number;
  description: string;
  stationName?: string;
  cost?: number;
  paymentMethod?: string;
}

export interface SlotInfo {
  id: number;
  slotNumber: number;
  status: string;
  isBatteryPresent: boolean;
  isLocked: boolean;
  batteryUid: string | null;
}

export interface StationDetails extends Station {
  slots: SlotInfo[];
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Load token from storage
  private async loadToken() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      this.token = token;
    } catch (error) {
      console.error("Error loading token:", error);
    }
  }

  // Save token to storage
  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem("authToken", token);
      this.token = token;
    } catch (error) {
      console.error("Error saving token:", error);
    }
  }

  // Remove token from storage
  private async removeToken() {
    try {
      await AsyncStorage.removeItem("authToken");
      this.token = null;
    } catch (error) {
      console.error("Error removing token:", error);
    }
  }

  // Generic HTTP request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      console.log("🚀 API Request:", url, options.method || "GET");

      const headers: any = {
        "Content-Type": "application/json",
        ...options.headers,
      };

      // Add authorization header if token exists
      if (this.token) {
        headers.Authorization = `Bearer ${this.token}`;
      }

      // Add timeout for upload requests (30 seconds) with fallback
      let controller: AbortController | undefined;
      let timeoutId: NodeJS.Timeout | undefined;

      try {
        controller = new AbortController();
        const timeout = endpoint.includes("upload") ? 30000 : 10000;
        timeoutId = setTimeout(() => controller?.abort(), timeout);
      } catch (e) {
        console.log("⚠️ AbortController not available, skipping timeout");
      }

      const response = await fetch(url, {
        ...options,
        headers,
        ...(controller && { signal: controller.signal }),
      });

      if (timeoutId) clearTimeout(timeoutId);
      console.log("📡 Response status:", response.status);

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        console.error("❌ API Error:", data);

        // Handle 401 Unauthorized - token expired or invalid
        if (response.status === 401) {
          console.log("🔒 Unauthorized - removing token");
          await this.removeToken();
          // Note: Don't navigate here, let AuthContext handle it
        }

        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("💥 API Request Error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      console.error("🔍 Error details:", errorMessage);

      return {
        success: false,
        message: errorMessage,
        error: errorMessage,
      };
    }
  }

  // Authentication APIs
  async register(userData: {
    username: string;
    password: string;
    fullName: string;
    phone?: string;
    email?: string;
  }): Promise<ApiResponse> {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse<LoginResponse>> {
    const response = await this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data?.token) {
      await this.saveToken(response.data.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  // Customer Profile APIs
  async getProfile(): Promise<ApiResponse> {
    return this.request("/api/me/profile");
  }

  async getHistory(limit: number = 3): Promise<ApiResponse<Transaction[]>> {
    return this.request(`/api/me/history?limit=${limit}&offset=0`);
  }

  async updateProfile(profileData: {
    fullName?: string;
    phone?: string;
    email?: string;
  }): Promise<ApiResponse> {
    return this.request("/api/me/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  async topUpBalance(amount: number): Promise<ApiResponse> {
    return this.request("/api/me/topup", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  }

  async uploadAvatar(imageUri: string): Promise<ApiResponse> {
    // Ensure token is loaded
    if (!this.token) {
      await this.loadToken();
    }

    const formData = new FormData();
    const filename = imageUri.split("/").pop() || "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("avatar", {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    return this.request("/api/me/upload-avatar", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  // Station APIs
  async getStations(): Promise<ApiResponse<Station[]>> {
    return this.request("/api/stations");
  }

  async getStationDetails(
    stationId: number
  ): Promise<ApiResponse<StationDetails>> {
    return this.request(`/api/stations/${stationId}`);
  }

  async getNearbyStations(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<ApiResponse<Station[]>> {
    return this.request(
      `/api/stations/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
    );
  }

  // Transaction APIs
  async startBatterySwap(stationId: number): Promise<
    ApiResponse<{
      transactionId: number;
      assignedSlot: number;
      newBatteryUid: string;
      status: string;
    }>
  > {
    return this.request("/api/transactions/start-swap", {
      method: "POST",
      body: JSON.stringify({ stationId }),
    });
  }

  async confirmBatterySwap(
    transactionId: number,
    oldBatteryUid: string
  ): Promise<ApiResponse> {
    return this.request("/api/transactions/confirm-swap", {
      method: "POST",
      body: JSON.stringify({ transactionId, oldBatteryUid }),
    });
  }

  async cancelBatterySwap(transactionId: number): Promise<ApiResponse> {
    return this.request("/api/transactions/cancel-swap", {
      method: "POST",
      body: JSON.stringify({ transactionId }),
    });
  }

  async getTransactionStatus(transactionId: number): Promise<ApiResponse> {
    return this.request(`/api/transactions/${transactionId}/status`);
  }

  // Feedback APIs
  async sendFeedback(feedbackData: {
    content: string;
    rating: number;
  }): Promise<ApiResponse> {
    return this.request("/api/feedback", {
      method: "POST",
      body: JSON.stringify(feedbackData),
    });
  }

  // Utility Methods
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Export individual API functions for easier use
export const authAPI = {
  register: (userData: Parameters<typeof apiClient.register>[0]) =>
    apiClient.register(userData),
  login: (credentials: Parameters<typeof apiClient.login>[0]) =>
    apiClient.login(credentials),
  logout: () => apiClient.logout(),
};

export const customerAPI = {
  getProfile: () => apiClient.getProfile(),
  getHistory: (limit: number = 3) => apiClient.getHistory(limit),
  updateProfile: (data: Parameters<typeof apiClient.updateProfile>[0]) =>
    apiClient.updateProfile(data),
  topUpBalance: (amount: number) => apiClient.topUpBalance(amount),
  uploadAvatar: (imageUri: string) => apiClient.uploadAvatar(imageUri),
  createMoMoPayment: async (
    amount: number
  ): Promise<
    ApiResponse<{
      paymentUrl: string;
      orderId: string;
      deeplink?: string;
      qrCodeUrl?: string;
    }>
  > => {
    return apiClient.request("/api/payment/momo/create", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
  manualCompleteMoMo: async (
    orderId: string
  ): Promise<ApiResponse<{ balance: number; amount: number }>> => {
    return apiClient.request(`/api/payment/momo/manual-complete/${orderId}`, {
      method: "POST",
    });
  },
};

export const stationAPI = {
  getStations: () => apiClient.getStations(),
  getStationDetails: (id: number) => apiClient.getStationDetails(id),
  getNearbyStations: (lat: number, lng: number, radius?: number) =>
    apiClient.getNearbyStations(lat, lng, radius),
};

export const transactionAPI = {
  startBatterySwap: (stationId: number) =>
    apiClient.startBatterySwap(stationId),
  confirmBatterySwap: (transactionId: number, oldBatteryUid: string) =>
    apiClient.confirmBatterySwap(transactionId, oldBatteryUid),
  cancelBatterySwap: (transactionId: number) =>
    apiClient.cancelBatterySwap(transactionId),
  getTransactionStatus: (transactionId: number) =>
    apiClient.getTransactionStatus(transactionId),
};

export const feedbackAPI = {
  sendFeedback: (data: Parameters<typeof apiClient.sendFeedback>[0]) =>
    apiClient.sendFeedback(data),
};

export const reservationAPI = {
  createReservation: async (stationId: number): Promise<ApiResponse> => {
    return apiClient.request("/api/reservations", {
      method: "POST",
      body: JSON.stringify({ stationId }),
    });
  },
  getMyReservations: async (): Promise<ApiResponse> => {
    return apiClient.request("/api/reservations");
  },
  cancelReservation: async (reservationId: number): Promise<ApiResponse> => {
    return apiClient.request(`/api/reservations/${reservationId}`, {
      method: "DELETE",
    });
  },
};

export default apiClient;
