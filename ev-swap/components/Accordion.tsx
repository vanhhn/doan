import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useTheme } from "../contexts";
import { Spacing, FontSizes, FontWeights } from "../theme";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();

  const toggleOpen = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(!isOpen);
  };

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <TouchableOpacity
        onPress={toggleOpen}
        style={styles.header}
        activeOpacity={0.7}
      >
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.chevron, { color: colors.textSecondary }]}>
          {isOpen ? "▲" : "▼"}
        </Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.content}>
          <Text style={[styles.contentText, { color: colors.textSecondary }]}>
            {children}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  title: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  chevron: {
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
  },
  content: {
    paddingBottom: Spacing.md,
  },
  contentText: {
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});

export default AccordionItem;
