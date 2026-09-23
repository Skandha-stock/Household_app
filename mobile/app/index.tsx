import { useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { API_BASE_URL } from "../src/config/api";

export default function LoginScreen() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginId.trim() || !password) {
      Alert.alert("Missing information", "Enter your Login ID and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Login failed", data.message || "Unable to login.");
        return;
      }

      Alert.alert(
        "Login successful",
        `Welcome, ${data.user.name}!`
      );

      console.log("Logged in user:", data.user);
      console.log("Access token received.");
    } catch (error) {
      console.error("Login error:", error);

      Alert.alert(
        "Connection error",
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Household</Text>
        <Text style={styles.subtitle}>
          Manage your household activities
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Login ID"
          autoCapitalize="characters"
          autoCorrect={false}
          value={loginId}
          onChangeText={setLoginId}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "LOGIN"}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },

  button: {
    height: 52,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#222222",
    marginTop: 10,
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});