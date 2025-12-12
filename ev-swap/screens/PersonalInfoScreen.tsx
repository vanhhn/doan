import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  ActionSheetIOS,
  Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Header from "../components/Header";
import { useTheme, useI18n } from "../contexts";
import { useAuth } from "../contexts/AuthContext";
import { useProfile } from "../hooks/useApi";
import { customerAPI } from "../services/api";
import { API_BASE_URL } from "../constants";
import {
  Colors,
  Spacing,
  BorderRadius,
  FontSizes,
  FontWeights,
} from "../theme";

interface InfoRowProps {
  label: string;
  value: string;
  isDark: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, isDark }) => (
  <View
    style={[
      styles.infoRow,
      { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
    ]}
  >
    <Text
      style={[
        styles.infoLabel,
        {
          color: isDark
            ? Colors.dark.textSecondary
            : Colors.light.textSecondary,
        },
      ]}
    >
      {label}
    </Text>
    <Text
      style={[
        styles.infoValue,
        { color: isDark ? Colors.dark.onSurface : Colors.light.onSurface },
      ]}
    >
      {value}
    </Text>
  </View>
);

interface InputRowProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: "default" | "email-address" | "phone-pad";
  isDark: boolean;
}

const InputRow: React.FC<InputRowProps> = ({
  label,
  value,
  onChangeText,
  keyboardType = "default",
  isDark,
}) => (
  <View style={styles.inputRow}>
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
      {label}
    </Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
      style={[
        styles.input,
        {
          backgroundColor: isDark ? Colors.dark.background : "#F3F4F6",
          borderColor: isDark ? "#4B5563" : "#D1D5DB",
          color: isDark ? Colors.dark.onSurface : Colors.light.onSurface,
        },
      ]}
    />
  </View>
);

const PersonalInfoScreen: React.FC = () => {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();
  const isDark = theme === "dark";

  const [isEditing, setIsEditing] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Use real API data
  const { profile, isLoading, error, updateProfile, refetch } = useProfile();

  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [originalUserInfo, setOriginalUserInfo] = useState(userInfo);

  // Update userInfo when profile data is loaded
  useEffect(() => {
    if (profile) {
      const newUserInfo = {
        name: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
      };
      setUserInfo(newUserInfo);
      setOriginalUserInfo(newUserInfo);

      // Set avatar from profile
      if (profile.avatarUrl) {
        setAvatarUri(profile.avatarUrl);
      }
    }
  }, [profile]);

  const handleEdit = () => {
    setOriginalUserInfo(userInfo);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const result = await updateProfile({
        fullName: userInfo.name,
        email: userInfo.email,
        phone: userInfo.phone,
      });

      if (result.success) {
        setIsEditing(false);
        setOriginalUserInfo(userInfo);
        Alert.alert("Thành công", "Cập nhật thông tin thành công!");
      } else {
        Alert.alert("Lỗi", result.message || "Không thể cập nhật thông tin");
      }
    } catch (err) {
      Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    return cameraPermission.granted && mediaPermission.granted;
  };

  const pickImage = async (useCamera: boolean) => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        "Quyền truy cập",
        "Cần cấp quyền camera và thư viện ảnh để sử dụng tính năng này"
      );
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      // Show local image immediately for better UX
      setAvatarUri(localUri);
      setIsUploading(true);

      try {
        console.log("Uploading avatar...", localUri);
        const response = await customerAPI.uploadAvatar(localUri);
        console.log("Upload response:", response);

        if (response.success) {
          // Refresh profile to get server avatar URL
          await refetch();
          Alert.alert("Thành công", "Ảnh đại diện đã được lưu!");
        } else {
          // Revert to old avatar on error
          setAvatarUri(profile?.avatarUrl || null);
          Alert.alert(
            "Lỗi upload",
            response.message || response.error || "Không thể upload ảnh"
          );
        }
      } catch (error: any) {
        console.error("Upload error:", error);
        setAvatarUri(profile?.avatarUrl || null);

        let errorMessage = "Có lỗi xảy ra khi upload ảnh";
        if (error.message?.includes("aborted")) {
          errorMessage = "Upload timeout. Vui lòng thử lại.";
        } else if (error.message?.includes("Network")) {
          errorMessage = "Lỗi kết nối mạng. Kiểm tra kết nối và thử lại.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        Alert.alert("Lỗi", errorMessage);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const showImagePicker = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Hủy", "Chụp ảnh", "Chọn từ thư viện"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage(true);
          } else if (buttonIndex === 2) {
            pickImage(false);
          }
        }
      );
    } else {
      Alert.alert(
        "Chọn ảnh đại diện",
        "Bạn muốn chụp ảnh mới hay chọn từ thư viện?",
        [
          { text: "Hủy", style: "cancel" },
          { text: "Chụp ảnh", onPress: () => pickImage(true) },
          { text: "Chọn từ thư viện", onPress: () => pickImage(false) },
        ]
      );
    }
  };

  const handleCancel = () => {
    setUserInfo(originalUserInfo);
    setIsEditing(false);
  };

  const handleInputChange =
    (field: keyof typeof userInfo) => (text: string) => {
      setUserInfo({ ...userInfo, [field]: text });
    };

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
      <Header title={t("personalInfo.title")} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={showImagePicker}
            style={styles.avatarContainer}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            <Image
              source={{
                uri:
                  avatarUri &&
                  (avatarUri.startsWith("http") || avatarUri.startsWith("file"))
                    ? avatarUri
                    : avatarUri
                    ? `${API_BASE_URL}${avatarUri}`
                    : `https://i.pravatar.cc/150?u=${
                        user?.username || "default"
                      }`,
              }}
              style={styles.avatar}
            />
            <View
              style={[
                styles.avatarOverlay,
                {
                  backgroundColor: isDark
                    ? "rgba(0,0,0,0.6)"
                    : "rgba(0,0,0,0.4)",
                },
              ]}
            >
              <Text style={styles.avatarOverlayText}>
                {isUploading ? "⏳" : "📷"}
              </Text>
              <Text style={styles.avatarOverlayLabel}>
                {isUploading ? "Đang tải..." : "Đổi ảnh"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.infoCard,
            {
              backgroundColor: isDark
                ? Colors.dark.surface
                : Colors.light.surface,
            },
          ]}
        >
          {isEditing ? (
            <View style={styles.editForm}>
              <InputRow
                label={t("personalInfo.name")}
                value={userInfo.name}
                onChangeText={handleInputChange("name")}
                isDark={isDark}
              />
              <InputRow
                label={t("personalInfo.email")}
                value={userInfo.email}
                onChangeText={handleInputChange("email")}
                keyboardType="email-address"
                isDark={isDark}
              />
              <InputRow
                label={t("personalInfo.phone")}
                value={userInfo.phone}
                onChangeText={handleInputChange("phone")}
                keyboardType="phone-pad"
                isDark={isDark}
              />
            </View>
          ) : (
            <>
              <InfoRow
                label={t("personalInfo.name")}
                value={userInfo.name}
                isDark={isDark}
              />
              <InfoRow
                label={t("personalInfo.email")}
                value={userInfo.email}
                isDark={isDark}
              />
              <InfoRow
                label={t("personalInfo.phone")}
                value={userInfo.phone}
                isDark={isDark}
              />
              <InfoRow
                label={t("personalInfo.memberSince")}
                value="Oct 2023"
                isDark={isDark}
              />
            </>
          )}
        </View>

        <View style={styles.buttonContainer}>
          {isEditing ? (
            <View style={styles.editButtons}>
              <TouchableOpacity
                onPress={handleCancel}
                style={[
                  styles.button,
                  styles.buttonHalf,
                  { backgroundColor: isDark ? "#4B5563" : "#E5E7EB" },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.buttonText,
                    {
                      color: isDark
                        ? Colors.dark.onSurface
                        : Colors.light.onSurface,
                    },
                  ]}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.button,
                  styles.buttonHalf,
                  {
                    backgroundColor: isDark
                      ? Colors.dark.primary
                      : Colors.light.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.buttonText,
                    { color: isDark ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  {t("personalInfo.saveButton")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleEdit}
              style={[
                styles.button,
                {
                  backgroundColor: isDark
                    ? Colors.dark.primary
                    : Colors.light.primary,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: isDark ? "#000000" : "#FFFFFF" },
                ]}
              >
                {t("personalInfo.editButton")}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.xl,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: "hidden",
    position: "relative",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlayText: {
    fontSize: 32,
    marginBottom: 4,
  },
  avatarOverlayLabel: {
    color: "#FFFFFF",
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: FontSizes.base,
  },
  infoValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
  },
  editForm: {
    gap: Spacing.md,
  },
  inputRow: {
    paddingVertical: Spacing.sm,
  },
  inputLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    fontSize: FontSizes.base,
  },
  buttonContainer: {
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  editButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  buttonHalf: {
    flex: 1,
  },
  buttonText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
});

export default PersonalInfoScreen;
