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
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme, useI18n } from "../contexts";
import { EyeIcon, EyeOffIcon, BatteryIcon } from "../components/icons";
import { Spacing, BorderRadius, FontSizes, FontWeights } from "../theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation.types";
import { authAPI } from "../services/api";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

const ForgotPasswordScreen: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();

  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    setError("");
    setIsLoading(true);

    if (!phone || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        phone: phone.trim(),
        newPassword: newPassword,
      });

      if (response.success) {
        Alert.alert(
          "Thành công",
          "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        setError(response.message || "Đặt lại mật khẩu thất bại");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
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
          Quên mật khẩu
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Nhập số điện thoại và mật khẩu mới
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Phone Number Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Số điện thoại"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          {/* New Password Input */}
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
              placeholder="Mật khẩu mới"
              placeholderTextColor={colors.textSecondary}
              value={newPassword}
              onChangeText={setNewPassword}
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

          {/* Confirm Password Input */}
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
              placeholder="Xác nhận mật khẩu mới"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!confirmPasswordVisible}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
            >
              {confirmPasswordVisible ? (
                <EyeOffIcon color={colors.textSecondary} size={20} />
              ) : (
                <EyeIcon color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
          </View>

          {/* Error Message */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Reset Password Button */}
          <TouchableOpacity
            style={[
              styles.resetButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleResetPassword}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.resetButtonText}>Đặt lại mật khẩu</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Back to Login Link */}
        <View style={styles.loginContainer}>
          <Text style={[styles.loginPrompt, { color: colors.textSecondary }]}>
            Nhớ mật khẩu?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>
              Đăng nhập
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
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
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
    height: 56,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    fontSize: FontSizes.base,
    marginBottom: Spacing.md,
  },
  passwordContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 18,
    padding: 4,
  },
  errorText: {
    color: "#EF4444",
    fontSize: FontSizes.sm,
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  resetButton: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginPrompt: {
    fontSize: FontSizes.base,
  },
  loginLink: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});

export default ForgotPasswordScreen;
