import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme } from "react-native";
import { Colors } from "./theme";

// --- Theme Context ---
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors.light;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Export ThemeContext for direct use with useContext
export { ThemeContext };

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>(systemColorScheme || "light");

  useEffect(() => {
    // Load saved theme preference
    AsyncStorage.getItem("theme").then((savedTheme) => {
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    await AsyncStorage.setItem("theme", newTheme);
  };

  const colors = theme === "dark" ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// --- I18n Context ---
type Language = "en" | "vi";

interface I18nContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Export I18nContext for direct use with useContext
export { I18nContext };

// Import translations directly
import enTranslations from "./locales/en.json";
import viTranslations from "./locales/vi.json";

const translations = {
  en: enTranslations,
  vi: viTranslations,
};

export const I18nProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    // Load saved language preference
    AsyncStorage.getItem("language").then((savedLang) => {
      if (savedLang === "en" || savedLang === "vi") {
        setLanguage(savedLang);
      }
    });
  }, []);

  const changeLanguage = async (lang: Language) => {
    setLanguage(lang);
    await AsyncStorage.setItem("language", lang);
  };

  const t = useCallback(
    (key: string, options?: { [key: string]: string | number }) => {
      const langTranslations = translations[language];
      if (!langTranslations) {
        return key;
      }

      const keys = key.split(".");
      let text: any = langTranslations;
      for (const k of keys) {
        if (text && typeof text === "object" && text[k] !== undefined) {
          text = text[k];
        } else {
          return key;
        }
      }

      if (typeof text === "string" && options) {
        Object.keys(options).forEach((optKey) => {
          text = text.replace(`{${optKey}}`, String(options[optKey]));
        });
      }

      return typeof text === "string" ? text : key;
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
