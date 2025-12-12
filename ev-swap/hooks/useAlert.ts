import { useState, useCallback } from "react";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

export const useAlert = () => {
  const [alertConfig, setAlertConfig] = useState<
    AlertOptions & { visible: boolean }
  >({
    visible: false,
    title: "",
    message: "",
    buttons: [],
  });

  const showAlert = useCallback(
    (title: string, message?: string, buttons?: AlertButton[]) => {
      setAlertConfig({
        visible: true,
        title,
        message,
        buttons: buttons || [{ text: "OK" }],
      });
    },
    []
  );

  const hideAlert = useCallback(() => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  return {
    alertConfig,
    showAlert,
    hideAlert,
  };
};
