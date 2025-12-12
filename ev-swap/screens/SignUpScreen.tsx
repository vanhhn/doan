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

type SignUpScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SignUp"
>;

const SignUpScreen: React.FC = () => {
  const { t } = useI18n();
  const { colors } = useTheme();
  const navigation = useNavigation<SignUpScreenNavigationProp>();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    cardId: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    const { fullName, phoneNumber, cardId, password, confirmPassword } =
      formData;

    if (!fullName || !phoneNumber || !cardId || !password || !confirmPassword) {
      setError(t("signup.errorFieldsRequired"));
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("signup.errorPasswordsMatch"));
      setIsLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        username: cardId,
        password: password,
        fullName: fullName,
        phone: phoneNumber,
        email: `${cardId}@evswap.vn`, // Email tự động
      });

      if (response.success) {
        Alert.alert(
          "Thành công",
          "Đăng ký thành công! Bạn có thể đăng nhập ngay.",
          [{ text: "OK", onPress: () => navigation.navigate("Login") }]
        );
      } else {
        setError(response.message || "Đăng ký thất bại");
      }
    } catch (error) {
      console.error("Register error:", error);
      setError("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
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
          {t("signup.createAccount")}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t("signup.subtitle")}
        </Text>

        {/* Form */}
        <View style={styles.form}>
          {/* Full Name Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t("signup.fullName")}
            placeholderTextColor={colors.textSecondary}
            value={formData.fullName}
            onChangeText={(value) => handleInputChange("fullName", value)}
            autoCapitalize="words"
          />

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
            placeholder={t("signup.phoneNumber")}
            placeholderTextColor={colors.textSecondary}
            value={formData.phoneNumber}
            onChangeText={(value) => handleInputChange("phoneNumber", value)}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />

          {/* Card ID Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder={t("signup.cardId")}
            placeholderTextColor={colors.textSecondary}
            value={formData.cardId}
            onChangeText={(value) => handleInputChange("cardId", value)}
            autoCapitalize="none"
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
              placeholder={t("signup.password")}
              placeholderTextColor={colors.textSecondary}
              value={formData.password}
              onChangeText={(value) => handleInputChange("password", value)}
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
              placeholder={t("signup.confirmPassword")}
              placeholderTextColor={colors.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(value) =>
                handleInputChange("confirmPassword", value)
              }
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

          {/* Sign Up Button */}
          <TouchableOpacity
            style={[
              styles.signUpButton,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.6 },
            ]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signUpButtonText}>
                {t("signup.signUpButton")}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign In Link */}
        <View style={styles.signInContainer}>
          <Text style={[styles.signInText, { color: colors.textSecondary }]}>
            {t("signup.alreadyHaveAccount")}{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={[styles.signInLink, { color: colors.primary }]}>
              {t("signup.signIn")}
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
  errorText: {
    color: "#EF4444",
    fontSize: FontSizes.sm,
    marginBottom: Spacing.sm,
  },
  signUpButton: {
    height: 50,
    borderRadius: BorderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  signUpButtonText: {
    color: "#FFFFFF",
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signInText: {
    fontSize: FontSizes.sm,
  },
  signInLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
});

export default SignUpScreen;
