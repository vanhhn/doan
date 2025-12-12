import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import Constants from "expo-constants";
import { saveTokenToServer } from "./notificationApi";

// Cấu hình cách thông báo hiển thị khi app đang mở
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Đăng ký nhận thông báo push
export async function registerForPushNotificationsAsync() {
  let token;

  // Kiểm tra nếu đang chạy trong Expo Go
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    console.log("⚠️ Push notifications không hỗ trợ trong Expo Go từ SDK 53+");
    console.log("ℹ️ Sử dụng development build để test push notifications");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Cần cấp quyền",
        "Bạn cần cấp quyền thông báo để nhận ưu đãi!"
      );
      return;
    }

    try {
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })
      ).data;

      console.log("Push notification token:", token);

      // Lưu token lên server
      await saveTokenToServer(token);
    } catch (error) {
      console.log("⚠️ Không thể lấy push token:", error);
      return null;
    }
  } else {
    Alert.alert("Lưu ý", "Phải sử dụng thiết bị thật để nhận thông báo push");
  }

  return token;
}

// Gửi thông báo khuyến mãi ngay lập tức
export async function sendPromotionNotification(
  title: string,
  body: string,
  data?: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
    },
    trigger: null, // null = gửi ngay lập tức
  });
}

// Lên lịch thông báo khuyến mãi
export async function schedulePromotionNotification(
  title: string,
  body: string,
  seconds: number,
  data?: any
) {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      vibrate: [0, 250, 250, 250],
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });

  return id;
}

// Hủy tất cả thông báo đã lên lịch
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Hủy một thông báo cụ thể
export async function cancelNotification(notificationId: string) {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

// Các thông báo khuyến mãi mẫu
export const PromotionTemplates = {
  // Khuyến mãi giảm giá
  discount: (percent: number) => ({
    title: `🎉 Giảm ${percent}% Hôm Nay!`,
    body: `Đổi pin ngay hôm nay và nhận ưu đãi ${percent}%. Chỉ trong ngày!`,
    data: { type: "discount", value: percent },
  }),

  // Miễn phí lần đổi pin
  freeSwap: () => ({
    title: "🎁 Lần Đổi Pin Miễn Phí!",
    body: "Khách hàng mới đổi pin miễn phí lần đầu. Đăng ký ngay!",
    data: { type: "free_swap" },
  }),

  // Nạp tiền khuyến mãi
  topUpBonus: (bonus: number) => ({
    title: `💰 Nạp Tiền Nhận ${bonus}% Thưởng!`,
    body: `Nạp từ 100k nhận thêm ${bonus}% vào ví. Ưu đãi có hạn!`,
    data: { type: "topup_bonus", value: bonus },
  }),

  // Flash sale
  flashSale: (hours: number) => ({
    title: `⚡ Flash Sale - Chỉ ${hours}H!`,
    body: `Giảm 50% phí đổi pin trong ${hours} giờ tới. Nhanh tay!`,
    data: { type: "flash_sale", duration: hours },
  }),

  // Khuyến mãi theo thời gian
  happyHour: (start: string, end: string) => ({
    title: `🌟 Happy Hour ${start}-${end}!`,
    body: `Giảm 30% trong khung giờ vàng. Đừng bỏ lỡ!`,
    data: { type: "happy_hour", start, end },
  }),

  // Tích điểm
  loyaltyPoints: (points: number) => ({
    title: "⭐ Tích Điểm - Đổi Quà!",
    body: `Bạn có ${points} điểm. Đổi ngay để nhận quà hấp dẫn!`,
    data: { type: "loyalty_points", points },
  }),

  // Nhắc nhở pin yếu
  lowBattery: (percent: number) => ({
    title: `🔋 Pin Còn ${percent}%!`,
    body: "Tìm trạm đổi pin gần nhất ngay để không bị hết pin!",
    data: { type: "low_battery", level: percent },
  }),

  // Trạm mới
  newStation: (stationName: string) => ({
    title: "🆕 Trạm Mới Gần Bạn!",
    body: `${stationName} vừa khai trương. Ghé thăm nhận ưu đãi!`,
    data: { type: "new_station", name: stationName },
  }),
};
