import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme, useI18n } from "../contexts";
import { EyeIcon, EyeOffIcon, BatteryIcon } from "../components/icons";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation.types";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [phoneOrCard, setPhoneOrCard] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useI18n();

  const handleLogin = () => {
    // Basic validation
    if (phoneOrCard && password) {
      onLogin();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surface }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo/Icon */}
        <View
          style={[
            styles.logoContainer,
            { backgroundColor: colors.primaryLight },
          ]}
        >
          <BatteryIcon color={colors.primary} size={48} />
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          {t("login.welcome")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("login.subtitle")}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Phone/Card Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t("login.phoneOrCard")}
            placeholderTextColor={colors.textSecondary}
            value={phoneOrCard}
            onChangeText={setPhoneOrCard}
            autoCapitalize="none"
            keyboardType="default"
          />

          {/* Password Input */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={[
                styles.input,
                styles.passwordInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              placeholder={t("login.password")}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!passwordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? (
                <EyeOffIcon color={colors.textSecondary} size={20} />
              ) : (
                <EyeIcon color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.primary }]}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>{t("login.loginButton")}</Text>
          </TouchableOpacity>
        </View>

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
            {t("login.forgotPassword")}
          </Text>
        </TouchableOpacity>

        {/* Sign Up Link */}
        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: colors.textSecondary }]}>
            {t("login.noAccount")}{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
            <Text style={[styles.signUpLink, { color: colors.primary }]}>
              {t("login.signUp")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  form: {
    marginBottom: Spacing.lg,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    fontSize: FontSizes.base,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: "absolute",
    right: Spacing.md,
    top: 15,
    padding: Spacing.xs,
  },
  loginButton: {
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  forgotPassword: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    fontSize: FontSizes.sm,
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signUpText: {
    fontSize: FontSizes.sm,
  },
  signUpLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
});

export default LoginScreen;
