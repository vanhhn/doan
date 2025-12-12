import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../contexts";
import { useAlert } from "../hooks/useAlert";
import CustomAlert from "../components/CustomAlert";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";
import type { RootStackParamList } from "../navigation.types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TestAlertScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { alertConfig, showAlert, hideAlert } = useAlert();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Test Thông Báo</Text>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Alert Thành công */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#10B981" }]}
          onPress={() =>
            showAlert(
              "Thành công",
              "Đặt chỗ thành công! Vui lòng đến trạm trong vòng 30 phút."
            )
          }
        >
          <Text style={styles.buttonText}>✅ Thông báo Thành công</Text>
        </TouchableOpacity>

        {/* Alert Lỗi */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#EF4444" }]}
          onPress={() =>
            showAlert(
              "Lỗi",
              "Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại."
            )
          }
        >
          <Text style={styles.buttonText}>❌ Thông báo Lỗi</Text>
        </TouchableOpacity>

        {/* Alert Thông tin */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#3B82F6" }]}
          onPress={() =>
            showAlert(
              "Thông báo",
              "Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày mai."
            )
          }
        >
          <Text style={styles.buttonText}>ℹ️ Thông báo Thông tin</Text>
        </TouchableOpacity>

        {/* Alert với 2 nút */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#8B5CF6" }]}
          onPress={() =>
            showAlert(
              "Xác nhận",
              "Bạn có chắc muốn đặt chỗ tại trạm STATION_01?",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Đồng ý",
                  onPress: () => console.log("✅ Đã xác nhận"),
                },
              ]
            )
          }
        >
          <Text style={styles.buttonText}>🔔 Alert với 2 nút</Text>
        </TouchableOpacity>

        {/* Alert Nguy hiểm */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#DC2626" }]}
          onPress={() =>
            showAlert(
              "Cảnh báo",
              "Bạn có chắc muốn xóa tài khoản? Hành động này không thể hoàn tác!",
              [
                { text: "Hủy", style: "cancel" },
                {
                  text: "Xóa",
                  style: "destructive",
                  onPress: () => console.log("🗑️ Đã xóa"),
                },
              ]
            )
          }
        >
          <Text style={styles.buttonText}>⚠️ Alert Nguy hiểm</Text>
        </TouchableOpacity>

        {/* Alert đơn giản */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#6B7280" }]}
          onPress={() =>
            showAlert("Chào mừng", "Chào mừng bạn đến với EV Swap!")
          }
        >
          <Text style={styles.buttonText}>👋 Alert đơn giản</Text>
        </TouchableOpacity>

        {/* Alert dài */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#F59E0B" }]}
          onPress={() =>
            showAlert(
              "Điều khoản sử dụng",
              "Bằng cách sử dụng dịch vụ này, bạn đồng ý với các điều khoản và điều kiện của chúng tôi. Vui lòng đọc kỹ trước khi tiếp tục. Nếu không đồng ý, vui lòng không sử dụng dịch vụ.",
              [{ text: "Không đồng ý", style: "cancel" }, { text: "Đồng ý" }]
            )
          }
        >
          <Text style={styles.buttonText}>📜 Alert với nội dung dài</Text>
        </TouchableOpacity>

        {/* Navigate to Notification Test */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: "#10B981" }]}
          onPress={() => navigation.navigate("NotificationTest")}
        >
          <Text style={styles.buttonText}>
            📱 Test Push Notification (Khuyến mãi)
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
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
    marginVertical: Spacing.xl,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  button: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});

export default TestAlertScreen;
