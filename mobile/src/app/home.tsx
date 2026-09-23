import { socket } from "../lib/socket";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router } from "expo-router";
import { apiFetch } from "../lib/api";

type Household = {
  id: number;
  name: string;
  role: string;
  joinedAt: string;
};

type HouseholdResponse = {
  households: Household[];
};

export default function HomeScreen() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHousehold();
  }, []);

  async function loadHousehold() {
    try {
      setLoading(true);
      setError("");

      const data: HouseholdResponse = await apiFetch("/households");

      console.log("HOUSEHOLDS:", data);

      if (data.households && data.households.length > 0) {
        const household = data.households[0];

        setHousehold(household);

        socket.emit(
          "joinHousehold",
          household.id
        );
      } else {
        console.log("No household found. Clearing session.");

        await SecureStore.deleteItemAsync("accessToken");
        await SecureStore.deleteItemAsync("user");

        router.replace("/");
        return;
      }
    } catch (err: any) {
      console.log("HOUSEHOLD ERROR:", err);

      setError(
        err.message || "Unable to load household."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCalendar() {
    router.push("/calendar");
  }

  async function handleLogout() {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("user");

  router.replace("/");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Household</Text>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : household ? (
          <>
            <Text style={styles.householdName}>
              {household.name}
            </Text>

            <Text style={styles.role}>
              {household.role}
            </Text>
          </>
        ) : (
          <Text style={styles.error}>
            {error}
          </Text>
        )}

        <View style={styles.grid}>
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={openCalendar}
          >
            <Text style={styles.icon}>📅</Text>
            <Text style={styles.label}>Calendar</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/activity/2")}
          >
            <Text style={styles.icon}>🗑️</Text>
            <Text style={styles.label}>Dustbin</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/activity/1")}
          >
            <Text style={styles.icon}>💧</Text>
            <Text style={styles.label}>Water Can</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push("/activity/3")}
          >
            <Text style={styles.icon}>🧹</Text>
            <Text style={styles.label}>Cleaning</Text>
          </Pressable>
        </View>

        <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
        >
          <Text style={styles.logoutText}>
            LOGOUT
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  logoutButton: {
  marginTop: 20,
  paddingVertical: 14,
  paddingHorizontal: 40,
  borderRadius: 10,
  borderWidth: 1,
},

logoutText: {
  fontSize: 15,
  fontWeight: "700",
},

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    padding: 24,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 30,
  },

  householdName: {
    fontSize: 22,
    marginTop: 10,
    fontWeight: "600",
  },

  role: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },

  error: {
    marginTop: 20,
    color: "red",
  },

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 40,
  },

  card: {
    width: "47%",
    height: 150,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  cardPressed: {
    opacity: 0.6,
  },

  icon: {
    fontSize: 45,
    marginBottom: 10,
  },

  label: {
    fontSize: 17,
    fontWeight: "600",
  },
});