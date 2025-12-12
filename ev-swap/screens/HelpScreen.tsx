import React from "react";
import {
  View,
  Text,
  ScrollView,
  Linking,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Header from "../components/Header";
import AccordionItem from "../components/Accordion";
import { useTheme, useI18n } from "../contexts";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";

const HelpScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  const handlePhonePress = () => {
    Linking.openURL("tel:123-456-7890");
  };

  const handleEmailPress = () => {
    Linking.openURL("mailto:support@evswap.com");
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
      <Header title={t("help.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* FAQ Section */}
        <View
          style={[
            styles.section,
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
            {t("help.faq")}
          </Text>

          <AccordionItem title={t("help.q1.title")}>
            <Text
              style={[
                styles.answerText,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("help.q1.answer")}
            </Text>
          </AccordionItem>

          <AccordionItem title={t("help.q2.title")}>
            <Text
              style={[
                styles.answerText,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("help.q2.answer")}
            </Text>
          </AccordionItem>

          <AccordionItem title={t("help.q3.title")}>
            <Text
              style={[
                styles.answerText,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("help.q3.answer")}
            </Text>
          </AccordionItem>
        </View>

        {/* Contact Section */}
        <View
          style={[
            styles.section,
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
            {t("help.contact.title")}
          </Text>

          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Text
                style={[
                  styles.contactLabel,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                {t("help.contact.phone")}:{" "}
              </Text>
              <TouchableOpacity onPress={handlePhonePress}>
                <Text
                  style={[
                    styles.contactLink,
                    {
                      color: isDark
                        ? Colors.dark.primary
                        : Colors.light.primary,
                    },
                  ]}
                >
                  123-456-7890
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.contactRow}>
              <Text
                style={[
                  styles.contactLabel,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                {t("help.contact.email")}:{" "}
              </Text>
              <TouchableOpacity onPress={handleEmailPress}>
                <Text
                  style={[
                    styles.contactLink,
                    {
                      color: isDark
                        ? Colors.dark.primary
                        : Colors.light.primary,
                    },
                  ]}
                >
                  support@evswap.com
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
    gap: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  answerText: {
    fontSize: FontSizes.base,
    lineHeight: 22,
  },
  contactInfo: {
    gap: Spacing.sm,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactLabel: {
    fontSize: FontSizes.base,
  },
  contactLink: {
    fontSize: FontSizes.base,
    textDecorationLine: "underline",
  },
});

export default HelpScreen;
