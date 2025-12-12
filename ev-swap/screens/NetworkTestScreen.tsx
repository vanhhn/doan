import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";

const NetworkTestScreen = () => {
  const [results, setResults] = useState<string[]>([]);
  const [customUrl, setCustomUrl] = useState("http://192.168.1.9:3000");

  const addResult = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setResults((prev) => [`[${timestamp}] ${message}`, ...prev]);
  };

  const testBasicConnectivity = async () => {
    addResult("🔄 Testing basic connectivity...");

    try {
      const response = await fetch(customUrl);
      const data = await response.json();

      if (response.ok) {
        addResult(`✅ SUCCESS: ${JSON.stringify(data)}`);
      } else {
        addResult(
          `❌ HTTP Error: ${response.status} - ${JSON.stringify(data)}`
        );
      }
    } catch (error) {
      addResult(`❌ Network Error: ${error}`);
    }
  };

  const testLoginAPI = async () => {
    addResult("🔄 Testing login API...");

    try {
      const loginData = {
        username: "newuser123",
        password: "123456",
      };

      const response = await fetch(`${customUrl}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        addResult(`✅ LOGIN SUCCESS: ${data.message}`);
        addResult(`🎫 Token: ${data.data?.token?.substring(0, 30)}...`);
      } else {
        addResult(`❌ LOGIN FAILED: ${data.message}`);
      }
    } catch (error) {
      addResult(`❌ Login Error: ${error}`);
    }
  };

  const testRegisterAPI = async () => {
    addResult("🔄 Testing register API...");

    try {
      const registerData = {
        username: `testmobile${Date.now()}`,
        password: "123456",
        fullName: "Mobile Test User",
        phone: `090${Math.floor(Math.random() * 10000000)}`,
        email: `mobile${Date.now()}@test.com`,
      };

      const response = await fetch(`${customUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (response.ok) {
        addResult(`✅ REGISTER SUCCESS: ${data.message}`);
        addResult(`👤 New user: ${registerData.username}`);
      } else {
        addResult(`❌ REGISTER FAILED: ${data.message}`);
      }
    } catch (error) {
      addResult(`❌ Register Error: ${error}`);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔬 Network Test Screen</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>API Base URL:</Text>
        <TextInput
          style={styles.input}
          value={customUrl}
          onChangeText={setCustomUrl}
          placeholder="Enter API URL"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testBasicConnectivity}
        >
          <Text style={styles.buttonText}>Test Basic API</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.successButton]}
          onPress={testRegisterAPI}
        >
          <Text style={styles.buttonText}>Test Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.warningButton]}
          onPress={testLoginAPI}
        >
          <Text style={styles.buttonText}>Test Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={clearResults}
        >
          <Text style={styles.buttonText}>Clear Results</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>📋 Test Results:</Text>
        <ScrollView style={styles.resultsScroll}>
          {results.length === 0 ? (
            <Text style={styles.noResults}>
              No test results yet. Run a test above.
            </Text>
          ) : (
            results.map((result, index) => (
              <Text key={index} style={styles.resultItem}>
                {result}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
  },
  buttonContainer: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007AFF",
  },
  successButton: {
    backgroundColor: "#28a745",
  },
  warningButton: {
    backgroundColor: "#ffc107",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  resultsScroll: {
    flex: 1,
  },
  noResults: {
    textAlign: "center",
    color: "#666",
    fontStyle: "italic",
    padding: 20,
  },
  resultItem: {
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 4,
    padding: 8,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    color: "#333",
  },
});

export default NetworkTestScreen;
