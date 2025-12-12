// Test CustomAlert component
import React from "react";
import { View, Button, StyleSheet } from "react-native";
import CustomAlert from "./components/CustomAlert";
import { useAlert } from "./hooks/useAlert";

const TestAlert = () => {
  const { alertConfig, showAlert, hideAlert } = useAlert();

  return (
    <View style={styles.container}>
      <Button
        title="Thông báo Thành công"
        onPress={() =>
          showAlert(
            "Thành công",
            "Đặt chỗ thành công! Vui lòng đến trạm trong 30 phút."
          )
        }
      />

      <View style={styles.spacer} />

      <Button
        title="Thông báo Lỗi"
        onPress={() =>
          showAlert("Lỗi", "Không thể kết nối đến server. Vui lòng thử lại.")
        }
      />

      <View style={styles.spacer} />

      <Button
        title="Thông báo với 2 nút"
        onPress={() =>
          showAlert("Xác nhận", "Bạn có chắc muốn đặt chỗ tại trạm này?", [
            { text: "Hủy", style: "cancel" },
            { text: "Đồng ý", onPress: () => console.log("Đã xác nhận") },
          ])
        }
      />

      <View style={styles.spacer} />

      <Button
        title="Thông báo Nguy hiểm"
        onPress={() =>
          showAlert("Xóa tài khoản", "Hành động này không thể hoàn tác!", [
            { text: "Hủy", style: "cancel" },
            {
              text: "Xóa",
              style: "destructive",
              onPress: () => console.log("Đã xóa"),
            },
          ])
        }
        color="red"
      />

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  spacer: {
    height: 20,
  },
});

export default TestAlert;
