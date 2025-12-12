// Navigation types for React Navigation
import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Wallet: undefined;
  Account: undefined;
};

export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  StationDetails: { id: string };
  Support: undefined;
  Help: undefined;
  History: undefined;
  PersonalInfo: undefined;
  Settings: undefined;
  NetworkTest: undefined;
  LoginTest: undefined;
  QRScanner: undefined;
  Reservation: undefined;
  TestAlert: undefined;
  NotificationTest: undefined;
  MoMoPayment: { paymentUrl: string; orderId: string; amount: number };
};
