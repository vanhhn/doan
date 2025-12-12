import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Svg, { Circle } from "react-native-svg";
import { useTheme, useI18n } from "../contexts";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useApi";
import {
  MapMarkerIcon,
  WalletIcon,
  ClockIcon,
  HelpCircleIcon,
  BellIcon,
} from "../components/icons";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation.types";

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface BatteryIndicatorProps {
  percentage: number;
}

const BatteryIndicator: React.FC<BatteryIndicatorProps> = ({ percentage }) => {
  const { colors } = useTheme();
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.batteryContainer}>
      <Svg width={160} height={160} viewBox="0 0 120 120">
        <Circle
          stroke={colors.border}
          strokeWidth="10"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
        />
        <Circle
          stroke={colors.primary}
          strokeWidth="10"
          fill="transparent"
          r="52"
          cx="60"
          cy="60"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          rotation="-90"
          origin="60, 60"
        />
      </Svg>
      <View style={styles.batteryTextContainer}>
        <Text style={[styles.batteryPercentage, { color: colors.text }]}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

interface QuickActionButtonProps {
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  onPress,
  icon,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.actionButton, { backgroundColor: colors.surface }]}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.actionIconContainer,
          { backgroundColor: colors.primaryLight },
        ]}
      >
        {icon}
      </View>
      <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const { profile, isLoading, refetch } = useProfile();

  const [refreshing, setRefreshing] = useState(false);

  // Refetch profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Tính toán % pin từ thông tin user (mặc định 85%)
  const batteryPercentage = 85;
  const estimatedRange = Math.round(batteryPercentage * 0.85); // Ước tính km

  const actions = [
    {
      label: t("home.findStation"),
      onPress: () => navigation.navigate("Main", { screen: "Map" }),
      icon: <MapMarkerIcon color={colors.primary} size={24} />,
    },
    {
      label: "Đặt trước",
      onPress: () => navigation.navigate("Reservation"),
      icon: <ClockIcon color={colors.primary} size={24} />,
    },
    {
      label: t("home.history"),
      onPress: () => navigation.navigate("History"),
      icon: <ClockIcon color={colors.primary} size={24} />,
    },
    {
      label: t("home.payment"),
      onPress: () => navigation.navigate("Main", { screen: "Wallet" }),
      icon: <WalletIcon color={colors.primary} size={24} />,
    },
    {
      label: t("home.support"),
      onPress: () => navigation.navigate("Support"),
      icon: <HelpCircleIcon color={colors.primary} size={24} />,
    },
    {
      label: "🔔 Test Alert",
      onPress: () => navigation.navigate("TestAlert"),
      icon: <BellIcon color={colors.primary} size={24} />,
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Message */}
      <View style={styles.welcomeContainer}>
        <Text style={[styles.welcomeText, { color: colors.text }]}>
          {t("home.welcome")}, {user?.fullName || profile?.fullName}! 👋
        </Text>
        <Text style={[styles.totalSwapsText, { color: colors.textSecondary }]}>
          {t("home.totalSwaps")}: {profile?.totalSwaps || 0} {t("home.swaps")}
        </Text>
      </View>

      {/* Battery Card */}
      <View style={[styles.batteryCard, { backgroundColor: colors.surface }]}>
        {/* QR Scanner Button */}
        <TouchableOpacity
          style={[
            styles.qrScannerButton,
            { backgroundColor: colors.primaryLight },
          ]}
          onPress={() => navigation.navigate("QRScanner")}
          activeOpacity={0.8}
        >
          <View style={styles.qrIconContainer}>
            <Text style={styles.qrIcon}>📷</Text>
          </View>
          <Text style={[styles.qrScannerTitle, { color: colors.primary }]}>
            {t("home.qrScanner") || "Quét mã QR"}
          </Text>
          <Text
            style={[styles.qrScannerSubtitle, { color: colors.textSecondary }]}
          >
            Quét QR tại trạm để đổi pin
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.swapButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate("Main", { screen: "Map" })}
          activeOpacity={0.8}
        >
          <Text style={styles.swapButtonText}>{t("home.swapButton")}</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsGrid}>
        {actions.map((action, index) => (
          <QuickActionButton
            key={`${action.label}-${index}`}
            label={action.label}
            onPress={action.onPress}
            icon={action.icon}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  content: {
    padding: Spacing.md,
  },
  batteryCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrScannerButton: {
    width: "100%",
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  qrIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  qrIcon: {
    fontSize: 48,
  },
  qrScannerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  qrScannerSubtitle: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  batteryIndicatorWrapper: {
    marginBottom: Spacing.md,
  },
  batteryContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  batteryTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: 160,
    height: 160,
  },
  batteryPercentage: {
    fontSize: FontSizes["4xl"],
    fontWeight: FontWeights.bold,
  },
  rangeText: {
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  welcomeContainer: {
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  totalSwapsText: {
    fontSize: FontSizes.sm,
  },
  swapButton: {
    width: "100%",
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  swapButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionButton: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    textAlign: "center",
  },
});

export default HomeScreen;
