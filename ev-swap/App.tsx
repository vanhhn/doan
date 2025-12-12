import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider, I18nProvider, useTheme } from "./contexts";
import { AuthProvider } from "./contexts/AuthContext";
import { RootStackParamList } from "./navigation.types";

import MainLayout from "./components/MainLayout";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import StationDetailsScreen from "./screens/StationDetailsScreen";
import HelpScreen from "./screens/HelpScreen";
import HistoryScreen from "./screens/HistoryScreen";
import PersonalInfoScreen from "./screens/PersonalInfoScreen";
import SettingsScreen from "./screens/SettingsScreen";
import NetworkTestScreen from "./screens/NetworkTestScreen";
import LoginTestScreen from "./screens/LoginTestScreen";
import QRScannerScreen from "./screens/QRScannerScreen";
import ReservationScreen from "./screens/ReservationScreen";
import TestAlertScreen from "./screens/TestAlertScreen";
import NotificationTestScreen from "./screens/NotificationTestScreen";
import MoMoPaymentScreen from "./screens/MoMoPaymentScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme } = useTheme();

  const handleLogin = () => setIsLoggedIn(true);
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainLayout onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="StationDetails"
              component={StationDetailsScreen}
            />
            <Stack.Screen name="QRScanner" component={QRScannerScreen} />
            <Stack.Screen name="Reservation" component={ReservationScreen} />
            <Stack.Screen name="MoMoPayment" component={MoMoPaymentScreen} />
            <Stack.Screen name="TestAlert" component={TestAlertScreen} />
            <Stack.Screen
              name="NotificationTest"
              component={NotificationTestScreen}
            />
            <Stack.Screen name="Support" component={HelpScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {() => <LoginScreen onLogin={handleLogin} />}
            </Stack.Screen>
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="NetworkTest" component={NetworkTestScreen} />
            <Stack.Screen name="LoginTest" component={LoginTestScreen} />
          </>
        )}
      </Stack.Navigator>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
};

export default App;
