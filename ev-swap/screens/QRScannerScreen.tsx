import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  TextInput,
  Modal,
} from "react-native";
import { Camera, CameraView } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useI18n } from "../contexts";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useApi";
import { transactionAPI } from "../services/api";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";
import type { RootStackParamList } from "../navigation.types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const QRScannerScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const isDark = theme === "dark";
  const [scanning, setScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualStationId, setManualStationId] = useState("");

  // Request camera permission
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setHasPermission(status === "granted");
      }
    })();
  }, []);

  // Simulate QR scan for web/development
  const handleManualInput = () => {
    setShowManualInput(true);
  };

  const handleManualSubmit = () => {
    if (manualStationId) {
      handleQRCodeScanned(`STATION_${manualStationId}`);
      setShowManualInput(false);
      setManualStationId("");
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanned) {
      setScanned(true);
      handleQRCodeScanned(data);
    }
  };

  const handleQRCodeScanned = async (data: string) => {
    setScanning(false);
    setScanned(true);

    try {
      let qrData: any;

      // Try to parse as JSON first (new format with action)
      try {
        qrData = JSON.parse(data);
        // Validate JSON QR data structure
        if (!qrData.stationName) {
          throw new Error("QR code không hợp lệ");
        }
      } catch (jsonError) {
        // Fallback to old format: STATION_{id}
        const stationId = parseInt(data.replace("STATION_", ""));
        if (isNaN(stationId)) {
          Alert.alert("Lỗi", "QR code không hợp lệ", [
            { text: "OK", onPress: () => setScanned(false) },
          ]);
          return;
        }
        qrData = {
          stationName: `STATION_${stationId}`,
          location: "",
          action: "swap",
        };
      }

      const stationId = parseInt(qrData.stationName.replace("STATION_", ""));

      // Navigate based on action
      switch (qrData.action) {
        case "info":
          // Just show station info
          navigation.navigate("StationDetails", {
            id: stationId.toString(),
          });
          setScanned(false);
          break;

        case "reserve":
          // Navigate to station details with reservation mode
          navigation.navigate("StationDetails", {
            id: stationId.toString(),
          });
          setScanned(false);
          break;

        case "swap":
        default:
          // Swap flow - check balance first
          const userBalance = profile?.balance || 0;
          const swapCost = 7000;

          if (userBalance < swapCost) {
            Alert.alert(
              "Số dư không đủ",
              `Cần ${swapCost.toLocaleString()}đ để đổi pin. Số dư hiện tại: ${userBalance.toLocaleString()}đ`,
              [
                {
                  text: "Nạp tiền",
                  onPress: () => {
                    navigation.navigate("Main", { screen: "Wallet" });
                    setScanned(false);
                  },
                },
                {
                  text: "Đóng",
                  style: "cancel",
                  onPress: () => setScanned(false),
                },
              ]
            );
            return;
          }

          // Show welcome message first
          Alert.alert(
            `🎉 Chào mừng đến ${qrData.stationName}!`,
            `${
              qrData.location ? qrData.location + "\n\n" : ""
            }Bạn có muốn đổi pin không?\n\nPhí đổi pin: ${swapCost.toLocaleString()}đ\nSố dư hiện tại: ${userBalance.toLocaleString()}đ`,
            [
              {
                text: "Hủy",
                style: "cancel",
                onPress: () => setScanned(false),
              },
              {
                text: "Xác nhận đổi pin",
                onPress: async () => {
                  try {
                    console.log(
                      `🔄 Bắt đầu giao dịch - Số dư hiện tại: ${userBalance}đ`
                    );

                    // Start battery swap transaction
                    const result = await transactionAPI.startBatterySwap(
                      stationId
                    );

                    if (result.success && result.data) {
                      console.log(
                        "✅ Giao dịch thành công, đang refresh profile..."
                      );

                      // Refresh both AuthContext user and Profile
                      await Promise.all([refreshUser(), refetchProfile()]);

                      // Delay để đảm bảo state đã cập nhật hoàn toàn
                      await new Promise((resolve) => setTimeout(resolve, 500));

                      console.log(
                        `💰 Đã trừ ${swapCost}đ - Kiểm tra số dư mới trên trang chủ`
                      );

                      // Show success message
                      Alert.alert(
                        "✅ Đổi pin thành công!",
                        `Đã trừ ${swapCost.toLocaleString(
                          "vi-VN"
                        )}đ\n\nVui lòng lấy pin tại khay số ${
                          result.data.slotNumber || "N/A"
                        }`,
                        [
                          {
                            text: "OK",
                            onPress: () => {
                              setScanned(false);
                              navigation.goBack();
                            },
                          },
                        ]
                      );
                    } else {
                      console.error("❌ Giao dịch thất bại:", result.message);
                      Alert.alert(
                        "Lỗi",
                        result.message || "Không thể bắt đầu giao dịch",
                        [{ text: "OK", onPress: () => setScanned(false) }]
                      );
                    }
                  } catch (error) {
                    console.error("Transaction error:", error);
                    Alert.alert(
                      "Lỗi",
                      "Có lỗi xảy ra khi thực hiện giao dịch",
                      [{ text: "OK", onPress: () => setScanned(false) }]
                    );
                  }
                },
              },
            ]
          );
          break;
      }
    } catch (error) {
      console.error("QR Scan error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi quét QR code", [
        { text: "OK", onPress: () => setScanned(false) },
      ]);
    }
  };

  // For web platform, show manual input
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? Colors.dark.background
              : Colors.light.background,
          },
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            📱 {t("qrScanner.title")}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : Colors.light.textSecondary,
              },
            ]}
          >
            {t("qrScanner.subtitle")}
          </Text>

          <View style={styles.qrFrame}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
            <Text style={styles.qrText}>📷</Text>
            <Text
              style={[styles.qrSubtext, { color: Colors.light.textSecondary }]}
            >
              {t("qrScanner.cameraUnavailable")}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: isDark
                  ? Colors.dark.primary
                  : Colors.light.primary,
              },
            ]}
            onPress={handleManualInput}
          >
            <Text style={styles.scanButtonText}>
              ⌨️ {t("qrScanner.manualInput")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={[
                styles.cancelButtonText,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              {t("qrScanner.cancel")}
            </Text>
          </TouchableOpacity>

          {/* QR Code Examples */}
          <View style={styles.examplesContainer}>
            <Text
              style={[
                styles.examplesTitle,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              {t("qrScanner.examples")}
            </Text>
            {[1, 2, 3, 4, 5, 6].map((id) => (
              <TouchableOpacity
                key={id}
                style={[
                  styles.exampleButton,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.surface
                      : Colors.light.surface,
                  },
                ]}
                onPress={() => handleQRCodeScanned(`STATION_${id}`)}
              >
                <Text
                  style={[
                    styles.exampleText,
                    {
                      color: isDark
                        ? Colors.dark.onSurface
                        : Colors.light.onSurface,
                    },
                  ]}
                >
                  📍 {t("qrScanner.station")} {id}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Manual Input Modal */}
          <Modal
            visible={showManualInput}
            transparent
            animationType="slide"
            onRequestClose={() => setShowManualInput(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.surface
                      : Colors.light.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.modalTitle,
                    {
                      color: isDark
                        ? Colors.dark.onSurface
                        : Colors.light.onSurface,
                    },
                  ]}
                >
                  {t("qrScanner.enterStationId")}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark
                        ? Colors.dark.background
                        : Colors.light.background,
                      borderColor: isDark
                        ? Colors.dark.border
                        : Colors.light.border,
                      color: isDark ? Colors.dark.text : Colors.light.text,
                    },
                  ]}
                  placeholder={t("qrScanner.enterIdPlaceholder")}
                  placeholderTextColor={
                    isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary
                  }
                  value={manualStationId}
                  onChangeText={setManualStationId}
                  keyboardType="number-pad"
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalCancelButton]}
                    onPress={() => {
                      setShowManualInput(false);
                      setManualStationId("");
                    }}
                  >
                    <Text style={styles.modalCancelText}>
                      {t("qrScanner.cancel")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalSubmitButton,
                      {
                        backgroundColor: isDark
                          ? Colors.dark.primary
                          : Colors.light.primary,
                      },
                    ]}
                    onPress={handleManualSubmit}
                  >
                    <Text style={styles.modalSubmitText}>
                      {t("qrScanner.confirm")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    );
  }

  // For native platforms, use actual camera
  if (Platform.OS !== "web" && hasPermission === null) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? Colors.dark.background
              : Colors.light.background,
          },
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            🔄 {t("qrScanner.loading")}
          </Text>
        </View>
      </View>
    );
  }

  if (Platform.OS !== "web" && hasPermission === false) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark
              ? Colors.dark.background
              : Colors.light.background,
          },
        ]}
      >
        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            ⚠️ {t("qrScanner.noPermission")}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : Colors.light.textSecondary,
              },
            ]}
          >
            {t("qrScanner.permissionMessage")}
          </Text>
          <TouchableOpacity
            style={[
              styles.scanButton,
              {
                backgroundColor: isDark
                  ? Colors.dark.primary
                  : Colors.light.primary,
              },
            ]}
            onPress={handleManualInput}
          >
            <Text style={styles.scanButtonText}>
              ⌨️ {t("qrScanner.manualInput")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text
              style={[
                styles.cancelButtonText,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              {t("qrScanner.back")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (Platform.OS !== "web" && hasPermission) {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.qrFrameCamera}>
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <Text style={styles.scanInstruction}>
              {t("qrScanner.scanInstruction")}
            </Text>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.manualButton,
                {
                  backgroundColor: isDark
                    ? Colors.dark.surface
                    : Colors.light.surface,
                },
              ]}
              onPress={handleManualInput}
            >
              <Text
                style={[
                  styles.manualButtonText,
                  {
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              >
                ⌨️ {t("qrScanner.manualInput")}
              </Text>
            </TouchableOpacity>
            {scanned && (
              <TouchableOpacity
                style={[
                  styles.rescanButton,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.primary
                      : Colors.light.primary,
                  },
                ]}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.rescanButtonText}>
                  🔄 {t("qrScanner.rescan")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Manual Input Modal */}
        <Modal
          visible={showManualInput}
          transparent
          animationType="slide"
          onRequestClose={() => setShowManualInput(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark
                    ? Colors.dark.surface
                    : Colors.light.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              >
                {t("qrScanner.enterStationId")}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.background
                      : Colors.light.background,
                    borderColor: isDark
                      ? Colors.dark.border
                      : Colors.light.border,
                    color: isDark ? Colors.dark.text : Colors.light.text,
                  },
                ]}
                placeholder={t("qrScanner.enterIdPlaceholder")}
                placeholderTextColor={
                  isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary
                }
                value={manualStationId}
                onChangeText={setManualStationId}
                keyboardType="number-pad"
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalCancelButton]}
                  onPress={() => {
                    setShowManualInput(false);
                    setManualStationId("");
                  }}
                >
                  <Text style={styles.modalCancelText}>
                    {t("qrScanner.cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.modalSubmitButton,
                    {
                      backgroundColor: isDark
                        ? Colors.dark.primary
                        : Colors.light.primary,
                    },
                  ]}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.modalSubmitText}>
                    {t("qrScanner.confirm")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  qrFrame: {
    width: 300,
    height: 300,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  cornerTopLeft: {
    position: "absolute",
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.light.primary,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.light.primary,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: "absolute",
    bottom: 20,
    left: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: Colors.light.primary,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: Colors.light.primary,
    borderBottomRightRadius: 8,
  },
  qrText: {
    fontSize: 80,
    marginBottom: Spacing.sm,
  },
  qrSubtext: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  scanButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    minWidth: 200,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  cancelButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  cancelButtonText: {
    fontSize: FontSizes.base,
    textDecorationLine: "underline",
  },
  examplesContainer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
  examplesTitle: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  exampleButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    alignItems: "center",
  },
  exampleText: {
    fontSize: FontSizes.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  header: {
    padding: Spacing.lg,
    alignItems: "flex-end",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: FontWeights.bold,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  qrFrameCamera: {
    width: 250,
    height: 250,
    position: "relative",
  },
  scanInstruction: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    marginTop: Spacing.lg,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  manualButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    minWidth: 200,
    alignItems: "center",
  },
  manualButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  rescanButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    minWidth: 200,
    alignItems: "center",
  },
  rescanButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  modalTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  modalCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: Spacing.sm,
  },
  modalCancelText: {
    color: Colors.light.textSecondary,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  modalSubmitButton: {
    marginLeft: Spacing.sm,
  },
  modalSubmitText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
});

export default QRScannerScreen;
