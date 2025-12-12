import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { authAPI } from "../services/api";

const LoginTestScreen = () => {
  const [username, setUsername] = useState("newuser123");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing...");

    try {
      console.log("Attempting login with:", { username, password });
      const response = await authAPI.login({ username, password });

      console.log("Login response:", response);

      if (response.success) {
        setResult(
          `✅ Success: ${
            response.message
          }\nToken: ${response.data?.token?.substring(0, 20)}...`
        );
        Alert.alert("Success", response.message);
      } else {
        setResult(`❌ Failed: ${response.message}`);
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setResult(`❌ Error: ${errorMsg}`);
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
    setLoading(true);
    setResult("Testing register...");

    try {
      const userData = {
        username: `testuser${Date.now()}`,
        password: "123456",
        fullName: "Test User",
        phone: `090${Math.floor(Math.random() * 10000000)}`,
        email: `test${Date.now()}@example.com`,
      };

      console.log("Attempting register with:", userData);
      const response = await authAPI.register(userData);

      console.log("Register response:", response);

      if (response.success) {
        setResult(`✅ Register Success: ${response.message}`);
        setUsername(userData.username);
        Alert.alert("Success", "User created! Try login now.");
      } else {
        setResult(`❌ Register Failed: ${response.message}`);
        Alert.alert("Error", response.message);
      }
    } catch (error) {
      console.error("Register error:", error);
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      setResult(`❌ Register Error: ${errorMsg}`);
      Alert.alert("Error", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Test Screen</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: loading ? "#ccc" : "#007AFF" },
        ]}
        onPress={testLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Testing..." : "Test Login"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: loading ? "#ccc" : "#28a745" },
        ]}
        onPress={testRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Testing..." : "Test Register"}
        </Text>
      </TouchableOpacity>

      <View style={styles.resultContainer}>
        <Text style={styles.resultTitle}>Result:</Text>
        <Text style={styles.resultText}>{result}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 14,
    fontFamily: "monospace",
  },
});

export default LoginTestScreen;
