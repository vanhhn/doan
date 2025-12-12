import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Svg, Path } from "react-native-svg";
import { useTheme } from "../contexts";
import { Colors, Spacing, FontSizes, FontWeights } from "../theme";
import type { RootStackParamList } from "../navigation.types";

type MoMoPaymentRouteProp = RouteProp<RootStackParamList, "MoMoPayment">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MoMoPaymentScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<MoMoPaymentRouteProp>();
  const { paymentUrl, orderId, amount } = route.params || {};

  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = (navState: any) => {
    const { url } = navState;
    console.log("WebView URL:", url);

    // Kiểm tra URL callback từ MoMo
    if (url.includes("/payment/success") || url.includes("resultCode=0")) {
      // Thanh toán thành công
      Alert.alert(
        "Thành công",
        "Nạp tiền thành công!",
        [
          {
            text: "OK",
            onPress: () => {
              navigation.goBack();
            },
          },
        ],
        { cancelable: false }
      );
    } else if (url.includes("/payment/failed") || url.includes("resultCode=")) {
      // Thanh toán thất bại hoặc hủy
      const resultCode = url.match(/resultCode=(\d+)/)?.[1];
      if (resultCode && resultCode !== "0") {
        Alert.alert(
          "Thất bại",
          "Thanh toán không thành công. Vui lòng thử lại.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.goBack();
              },
            },
          ],
          { cancelable: false }
        );
      }
    }

    setCanGoBack(navState.canGoBack);
  };

  const handleGoBack = () => {
    if (canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
    } else {
      Alert.alert("Hủy thanh toán?", "Bạn có chắc muốn hủy giao dịch này?", [
        {
          text: "Không",
          style: "cancel",
        },
        {
          text: "Hủy",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  if (!paymentUrl) {
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
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke={isDark ? Colors.dark.onSurface : Colors.light.onSurface}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            Thanh toán MoMo
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text
            style={[
              styles.errorText,
              { color: isDark ? Colors.dark.error : Colors.light.error },
            ]}
          >
            Không thể tải trang thanh toán
          </Text>
        </View>
      </View>
    );
  }

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke={isDark ? Colors.dark.onSurface : Colors.light.onSurface}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: isDark ? Colors.dark.onSurface : Colors.light.onSurface },
          ]}
        >
          Thanh toán MoMo
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Payment Info */}
      <View
        style={[
          styles.infoContainer,
          {
            backgroundColor: isDark
              ? Colors.dark.surface
              : Colors.light.surface,
          },
        ]}
      >
        <Text
          style={[
            styles.infoLabel,
            {
              color: isDark
                ? Colors.dark.textSecondary
                : Colors.light.textSecondary,
            },
          ]}
        >
          Số tiền nạp
        </Text>
        <Text
          style={[
            styles.infoAmount,
            { color: isDark ? Colors.dark.primary : Colors.light.primary },
          ]}
        >
          {amount?.toLocaleString()}đ
        </Text>
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: paymentUrl }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color={isDark ? Colors.dark.primary : Colors.light.primary}
            />
            <Text
              style={[
                styles.loadingText,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              Đang tải...
            </Text>
          </View>
        )}
      />

      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            {
              backgroundColor: isDark
                ? Colors.dark.background
                : Colors.light.background,
            },
          ]}
        >
          <ActivityIndicator
            size="large"
            color={isDark ? Colors.dark.primary : Colors.light.primary}
          />
          <Text
            style={[
              styles.loadingText,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : Colors.light.textSecondary,
              },
            ]}
          >
            Đang tải trang thanh toán...
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
  },
  infoContainer: {
    padding: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  infoAmount: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSizes.md,
    textAlign: "center",
  },
});

export default MoMoPaymentScreen;
