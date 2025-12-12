import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useTheme } from "../contexts";
import {
  registerForPushNotificationsAsync,
  sendPromotionNotification,
  schedulePromotionNotification,
  cancelAllScheduledNotifications,
  PromotionTemplates,
} from "../services/notifications";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";

const NotificationTestScreen: React.FC = () => {
  const { colors } = useTheme();
  const [expoPushToken, setExpoPushToken] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [scheduleSeconds, setScheduleSeconds] = useState("5");
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // Đăng ký nhận push notification
    registerForPushNotificationsAsync()
      .then((token) => {
        if (token) {
          setExpoPushToken(token);
          setNotificationEnabled(true);
        } else {
          setNotificationEnabled(false);
          setExpoPushToken("Không khả dụng trong Expo Go");
        }
      })
      .catch((error) => {
        console.log("❌ Error registering for notifications:", error);
        setNotificationEnabled(false);
        setExpoPushToken("Lỗi đăng ký thông báo");
      });

    // Listener khi nhận thông báo
    notificationListener.current =
      Notifications.addNotificationReceivedListener(
        (notification: Notifications.Notification) => {
          console.log("📨 Notification received:", notification);
        }
      );

    // Listener khi user tương tác với thông báo
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("👆 Notification tapped:", response);
          const data = response.notification.request.content.data;
          Alert.alert(
            "Bạn đã nhấn vào thông báo!",
            `Type: ${data.type || "unknown"}`
          );
        }
      );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const handleSendNow = async (template: any) => {
    try {
      await sendPromotionNotification(
        template.title,
        template.body,
        template.data
      );
      Alert.alert("Thành công", "Thông báo đã được gửi!");
    } catch (error) {
      Alert.alert("Lỗi", "Không thể gửi thông báo");
      console.error(error);
    }
  };

  const handleSchedule = async (template: any) => {
    try {
      const seconds = parseInt(scheduleSeconds) || 5;
      const id = await schedulePromotionNotification(
        template.title,
        template.body,
        seconds,
        template.data
      );
      Alert.alert(
        "Đã lên lịch",
        `Thông báo sẽ hiển thị sau ${seconds} giây\nID: ${id}`
      );
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lên lịch thông báo");
      console.error(error);
    }
  };

  const handleCancelAll = async () => {
    await cancelAllScheduledNotifications();
    Alert.alert("Thành công", "Đã hủy tất cả thông báo đã lên lịch");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Test Thông Báo Khuyến Mãi
      </Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Trạng thái */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Trạng thái
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Push Notification
            </Text>
            <Switch
              value={notificationEnabled}
              disabled
              trackColor={{ false: "#767577", true: colors.primary }}
            />
          </View>
          {expoPushToken ? (
            <View>
              <Text
                style={[styles.tokenText, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {expoPushToken.includes("Không khả dụng") ||
                expoPushToken.includes("Lỗi")
                  ? `⚠️ ${expoPushToken}`
                  : `Token: ${expoPushToken.substring(0, 40)}...`}
              </Text>
              {!notificationEnabled && (
                <Text style={[styles.warningText, { color: "#F59E0B" }]}>
                  ℹ️ Push notifications cần development build (không hoạt động
                  trong Expo Go từ SDK 53+)
                </Text>
              )}
            </View>
          ) : null}
        </View>

        {/* Cài đặt lên lịch */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Lên lịch thông báo
          </Text>
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Sau (giây):
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={scheduleSeconds}
              onChangeText={setScheduleSeconds}
              keyboardType="number-pad"
            />
          </View>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: "#EF4444" }]}
            onPress={handleCancelAll}
          >
            <Text style={styles.buttonText}>🗑️ Hủy tất cả lịch</Text>
          </TouchableOpacity>
        </View>

        {/* Các template khuyến mãi */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Gửi Thông Báo
        </Text>

        <NotificationCard
          emoji="🎉"
          title="Giảm 30%"
          onSendNow={() => handleSendNow(PromotionTemplates.discount(30))}
          onSchedule={() => handleSchedule(PromotionTemplates.discount(30))}
        />

        <NotificationCard
          emoji="🎁"
          title="Miễn phí đổi pin"
          onSendNow={() => handleSendNow(PromotionTemplates.freeSwap())}
          onSchedule={() => handleSchedule(PromotionTemplates.freeSwap())}
        />

        <NotificationCard
          emoji="💰"
          title="Nạp tiền +20%"
          onSendNow={() => handleSendNow(PromotionTemplates.topUpBonus(20))}
          onSchedule={() => handleSchedule(PromotionTemplates.topUpBonus(20))}
        />

        <NotificationCard
          emoji="⚡"
          title="Flash Sale 2H"
          onSendNow={() => handleSendNow(PromotionTemplates.flashSale(2))}
          onSchedule={() => handleSchedule(PromotionTemplates.flashSale(2))}
        />

        <NotificationCard
          emoji="🌟"
          title="Happy Hour 18h-20h"
          onSendNow={() =>
            handleSendNow(PromotionTemplates.happyHour("18:00", "20:00"))
          }
          onSchedule={() =>
            handleSchedule(PromotionTemplates.happyHour("18:00", "20:00"))
          }
        />

        <NotificationCard
          emoji="🔋"
          title="Pin yếu 20%"
          onSendNow={() => handleSendNow(PromotionTemplates.lowBattery(20))}
          onSchedule={() => handleSchedule(PromotionTemplates.lowBattery(20))}
        />

        <NotificationCard
          emoji="🆕"
          title="Trạm mới"
          onSendNow={() =>
            handleSendNow(PromotionTemplates.newStation("STATION_07"))
          }
          onSchedule={() =>
            handleSchedule(PromotionTemplates.newStation("STATION_07"))
          }
        />
      </ScrollView>
    </View>
  );
};

interface NotificationCardProps {
  emoji: string;
  title: string;
  onSendNow: () => void;
  onSchedule: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  emoji,
  title,
  onSendNow,
  onSchedule,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.notifCard, { backgroundColor: colors.surface }]}>
      <View style={styles.notifHeader}>
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.notifTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View style={styles.notifButtons}>
        <TouchableOpacity
          style={[styles.notifButton, { backgroundColor: colors.primary }]}
          onPress={onSendNow}
        >
          <Text style={styles.notifButtonText}>Gửi ngay</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.notifButton, { backgroundColor: "#8B5CF6" }]}
          onPress={onSchedule}
        >
          <Text style={styles.notifButtonText}>Lên lịch</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginVertical: Spacing.lg,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: FontSizes.md,
  },
  tokenText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.sm,
  },
  input: {
    width: 80,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    textAlign: "center",
    fontSize: FontSizes.md,
  },
  cancelButton: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  notifCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notifHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  emoji: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  notifTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  notifButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  notifButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  notifButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  warningText: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
    lineHeight: 18,
  },
});

export default NotificationTestScreen;
