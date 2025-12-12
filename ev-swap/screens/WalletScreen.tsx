import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Svg, Path, Circle } from "react-native-svg";
import type { WalletTransaction } from "../types";
import type { RootStackParamList } from "../navigation.types";
import { useTheme, useI18n } from "../contexts";
import { useTransactionHistory, useProfile } from "../hooks/useApi";
import { customerAPI } from "../services/api";
import Modal from "../components/Modal";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WalletTransactionItemProps {
  transaction: WalletTransaction;
  isDark: boolean;
  t: (key: string) => string;
}

const WalletTransactionItem: React.FC<WalletTransactionItemProps> = ({
  transaction,
  isDark,
  t,
}) => {
  const typeText = {
    "Top Up": t("wallet.topUp"),
    Withdraw: t("wallet.withdraw"),
    Payment: t("home.payment"),
  }[transaction.type];

  return (
    <View
      style={[
        styles.transactionItem,
        { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
      ]}
    >
      <View>
        <Text
          style={[
            styles.transactionType,
            { color: isDark ? Colors.dark.onSurface : Colors.light.onSurface },
          ]}
        >
          {typeText}
        </Text>
        <Text
          style={[
            styles.transactionDate,
            {
              color: isDark
                ? Colors.dark.textSecondary
                : Colors.light.textSecondary,
            },
          ]}
        >
          {transaction.date}
        </Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          {
            color:
              transaction.amount > 0
                ? isDark
                  ? "#4ADE80"
                  : "#16A34A"
                : isDark
                ? "#F87171"
                : "#DC2626",
          },
        ]}
      >
        {transaction.amount > 0 ? "+" : ""}
        {Math.abs(transaction.amount).toLocaleString("vi-VN")}đ
      </Text>
    </View>
  );
};

const WalletScreen = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const isDark = theme === "dark";
  const navigation = useNavigation<NavigationProp>();

  // Use real API data
  const { transactions, isLoading, error, refetch } = useTransactionHistory();
  const { profile, refetch: refetchProfile } = useProfile();

  // Get balance from profile
  const currentBalance = profile?.balance || 0;

  const [modalType, setModalType] = useState<"topup" | "withdraw" | null>(null);
  const [amount, setAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"momo" | "cash" | null>(
    null
  );

  // Auto-refresh when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      refetchProfile();
      refetch();
    }, [refetchProfile, refetch])
  );

  const handleTransaction = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue < 10000) {
      Alert.alert("Lỗi", "Số tiền nạp tối thiểu là 10,000đ");
      return;
    }

    if (modalType !== "topup") {
      Alert.alert("Thông báo", "Chức năng rút tiền chưa khả dụng");
      return;
    }

    if (!paymentMethod) {
      Alert.alert("Lỗi", "Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (paymentMethod === "momo") {
      handleMoMoPayment(amountValue);
    } else {
      // Cash payment (for demo)
      handleCashPayment(amountValue);
    }
  };

  const handleMoMoPayment = async (amountValue: number) => {
    setIsProcessing(true);
    try {
      // Gọi API backend để tạo payment URL
      const response = await customerAPI.createMoMoPayment(amountValue);

      if (response.success && response.data) {
        // Đóng modal
        setModalType(null);
        setAmount("");
        setPaymentMethod(null);

        // Ưu tiên deeplink để mở MoMo app
        const urlToOpen = response.data.deeplink || response.data.paymentUrl;

        if (urlToOpen) {
          // Kiểm tra xem có thể mở deeplink không
          const canOpen = await Linking.canOpenURL(urlToOpen);

          if (canOpen) {
            // Mở MoMo app bằng deeplink
            await Linking.openURL(urlToOpen);

            // Auto-polling để check payment status mỗi 2 giây
            const orderId = response.data.orderId;
            let pollCount = 0;
            const maxPolls = 30; // Poll tối đa 60 giây (30 x 2s)

            const pollInterval = setInterval(async () => {
              pollCount++;

              try {
                // Refresh profile để check balance có thay đổi không
                const updatedProfile = await refetchProfile();

                // Hoặc kiểm tra payment status
                const completeResponse = await customerAPI.manualCompleteMoMo(
                  orderId
                );

                if (completeResponse.success) {
                  // Payment đã complete, dừng polling
                  clearInterval(pollInterval);
                  await refetchProfile();
                  Alert.alert(
                    t("common.success"),
                    t("common.topupSuccessDetails", {
                      amount: amountValue.toLocaleString(),
                      balance: completeResponse.data.balance.toLocaleString(),
                    })
                  );
                }
              } catch (error) {
                console.error("Polling error:", error);
              }

              // Dừng polling sau maxPolls lần
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                refetchProfile(); // Refresh lần cuối
              }
            }, 2000); // Poll mỗi 2 giây
          } else {
            // Fallback: Sử dụng WebView nếu không mở được deeplink
            navigation.navigate("MoMoPayment", {
              paymentUrl: response.data.paymentUrl,
              orderId: response.data.orderId,
              amount: amountValue,
            });
          }
        } else {
          Alert.alert(t("common.error"), t("common.paymentUrlError"));
        }
      } else {
        Alert.alert(
          t("common.error"),
          response.message || t("common.momoPaymentError")
        );
      }
    } catch (error) {
      console.error("MoMo payment error:", error);
      Alert.alert(t("common.error"), t("common.momoPaymentGeneralError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCashPayment = async (amountValue: number) => {
    setIsProcessing(true);
    try {
      const response = await customerAPI.topUpBalance(amountValue);

      if (response.success) {
        setShowSuccess(true);
        await refetchProfile();

        setTimeout(() => {
          setModalType(null);
          setShowSuccess(false);
          setAmount("");
          setPaymentMethod(null);
        }, 2000);
      } else {
        Alert.alert("Lỗi", response.message || "Không thể nạp tiền");
      }
    } catch (error) {
      console.error("Top up error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi nạp tiền");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setModalType(null);
    setAmount("");
    setShowSuccess(false);
    setPaymentMethod(null);
  };

  const quickAmounts = [10000, 50000, 100000];

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
        {/* Balance Card */}
        <View
          style={[
            styles.balanceCard,
            {
              backgroundColor: isDark
                ? Colors.dark.surface
                : Colors.light.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.balanceLabel,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : "rgba(255,255,255,0.8)",
              },
            ]}
          >
            {t("wallet.currentBalance")}
          </Text>
          <Text
            style={[
              styles.balanceAmount,
              { color: isDark ? Colors.dark.onSurface : "#FFFFFF" },
            ]}
          >
            {currentBalance.toLocaleString()}đ
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.topUpButton]}
            onPress={() => setModalType("topup")}
            activeOpacity={0.8}
          >
            <Text style={styles.actionButtonText}>{t("wallet.topUp")}</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text
            style={[
              styles.activityTitle,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            {t("wallet.recentActivity")}
          </Text>

          <View
            style={[
              styles.transactionList,
              {
                backgroundColor: isDark
                  ? Colors.dark.surface
                  : Colors.light.surface,
              },
            ]}
          >
            <FlatList
              data={transactions.map((t, index) => ({
                id: t.id.toString(),
                type: "Payment" as const,
                date: new Date(t.transactionTime).toLocaleDateString("vi-VN"),
                amount: -(t.cost || 0), // Negative for payments (expenses)
              }))}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <WalletTransactionItem
                  transaction={item}
                  isDark={isDark}
                  t={t}
                />
              )}
              scrollEnabled={false}
              refreshControl={
                <RefreshControl
                  refreshing={isLoading}
                  onRefresh={refetch}
                  tintColor={
                    theme === "dark"
                      ? Colors.dark.primary
                      : Colors.light.primary
                  }
                />
              }
            />
          </View>
        </View>
      </View>

      {/* Transaction Modal */}
      <Modal
        isOpen={modalType !== null}
        onClose={handleCloseModal}
        title={
          modalType === "topup"
            ? t("modals.topup.title")
            : t("modals.withdraw.title")
        }
      >
        {showSuccess ? (
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
              {t("modals.common.success")}
            </Text>
          </View>
        ) : (
          <View style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputLabel,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                {t("modals.common.amount")}
              </Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="numeric"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.background
                      : "#F3F4F6",
                    borderColor: isDark ? "#4B5563" : "#D1D5DB",
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              />
            </View>

            {modalType === "topup" && (
              <>
                <View style={styles.quickAmounts}>
                  {quickAmounts.map((qAmount) => (
                    <TouchableOpacity
                      key={qAmount}
                      onPress={() => setAmount(String(qAmount))}
                      style={[
                        styles.quickAmountButton,
                        {
                          backgroundColor: isDark
                            ? Colors.dark.primaryLight
                            : Colors.light.primaryLight,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickAmountText,
                          {
                            color: isDark
                              ? Colors.dark.primary
                              : Colors.light.primary,
                          },
                        ]}
                      >
                        {qAmount.toLocaleString()}đ
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Payment Method Selection */}
                <View style={styles.paymentMethodContainer}>
                  <Text
                    style={[
                      styles.paymentMethodLabel,
                      {
                        color: isDark
                          ? Colors.dark.textSecondary
                          : Colors.light.textSecondary,
                      },
                    ]}
                  >
                    Phương thức thanh toán
                  </Text>

                  <TouchableOpacity
                    onPress={() => setPaymentMethod("momo")}
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark
                          ? Colors.dark.background
                          : "#F3F4F6",
                        borderColor:
                          paymentMethod === "momo"
                            ? isDark
                              ? Colors.dark.primary
                              : Colors.light.primary
                            : isDark
                            ? "#4B5563"
                            : "#D1D5DB",
                        borderWidth: 2,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentOptionContent}>
                      <View style={styles.momoLogo}>
                        <Text style={styles.momoLogoText}>M</Text>
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <Text
                          style={[
                            styles.paymentOptionTitle,
                            {
                              color: isDark
                                ? Colors.dark.onSurface
                                : Colors.light.onSurface,
                            },
                          ]}
                        >
                          Ví MoMo
                        </Text>
                        <Text
                          style={[
                            styles.paymentOptionDesc,
                            {
                              color: isDark
                                ? Colors.dark.textSecondary
                                : Colors.light.textSecondary,
                            },
                          ]}
                        >
                          Thanh toán qua ứng dụng MoMo
                        </Text>
                      </View>
                      {paymentMethod === "momo" && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setPaymentMethod("cash")}
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: isDark
                          ? Colors.dark.background
                          : "#F3F4F6",
                        borderColor:
                          paymentMethod === "cash"
                            ? isDark
                              ? Colors.dark.primary
                              : Colors.light.primary
                            : isDark
                            ? "#4B5563"
                            : "#D1D5DB",
                        borderWidth: 2,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.paymentOptionContent}>
                      <View
                        style={[
                          styles.momoLogo,
                          { backgroundColor: "#10B981" },
                        ]}
                      >
                        <Text style={styles.momoLogoText}>💵</Text>
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <Text
                          style={[
                            styles.paymentOptionTitle,
                            {
                              color: isDark
                                ? Colors.dark.onSurface
                                : Colors.light.onSurface,
                            },
                          ]}
                        >
                          Tiền mặt (Demo)
                        </Text>
                        <Text
                          style={[
                            styles.paymentOptionDesc,
                            {
                              color: isDark
                                ? Colors.dark.textSecondary
                                : Colors.light.textSecondary,
                            },
                          ]}
                        >
                          Nạp tiền trực tiếp
                        </Text>
                      </View>
                      {paymentMethod === "cash" && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={handleCloseModal}
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
                onPress={handleTransaction}
                disabled={isProcessing}
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.primary
                      : Colors.light.primary,
                    opacity: isProcessing ? 0.5 : 1,
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
                  {isProcessing ? "Đang xử lý..." : t("common.confirm")}
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
  content: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  balanceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: FontWeights.bold,
  },
  actionButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  topUpButton: {
    backgroundColor: "#22C55E",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  activitySection: {
    gap: Spacing.sm,
  },
  activityTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  transactionList: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  transactionType: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs / 2,
  },
  transactionDate: {
    fontSize: FontSizes.sm,
  },
  transactionAmount: {
    fontSize: FontSizes.lg,
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
  modalContent: {
    gap: Spacing.md,
  },
  inputContainer: {
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: FontSizes.base,
  },
  quickAmounts: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  paymentMethodContainer: {
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  paymentMethodLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  paymentOption: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  paymentOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  momoLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#A50064",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  momoLogoText: {
    color: "#FFFFFF",
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    marginBottom: 2,
  },
  paymentOptionDesc: {
    fontSize: FontSizes.sm,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: Spacing.md,
    marginTop: Spacing.md,
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

export default WalletScreen;
