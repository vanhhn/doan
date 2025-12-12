import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRightIcon } from "../components/icons";
import { useTheme, useI18n } from "../contexts";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useApi";
import ToggleSwitch from "../components/ToggleSwitch";
import { API_BASE_URL } from "../constants";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";
import type { RootStackParamList } from "../navigation.types";

interface AccountScreenProps {
  onLogout: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AccountScreen: React.FC<AccountScreenProps> = ({ onLogout }) => {
  const navigation = useNavigation<NavigationProp>();
  const { theme, toggleTheme } = useTheme();
  const { t, language, changeLanguage } = useI18n();

  // Get real user data
  const { user } = useAuth();
  const { profile, isLoading, error, refetch } = useProfile();

  const isDark = theme === "dark";

  // Refetch profile when screen comes into focus (to sync avatar changes)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // Use real user data or fallback values
  const displayName = user?.fullName || profile?.fullName || "Người dùng";
  const displayEmail = user?.email || profile?.email || "No email";
  const displayPhone = user?.phone || profile?.phone || "";
  const displaySwaps = user?.totalSwaps ?? profile?.totalSwaps ?? 0;

  const menuItems = [
    { label: t("account.personalInfo"), screen: "PersonalInfo" as const },
    { label: t("account.settings"), screen: "Settings" as const },
    { label: t("account.helpCenter"), screen: "Help" as const },
  ];

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View
          style={[
            styles.profileSection,
            {
              backgroundColor: isDark
                ? Colors.dark.surface
                : Colors.light.surface,
              borderBottomColor: isDark ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <Image
            source={{
              uri: profile?.avatarUrl
                ? `${API_BASE_URL}${profile.avatarUrl}`
                : `https://i.pravatar.cc/100?u=${user?.username || "default"}`,
            }}
            style={styles.avatar}
          />
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.userName,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {displayName}
            </Text>
            <Text
              style={[
                styles.userEmail,
                {
                  color: isDark
                    ? Colors.dark.onSurfaceVariant
                    : Colors.light.onSurfaceVariant,
                },
              ]}
            >
              {displayEmail}
            </Text>
            {displayPhone && (
              <Text
                style={[
                  styles.userPhone,
                  {
                    color: isDark
                      ? Colors.dark.onSurfaceVariant
                      : Colors.light.onSurfaceVariant,
                  },
                ]}
              >
                📞 {displayPhone}
              </Text>
            )}
            {user?.username && (
              <Text
                style={[
                  styles.userName,
                  {
                    fontSize: FontSizes.sm,
                    fontWeight: FontWeights.normal,
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                  },
                ]}
              >
                @{user.username}
              </Text>
            )}
          </View>
        </View>

        {/* User Stats */}
        {(user?.totalSwaps !== undefined ||
          profile?.totalSwaps !== undefined ||
          displaySwaps !== undefined) && (
          <View
            style={[
              styles.statsSection,
              {
                backgroundColor: isDark
                  ? Colors.dark.surface
                  : Colors.light.surface,
              },
            ]}
          >
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                  },
                ]}
              >
                {displaySwaps}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                {t("home.totalSwaps") || "Lần đổi pin"}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statNumber,
                  {
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                  },
                ]}
              >
                {user?.currentBatteryUid ? "🔋" : "⚡"}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                {user?.currentBatteryUid ? "Có pin" : "Chưa có pin"}
              </Text>
            </View>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.menuItemText,
                  {
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              >
                {item.label}
              </Text>
              <ChevronRightIcon
                color={isDark ? "#9CA3AF" : "#6B7280"}
                size={20}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences Section */}
        <View
          style={[
            styles.preferencesSection,
            {
              backgroundColor: isDark
                ? Colors.dark.surface
                : Colors.light.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.preferencesTitle,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            {t("account.preferences")}
          </Text>

          {/* Dark Mode Toggle */}
          <View
            style={[
              styles.settingRow,
              { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
            ]}
          >
            <Text
              style={[
                styles.settingLabel,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("account.darkMode")}
            </Text>
            <ToggleSwitch isOn={theme === "dark"} handleToggle={toggleTheme} />
          </View>

          {/* Language Selector */}
          <View style={styles.settingRow}>
            <Text
              style={[
                styles.settingLabel,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("account.language")}
            </Text>
            <View style={styles.languageButtons}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === "en"
                    ? { backgroundColor: Colors.light.primary }
                    : { backgroundColor: isDark ? "#4B5563" : "#E5E7EB" },
                ]}
                onPress={() => changeLanguage("en")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    {
                      color:
                        language === "en"
                          ? "#FFFFFF"
                          : isDark
                          ? Colors.dark.onSurface
                          : Colors.light.onSurface,
                    },
                  ]}
                >
                  {t("account.english")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageButton,
                  language === "vi"
                    ? { backgroundColor: Colors.light.primary }
                    : { backgroundColor: isDark ? "#4B5563" : "#E5E7EB" },
                ]}
                onPress={() => changeLanguage("vi")}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    {
                      color:
                        language === "vi"
                          ? "#FFFFFF"
                          : isDark
                          ? Colors.dark.onSurface
                          : Colors.light.onSurface,
                    },
                  ]}
                >
                  {t("account.vietnamese")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={onLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutButtonText}>{t("account.logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  userEmail: {
    fontSize: FontSizes.md,
  },
  userPhone: {
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  statsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    textAlign: "center",
  },
  menuSection: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
  },
  menuItemText: {
    fontSize: FontSizes.md,
  },
  preferencesSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  preferencesTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: FontSizes.md,
  },
  languageButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  languageButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  languageButtonText: {
    fontSize: FontSizes.sm,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    margin: Spacing.lg,
    marginTop: Spacing.md,
  },
  logoutButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});

export default AccountScreen;
