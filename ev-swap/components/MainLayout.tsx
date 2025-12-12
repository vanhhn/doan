import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useTheme, useI18n } from "../contexts";
import { HomeIcon, MapMarkerIcon, WalletIcon, AccountIcon } from "./icons";
import { MainTabParamList } from "../navigation.types";
import { Spacing, FontSizes } from "../theme";

import HomeScreen from "../screens/HomeScreen";
import MapScreen from "../screens/MapScreen";
import WalletScreen from "../screens/WalletScreen";
import AccountScreen from "../screens/AccountScreen";

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainLayoutProps {
  onLogout: () => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ onLogout }) => {
  const { colors } = useTheme();
  const { t } = useI18n();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t("nav.home"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: t("nav.map"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <MapMarkerIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={WalletScreen}
        options={{
          tabBarLabel: t("nav.wallet"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <WalletIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        options={{
          tabBarLabel: t("nav.account"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <AccountIcon color={color} size={size} />
          ),
        }}
      >
        {() => <AccountScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

export default MainLayout;
