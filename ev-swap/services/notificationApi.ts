import AsyncStorage from "@react-native-async-storage/async-storage";

const API_URL = process.env.API_BASE_URL || "http://localhost:3000/api";

// Lưu token lên server
export async function saveTokenToServer(expoPushToken: string) {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      console.log("No auth token, skipping token save");
      return;
    }

    const response = await fetch(`${API_URL}/notifications/save-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expo_push_token: expoPushToken }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Token saved to server");
    } else {
      console.error("❌ Failed to save token:", data.message);
    }
  } catch (error) {
    console.error("❌ Error saving token to server:", error);
  }
}

// Xóa token khỏi server (khi logout)
export async function deleteTokenFromServer(expoPushToken: string) {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) return;

    const response = await fetch(`${API_URL}/notifications/delete-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ expo_push_token: expoPushToken }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("✅ Token deleted from server");
    }
  } catch (error) {
    console.error("❌ Error deleting token:", error);
  }
}

// Gửi thông báo đến tất cả (admin)
export async function sendNotificationToAll(
  title: string,
  body: string,
  data?: any
) {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/notifications/send-all`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ title, body, data }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error sending notification to all:", error);
    throw error;
  }
}

// Gửi thông báo đến 1 user (admin)
export async function sendNotificationToUser(
  customerId: number,
  title: string,
  body: string,
  data?: any
) {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/notifications/send-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ customer_id: customerId, title, body, data }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error sending notification to user:", error);
    throw error;
  }
}

// Lấy lịch sử gửi thông báo (admin)
export async function getNotificationHistory() {
  try {
    const authToken = await AsyncStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_URL}/notifications/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("❌ Error getting notification history:", error);
    throw error;
  }
}
