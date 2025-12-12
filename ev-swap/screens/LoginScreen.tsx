import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Svg, Path, Line } from "react-native-svg";
import { EyeIcon, EyeOffIcon } from "../components/icons";
import { useTheme, useI18n } from "../contexts";
import { useAuth } from "../contexts/AuthContext";
import CustomAlert from "../components/CustomAlert";
import { useAlert } from "../hooks/useAlert";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";
import type { RootStackParamList } from "../navigation.types";

interface LoginScreenProps {
  onLogin: () => void;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Login">;

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [phoneOrCard, setPhoneOrCard] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useI18n();
  const { login } = useAuth();
  const { showAlert, hideAlert, alertConfig } = useAlert();
  const isDark = theme === "dark";

  const handleLogin = async () => {
    // Kiểm tra từng trường để đưa ra thông báo cụ thể
    if (!phoneOrCard.trim() && !password.trim()) {
      showAlert("", t("login.fillAllFields"));
      return;
    }

    if (!phoneOrCard.trim()) {
      showAlert("", t("login.emptyPhoneOrCard"));
      return;
    }

    if (!password.trim()) {
      showAlert("", t("login.emptyPassword"));
      return;
    }

    setIsLoading(true);
    try {
      console.log("🔐 LoginScreen: Attempting login with:", phoneOrCard.trim());
      const result = await login(phoneOrCard.trim(), password);
      console.log("🔐 LoginScreen: Login result:", result);

      if (result.success) {
        console.log("🔐 LoginScreen: Login successful, calling onLogin");
        onLogin();
      } else {
        console.log("🔐 LoginScreen: Login failed:", result.message);
        showAlert("", result.message || t("login.loginError"));
      }
    } catch (error) {
      console.error("🔐 LoginScreen: Login error:", error);
      showAlert("", t("login.loginError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <KeyboardAvoidingView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? Colors.dark.surface : Colors.light.surface,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo */}
          <View
            style={[
              styles.logoContainer,
              {
                backgroundColor: isDark
                  ? Colors.dark.primaryLight
                  : Colors.light.primaryLight,
              },
            ]}
          >
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
              <Path
                d="m12 14 4 6"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 14 8 20"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 14V2"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M7 2h10"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="M12 2v2.5"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="m7 15-4 5"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <Path
                d="m17 15 4 5"
                stroke={isDark ? Colors.dark.primary : Colors.light.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              {
                color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
              },
            ]}
          >
            {t("login.welcome")}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: isDark
                  ? Colors.dark.textSecondary
                  : Colors.light.textSecondary,
              },
            ]}
          >
            {t("login.subtitle")}
          </Text>

          {/* Form */}
          <View style={styles.form}>
            {/* Phone or Card Input */}
            <TextInput
              value={phoneOrCard}
              onChangeText={setPhoneOrCard}
              placeholder={t("login.phoneOrCard")}
              placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
              style={[
                styles.input,
                {
                  backgroundColor: isDark
                    ? Colors.dark.background
                    : Colors.light.surface,
                  borderColor: isDark ? "#4B5563" : "#D1D5DB",
                  color: isDark
                    ? Colors.dark.onSurface
                    : Colors.light.onSurface,
                },
              ]}
              autoCapitalize="none"
            />

            {/* Password Input */}
            <View style={styles.passwordContainer}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={t("login.password")}
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                secureTextEntry={!passwordVisible}
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.background
                      : Colors.light.surface,
                    borderColor: isDark ? "#4B5563" : "#D1D5DB",
                    color: isDark
                      ? Colors.dark.onSurface
                      : Colors.light.onSurface,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible(!passwordVisible)}
                style={styles.eyeIcon}
              >
                {passwordVisible ? (
                  <EyeOffIcon
                    size={20}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                ) : (
                  <EyeIcon size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
                )}
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              style={[
                styles.loginButton,
                {
                  backgroundColor: isLoading
                    ? isDark
                      ? "#4B5563"
                      : "#9CA3AF"
                    : isDark
                    ? Colors.dark.primary
                    : Colors.light.primary,
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.loginButtonText,
                  { color: isDark ? "#000000" : "#FFFFFF" },
                ]}
              >
                {isLoading ? t("login.loggingIn") : t("login.loginButton")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity
            onPress={handleForgotPassword}
            style={styles.forgotPassword}
          >
            <Text
              style={[
                styles.forgotPasswordText,
                { color: isDark ? Colors.dark.primary : Colors.light.primary },
              ]}
            >
              {t("login.forgotPassword")}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text
              style={[
                styles.signUpText,
                {
                  color: isDark
                    ? Colors.dark.textSecondary
                    : Colors.light.textSecondary,
                },
              ]}
            >
              {t("login.noAccount")}{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text
                style={[
                  styles.signUpLink,
                  {
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                  },
                ]}
              >
                {t("login.signUp")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Debug buttons for development */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("NetworkTest")}
                style={[styles.debugButton, { backgroundColor: "#ff6b6b" }]}
              >
                <Text style={styles.debugButtonText}>🔬 Network Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("LoginTest")}
                style={[styles.debugButton, { backgroundColor: "#4ecdc4" }]}
              >
                <Text style={styles.debugButtonText}>🧪 Login Test</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setPhoneOrCard("testlogin");
                  setPassword("password123");
                }}
                style={[styles.debugButton, { backgroundColor: "#51cf66" }]}
              >
                <Text style={styles.debugButtonText}>🔑 Fill Test Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Test account info */}
          {__DEV__ && (
            <View
              style={[
                styles.testInfoContainer,
                {
                  backgroundColor: isDark ? "#1a1a1a" : "#f8f9fa",
                  borderColor: isDark ? "#333" : "#ddd",
                },
              ]}
            >
              <Text
                style={[
                  styles.testInfoTitle,
                  {
                    color: isDark ? Colors.dark.primary : Colors.light.primary,
                  },
                ]}
              >
                📝 Test Account
              </Text>
              <Text
                style={[
                  styles.testInfoText,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                Username: testlogin
              </Text>
              <Text
                style={[
                  styles.testInfoText,
                  {
                    color: isDark
                      ? Colors.dark.textSecondary
                      : Colors.light.textSecondary,
                  },
                ]}
              >
                Password: password123
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: Spacing.xl,
  },
  content: {
    alignItems: "center",
    width: "100%",
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.base,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  form: {
    width: "100%",
    gap: Spacing.lg,
  },
  input: {
    width: "100%",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: FontSizes.base,
  },
  passwordContainer: {
    position: "relative",
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  loginButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  loginButtonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  forgotPassword: {
    marginTop: Spacing.lg,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
    textDecorationLine: "underline",
  },
  signUpContainer: {
    flexDirection: "row",
    marginTop: Spacing.xl,
  },
  signUpText: {
    fontSize: FontSizes.sm,
  },
  signUpLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    textDecorationLine: "underline",
  },
  debugContainer: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
    width: "100%",
  },
  debugButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  debugButtonText: {
    color: "white",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  testInfoContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    width: "100%",
  },
  testInfoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  testInfoText: {
    fontSize: FontSizes.xs,
    textAlign: "center",
    marginBottom: 2,
  },
});

export default LoginScreen;
