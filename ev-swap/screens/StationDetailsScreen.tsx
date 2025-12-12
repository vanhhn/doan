import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Svg, Path } from "react-native-svg";
import { MOCK_STATIONS } from "../constants";
import { useTheme, useI18n } from "../contexts";
import type { Station } from "../types";
import Modal from "../components/Modal";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";
import type { RootStackParamList } from "../navigation.types";

type StationDetailsRouteProp = RouteProp<RootStackParamList, "StationDetails">;

const StationDetailsScreen: React.FC = () => {
  const route = useRoute<StationDetailsRouteProp>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReserved, setIsReserved] = useState(false);

  const station: Station | undefined = MOCK_STATIONS.find(
    (s) => s.id === route.params.id
  );

  const handleOpenModal = () => {
    setIsReserved(false);
    setIsModalOpen(true);
  };

  const handleReserve = () => {
    setIsReserved(true);
    setTimeout(() => {
      setIsModalOpen(false);
    }, 2000);
  };

  if (!station) {
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
        <View style={styles.notFoundContainer}>
          <Text
            style={[
              styles.notFoundText,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : Colors.light.textSecondary,
              },
            ]}
          >
            {t("station.notFound", { id: route.params.id })}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backButton,
              {
                backgroundColor: isDark
                  ? Colors.dark.primary
                  : Colors.light.primary,
              },
            ]}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.backButtonText,
                { color: isDark ? "#000000" : "#FFFFFF" },
              ]}
            >
              {t("common.back")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const batteryPercentage =
    (station.availableBatteries / station.totalSlots) * 100;

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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Map Header */}
        <View
          style={[
            styles.mapHeader,
            { backgroundColor: isDark ? "#374151" : "#D1D5DB" },
          ]}
        >
          <Image
            source={{ uri: "https://i.imgur.com/o5QfCqI.png" }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[
              styles.backIconButton,
              {
                backgroundColor: isDark
                  ? Colors.dark.surface
                  : Colors.light.surface,
              },
            ]}
            activeOpacity={0.8}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                stroke={isDark ? Colors.dark.onSurface : Colors.light.onSurface}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Station Details Card */}
        <View style={styles.detailsContainer}>
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark
                  ? Colors.dark.surface
                  : Colors.light.surface,
              },
            ]}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerInfo}>
                <Text
                  style={[
                    styles.stationName,
                    {
                      color: isDark
                        ? Colors.dark.onSurface
                        : Colors.light.onSurface,
                    },
                  ]}
                >
                  {station.name}
                </Text>
                <Text
                  style={[
                    styles.stationAddress,
                    {
                      color: isDark
                        ? Colors.dark.textSecondary
                        : Colors.light.textSecondary,
                    },
                  ]}
                >
                  {station.address}
                </Text>
              </View>
              <View style={styles.availabilityBox}>
                <Text
                  style={[
                    styles.availabilityCount,
                    {
                      color: isDark
                        ? Colors.dark.primary
                        : Colors.light.primary,
                    },
                  ]}
                >
                  {station.availableBatteries}/{station.totalSlots}
                </Text>
                <Text
                  style={[
                    styles.availabilityLabel,
                    {
                      color: isDark
                        ? Colors.dark.textSecondary
                        : Colors.light.textSecondary,
                    },
                  ]}
                >
                  {t("station.available")}
                </Text>
              </View>
            </View>

            {/* Battery Level */}
            <View
              style={[
                styles.infoSection,
                { borderTopColor: isDark ? "#374151" : "#E5E7EB" },
              ]}
            >
              <View style={styles.infoRow}>
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
                  {t("station.batteryLevel")}
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    {
                      color: isDark
                        ? Colors.dark.onSurface
                        : Colors.light.onSurface,
                    },
                  ]}
                >
                  {batteryPercentage.toFixed(0)}%
                </Text>
              </View>
              <View
                style={[
                  styles.progressBar,
                  { backgroundColor: isDark ? "#374151" : "#E5E7EB" },
                ]}
              >
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: isDark
                        ? Colors.dark.primary
                        : Colors.light.primary,
                      width: `${batteryPercentage}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Distance */}
            <View style={styles.infoRow}>
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
                {t("station.distance")}
              </Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              >
                {station.distance.toFixed(1)} km
              </Text>
            </View>

            {/* Reserve Button */}
            <TouchableOpacity
              onPress={handleOpenModal}
              style={[
                styles.reserveButton,
                {
                  backgroundColor: isDark
                    ? Colors.dark.primary
                    : Colors.light.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.reserveButtonText,
                  { color: isDark ? "#000000" : "#FFFFFF" },
                ]}
              >
                {t("station.reserveButton")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("modals.reserve.title")}
      >
        {isReserved ? (
          <View style={styles.successContainer}>
            <Svg
              width={48}
              height={48}
              viewBox="0 0 24 24"
              fill="none"
              style={styles.successIcon}
            >
              <Path
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="#10B981"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text
              style={[
                styles.successText,
                {
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
            >
              {t("modals.reserve.success")}
            </Text>
          </View>
        ) : (
          <View>
            <Text
              style={[
                styles.modalBody,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              {t("modals.reserve.body", { station: station.name })}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setIsModalOpen(false)}
                style={[
                  styles.modalButton,
                  { backgroundColor: isDark ? "#4B5563" : "#E5E7EB" },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: isDark ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleReserve}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.primary
                      : Colors.light.primary,
                  },
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: isDark ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  notFoundText: {
    fontSize: FontSizes.base,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  backButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  backButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  mapHeader: {
    height: 256,
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  backIconButton: {
    position: "absolute",
    top: 16,
    left: 16,
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  detailsContainer: {
    padding: Spacing.md,
    marginTop: -64,
  },
  detailsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerInfo: {
    flex: 1,
  },
  stationName: {
    fontSize: FontSizes["2xl"],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  stationAddress: {
    fontSize: FontSizes.base,
  },
  availabilityBox: {
    alignItems: "flex-end",
    marginLeft: Spacing.md,
  },
  availabilityCount: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  availabilityLabel: {
    fontSize: FontSizes.xs,
  },
  infoSection: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    paddingTop: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  infoLabel: {
    fontSize: FontSizes.base,
  },
  infoValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  progressBar: {
    width: "100%",
    height: 10,
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  reserveButton: {
    marginTop: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  reserveButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  successContainer: {
    alignItems: "center",
    padding: Spacing.md,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  successText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  modalBody: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
  },
  modalButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  modalButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});

export default StationDetailsScreen;
