import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "../components/Header";
import ToggleSwitch from "../components/ToggleSwitch";
import { useTheme, useI18n } from "../contexts";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";

interface SettingsRowProps {
  label: string;
  children: React.ReactNode;
  isDark: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  children,
  isDark,
}) => (
  <View
    style={[
      styles.settingsRow,
      { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
    ]}
  >
    <Text
      style={[
        styles.settingsLabel,
        { color: isDark ? Colors.dark.onSurface : Colors.light.onSurface },
      ]}
    >
      {label}
    </Text>
    {children}
  </View>
);

const SettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  const [promo, setPromo] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [updates, setUpdates] = useState(false);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem("userSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setPromo(settings.promo ?? true);
          setReminders(settings.reminders ?? true);
          setUpdates(settings.updates ?? false);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, []);

  // Save settings to AsyncStorage whenever they change
  const saveSettings = async (key: string, value: boolean) => {
    try {
      const currentSettings = {
        promo,
        reminders,
        updates,
        [key]: value,
      };
      await AsyncStorage.setItem(
        "userSettings",
        JSON.stringify(currentSettings)
      );
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const handlePromoToggle = () => {
    const newValue = !promo;
    setPromo(newValue);
    saveSettings("promo", newValue);
  };

  const handleRemindersToggle = () => {
    const newValue = !reminders;
    setReminders(newValue);
    saveSettings("reminders", newValue);
  };

  const handleUpdatesToggle = () => {
    const newValue = !updates;
    setUpdates(newValue);
    saveSettings("updates", newValue);
  };

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
      <Header title={t("account.settings")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.settingsCard,
            {
              backgroundColor: isDark
                ? Colors.dark.surface
                : Colors.light.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            {t("settings.notifications")}
          </Text>

          <SettingsRow label={t("settings.promo")} isDark={isDark}>
            <ToggleSwitch isOn={promo} handleToggle={handlePromoToggle} />
          </SettingsRow>

          <SettingsRow label={t("settings.reminders")} isDark={isDark}>
            <ToggleSwitch
              isOn={reminders}
              handleToggle={handleRemindersToggle}
            />
          </SettingsRow>

          <SettingsRow label={t("settings.updates")} isDark={isDark}>
            <ToggleSwitch isOn={updates} handleToggle={handleUpdatesToggle} />
          </SettingsRow>
        </View>
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
    padding: Spacing.md,
  },
  settingsCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  settingsLabel: {
    fontSize: FontSizes.base,
  },
});

export default SettingsScreen;
