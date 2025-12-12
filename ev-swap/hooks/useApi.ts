import { useState, useEffect, useCallback } from "react";
import {
  stationAPI,
  transactionAPI,
  customerAPI,
  feedbackAPI,
} from "../services/api";
import type { Station, StationDetails, Transaction } from "../services/api";

// Hook để quản lý danh sách stations
export const useStations = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await stationAPI.getStations();
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải danh sách trạm");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStations();
  }, [fetchStations]);

  return { stations, isLoading, error, refetch: fetchStations };
};

// Hook để lấy stations gần đây
export const useNearbyStations = (
  latitude?: number,
  longitude?: number,
  radius?: number
) => {
  const [stations, setStations] = useState<Station[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearbyStations = useCallback(async () => {
    if (!latitude || !longitude) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await stationAPI.getNearbyStations(
        latitude,
        longitude,
        radius
      );
      if (response.success && response.data) {
        setStations(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải trạm gần đây");
    } finally {
      setIsLoading(false);
    }
  }, [latitude, longitude, radius]);

  useEffect(() => {
    if (latitude && longitude) {
      fetchNearbyStations();
    }
  }, [fetchNearbyStations]);

  return { stations, isLoading, error, refetch: fetchNearbyStations };
};

// Hook để lấy chi tiết station
export const useStationDetails = (stationId?: number) => {
  const [stationDetails, setStationDetails] = useState<StationDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStationDetails = useCallback(async () => {
    if (!stationId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await stationAPI.getStationDetails(stationId);
      if (response.success && response.data) {
        setStationDetails(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải chi tiết trạm");
    } finally {
      setIsLoading(false);
    }
  }, [stationId]);

  useEffect(() => {
    if (stationId) {
      fetchStationDetails();
    }
  }, [fetchStationDetails]);

  return { stationDetails, isLoading, error, refetch: fetchStationDetails };
};

// Hook để quản lý battery swap process
export const useBatterySwap = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTransaction, setCurrentTransaction] = useState<any>(null);

  const startSwap = useCallback(async (stationId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await transactionAPI.startBatterySwap(stationId);
      if (response.success && response.data) {
        setCurrentTransaction(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMsg = "Có lỗi xảy ra khi bắt đầu đổi pin";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmSwap = useCallback(
    async (transactionId: number, oldBatteryUid: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await transactionAPI.confirmBatterySwap(
          transactionId,
          oldBatteryUid
        );
        if (response.success) {
          setCurrentTransaction(null);
          return { success: true, message: response.message };
        } else {
          setError(response.message);
          return { success: false, message: response.message };
        }
      } catch (err) {
        const errorMsg = "Có lỗi xảy ra khi xác nhận đổi pin";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancelSwap = useCallback(async (transactionId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await transactionAPI.cancelBatterySwap(transactionId);
      if (response.success) {
        setCurrentTransaction(null);
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMsg = "Có lỗi xảy ra khi hủy giao dịch";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    currentTransaction,
    startSwap,
    confirmSwap,
    cancelSwap,
    clearError: () => setError(null),
  };
};

// Hook để lấy transaction history
export const useTransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerAPI.getHistory(3); // Lấy 3 giao dịch gần nhất
      if (response.success && response.data) {
        // Handle both array response and paginated response
        const transactionData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).transactions || [];
        setTransactions(transactionData);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải lịch sử giao dịch");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { transactions, isLoading, error, refetch: fetchHistory };
};

// Hook để gửi feedback
export const useFeedback = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendFeedback = useCallback(async (content: string, rating: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await feedbackAPI.sendFeedback({ content, rating });
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (err) {
      const errorMsg = "Có lỗi xảy ra khi gửi feedback";
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    sendFeedback,
    isLoading,
    error,
    clearError: () => setError(null),
  };
};

// Hook để quản lý user profile
export const useProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await customerAPI.getProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi tải thông tin profile");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (profileData: {
      fullName?: string;
      phone?: string;
      email?: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await customerAPI.updateProfile(profileData);
        if (response.success && response.data) {
          setProfile(response.data);
          return { success: true, message: response.message };
        } else {
          setError(response.message);
          return { success: false, message: response.message };
        }
      } catch (err) {
        const errorMsg = "Có lỗi xảy ra khi cập nhật profile";
        setError(errorMsg);
        return { success: false, message: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    refetch: fetchProfile,
    clearError: () => setError(null),
  };
};
