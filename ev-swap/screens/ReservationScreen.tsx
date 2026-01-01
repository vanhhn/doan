import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme, useI18n } from "../contexts";
import { useStations } from "../hooks/useApi";
import { reservationAPI } from "../services/api";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";
import type { RootStackParamList } from "../navigation.types";
import CustomAlert from "../components/CustomAlert";
import { useAlert } from "../hooks/useAlert";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Station {
  id: number;
  name: string;
  location: string;
  availableSlots: number;
  totalSlots: number;
}

const ReservationScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { t } = useI18n();
  const { stations, isLoading, refetch } = useStations();
  const [reserving, setReserving] = useState<number | null>(null);
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const handleReserve = async (stationId: number, stationName: string) => {
    showAlert(
      "Xác nhận đặt trước",
      `Bạn muốn đặt chỗ tại ${stationName}?\n\nThời gian giữ chỗ: 30 phút`,
      [
        {
          text: "Hủy",
          style: "cancel",
        },
        {
          text: "Đặt chỗ",
          onPress: async () => {
            setReserving(stationId);
            try {
              const response = await reservationAPI.createReservation(
                stationId
              );
              if (response.success) {
                showAlert(
                  "Thành công",
                  `${response.message}\n\nVui lòng đến trạm trong vòng 30 phút để quét QR.`
                );
              } else {
                showAlert("Lỗi", response.message || "Không thể đặt chỗ");
              }
            } catch (error) {
              console.error("Reservation error:", error);
              showAlert("Lỗi", "Có lỗi xảy ra khi đặt chỗ");
            } finally {
              setReserving(null);
            }
          },
        },
      ]
    );
  };

  const renderStationItem = ({ item }: { item: Station }) => {
    const isReserving = reserving === item.id;
    const hasSlots = item.availableSlots > 0;

    return (
      <TouchableOpacity
        style={[
          styles.stationCard,
          { backgroundColor: colors.surface },
          !hasSlots && styles.stationCardDisabled,
        ]}
        onPress={() => hasSlots && handleReserve(item.id, item.name)}
        disabled={!hasSlots || isReserving}
        activeOpacity={0.7}
      >
        <View style={styles.stationInfo}>
          <Text style={[styles.stationName, { color: colors.text }]}>
            {item.name}
          </Text>
          <View style={styles.slotInfo}>
            <Text
              style={[
                styles.slotText,
                { color: hasSlots ? colors.success : colors.error },
              ]}
            >
              {hasSlots
                ? `🔋 ${item.availableSlots}/${item.totalSlots} pin có sẵn`
                : "❌ Hết pin"}
            </Text>
          </View>
        </View>

        {isReserving ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <View
            style={[
              styles.reserveButton,
              {
                backgroundColor: hasSlots ? colors.primary : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.reserveButtonText,
                { color: hasSlots ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              {hasSlots ? "Đặt chỗ" : "Hết chỗ"}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading && stations.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Đang tải danh sách trạm...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Đặt trước pin
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Chọn trạm để đặt chỗ trước 30 phút
        </Text>
      </View>

      <FlatList
        data={stations}
        renderItem={renderStationItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Không có trạm nào
            </Text>
          </View>
        }
      />
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
  header: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
  },
  listContent: {
    padding: Spacing.md,
  },
  stationCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stationCardDisabled: {
    opacity: 0.6,
  },
  stationInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  stationName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.xs,
  },
  stationLocation: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  slotInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  slotText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  reserveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  reserveButtonText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.base,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: FontSizes.base,
  },
});

export default ReservationScreen;
