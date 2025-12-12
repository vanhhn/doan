import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
} from "react-native";
import { useTheme, useI18n } from "../contexts";
import { useTransactionHistory } from "../hooks/useApi";
import type { Transaction } from "../types";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";

interface HistoryItemProps {
  transaction: Transaction;
}

const HistoryItem: React.FC<HistoryItemProps> = ({ transaction }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.itemContainer, { backgroundColor: colors.surface }]}>
      <View style={styles.itemLeft}>
        <Text style={[styles.stationName, { color: colors.text }]}>
          {transaction.stationName}
        </Text>
        <Text style={[styles.dateTime, { color: colors.textSecondary }]}>
          {transaction.date} {transaction.time}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={[styles.cost, { color: colors.primary }]}>
          {transaction.cost.toLocaleString("vi-VN")}đ
        </Text>
      </View>
    </View>
  );
};

const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useI18n();

  // Use real API data
  const { transactions, isLoading, error, refetch } = useTransactionHistory();

  if (transactions.length === 0 && !isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t("history.noHistory")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={transactions.map((transaction) => {
          const date = new Date(transaction.transactionTime);
          return {
            id: transaction.id.toString(),
            stationName:
              transaction.station?.name || `Trạm ${transaction.stationId}`,
            date: date.toLocaleDateString("vi-VN"),
            time: date.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            cost: transaction.cost || 7000,
          };
        })}
        renderItem={({ item }) => <HistoryItem transaction={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  listContent: {
    padding: Spacing.md,
  },
  itemContainer: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  itemLeft: {
    flex: 1,
  },
  stationName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    marginBottom: 4,
  },
  dateTime: {
    fontSize: FontSizes.sm,
  },
  itemRight: {
    alignItems: "flex-end",
  },
  cost: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: FontSizes.base,
  },
});

export default HistoryScreen;
