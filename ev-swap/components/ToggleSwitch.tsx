import React from "react";
import { TouchableOpacity, View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../contexts";

interface ToggleSwitchProps {
  isOn: boolean;
  handleToggle: () => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ isOn, handleToggle }) => {
  const { colors } = useTheme();
  const translateX = React.useRef(new Animated.Value(isOn ? 24 : 0)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: isOn ? 24 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [isOn, translateX]);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      style={[
        styles.container,
        { backgroundColor: isOn ? colors.primary : colors.border },
      ]}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.toggle, { transform: [{ translateX }] }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: "center",
  },
  toggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default ToggleSwitch;
