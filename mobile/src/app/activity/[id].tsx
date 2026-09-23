import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { router, useLocalSearchParams } from "expo-router";

import { apiFetch } from "../../lib/api";

type Activity = {
  id: number;
  name: string;
  icon: string | null;
};

type Household = {
  id: number;
  name: string;
  role: string;
};

type HouseholdResponse = {
  households: Household[];
};

type ActivityResponse = {
  activities: Activity[];
};

type Completion = {
  id: number;
  date: string;
  completedAt: string;
  activity: Activity;
  user: {
    id: string;
    name: string;
    loginId: string;
  };
};

type CalendarResponse = {
  date: string;
  completions: Completion[];
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isFutureDate(date: Date) {
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return selected > today;
}

export default function ActivityScreen() {
  const params = useLocalSearchParams<{ id: string }>();

  const activityId = Number(params.id);

  const [activity, setActivity] = useState<Activity | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (household && activity) {
      loadCalendar(household.id, selectedDate);
    }
  }, [selectedDate, household, activity]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [householdData, activityData] =
        await Promise.all([
          apiFetch("/households"),
          apiFetch("/activities"),
        ]);

      const householdResponse =
        householdData as HouseholdResponse;

      const activityResponse =
        activityData as ActivityResponse;

      if (
        !householdResponse.households ||
        householdResponse.households.length === 0
      ) {
        setError(
          "You are not a member of any household."
        );
        return;
      }

      const selectedHousehold =
        householdResponse.households[0];

      setHousehold(selectedHousehold);

      const selectedActivity =
        activityResponse.activities.find(
          (item) => item.id === activityId
        );

      if (!selectedActivity) {
        setError("Activity not found.");
        return;
      }

      setActivity(selectedActivity);

    } catch (err: any) {
      console.log("ACTIVITY LOAD ERROR:", err);

      setError(
        err.message ||
          "Unable to load activity."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendar(
    householdId: number,
    date: Date
  ) {
    try {
      const dateString = formatDate(date);

      console.log(
        "Loading activity calendar:",
        activityId,
        dateString
      );

      const data: CalendarResponse =
        await apiFetch(
          `/activities/calendar/${householdId}?date=${dateString}`
        );

      const activityCompletions =
        data.completions.filter(
          (completion) =>
            completion.activity.id === activityId
        );

      setCompletions(activityCompletions);

    } catch (err: any) {
      console.log(
        "ACTIVITY CALENDAR ERROR:",
        err
      );

      setCompletions([]);
    }
  }

  async function handleComplete() {
    if (!household || !activity) {
      return;
    }

    try {
      setSubmitting(true);

      const dateString =
        formatDate(selectedDate);

      console.log(
        "Completing activity:",
        activity.id,
        dateString
      );

      await apiFetch(
        `/activities/${activity.id}/complete`,
        {
          method: "POST",
          body: JSON.stringify({
            householdId: household.id,
            date: dateString,
          }),
        }
      );

      Alert.alert(
        "Completed",
        `${activity.name} has been recorded.`,
        [
          {
            text: "OK",
            onPress: () => {
              loadCalendar(
                household.id,
                selectedDate
              );
            },
          },
        ]
      );

    } catch (err: any) {
  console.log(
    "COMPLETE ACTIVITY ERROR:",
    err
  );

  const message =
    err?.message || "";

  if (
    message.includes("Network request failed") ||
    message.includes("Failed to fetch") ||
    message.includes("NetworkError")
  ) {
    Alert.alert(
      "No internet connection",
      "Unable to connect to the server. Please check your internet connection and try again."
    );
  } else {
    Alert.alert(
      "Unable to complete",
      message ||
        "Unable to record the activity."
    );
  }
} finally {
      setSubmitting(false);
    }
  }

  function handleDateChange(
    _event: any,
    date?: Date
  ) {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
    }
  }

  function goToPreviousDay() {
    const date = new Date(selectedDate);

    date.setDate(
      date.getDate() - 1
    );

    setSelectedDate(date);
  }

  function goToNextDay() {
    const date = new Date(selectedDate);

    date.setDate(
      date.getDate() + 1
    );

    setSelectedDate(date);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !activity) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.error}>
            {error || "Unable to load activity."}
          </Text>

          <Pressable
            style={styles.backButtonLarge}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const alreadyCompleted =
    completions.length > 0;
  const futureDate = 
    isFutureDate(selectedDate);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>
              ‹ Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            {activity.icon} {activity.name}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {household && (
          <Text style={styles.householdName}>
            {household.name}
          </Text>
        )}

        <View style={styles.dateControls}>
          <Pressable
            onPress={goToPreviousDay}
            style={styles.arrowButton}
          >
            <Text style={styles.arrowText}>
              ‹
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setShowDatePicker(true)
            }
            style={styles.dateButton}
          >
            <Text style={styles.dateText}>
              {formatDisplayDate(
                selectedDate
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={goToNextDay}
            style={styles.arrowButton}
          >
            <Text style={styles.arrowText}>
              ›
            </Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <View style={styles.actionContainer}>
  {futureDate ? (
    <View style={styles.completedBox}>
      <Text style={styles.completedIcon}>
        📅
      </Text>

      <Text style={styles.completedTitle}>
        Future date
      </Text>

      <Text style={styles.completedText}>
        Activities cannot be marked as completed
        for a future date.
      </Text>
    </View>
  ) : alreadyCompleted ? (
            <View style={styles.completedBox}>
              <Text style={styles.completedIcon}>
                ✓
              </Text>

              <Text style={styles.completedTitle}>
                Already completed
              </Text>

              <Text style={styles.completedText}>
                This activity has already been
                completed for this date.
              </Text>

              <Text style={styles.completedBy}>
                Completed by{" "}
                <Text style={styles.bold}>
                  {completions[0].user.name}
                </Text>
              </Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.didItButton,
                pressed &&
                  styles.didItButtonPressed,
                submitting &&
                  styles.didItButtonDisabled,
              ]}
              onPress={handleComplete}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.didItIcon}>
                    ✓
                  </Text>

                  <Text style={styles.didItText}>
                    I DID IT
                  </Text>
                </>
              )}
            </Pressable>
          )}
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>
            Activity status
          </Text>

          {alreadyCompleted ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusIcon}>
                {activity.icon}
              </Text>

              <View>
                <Text style={styles.statusActivity}>
                  {activity.name}
                </Text>

                <Text style={styles.statusText}>
                  Completed by{" "}
                  {completions[0].user.name}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.notCompletedText}>
              Not completed on this date.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  backButton: {
    width: 70,
  },

  backText: {
    fontSize: 17,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
  },

  headerSpacer: {
    width: 70,
  },

  householdName: {
    textAlign: "center",
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 25,
  },

  dateControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },

  arrowButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 30,
  },

  dateButton: {
    flex: 1,
    marginHorizontal: 10,
    minHeight: 50,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },

  dateText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  actionContainer: {
    marginTop: 10,
    marginBottom: 30,
  },

  didItButton: {
    height: 80,
    borderRadius: 18,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  didItButtonPressed: {
    opacity: 0.7,
  },

  didItButtonDisabled: {
    opacity: 0.6,
  },

  didItIcon: {
    color: "#ffffff",
    fontSize: 28,
    marginRight: 10,
  },

  didItText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },

  completedBox: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 25,
    alignItems: "center",
  },

  completedIcon: {
    fontSize: 40,
    marginBottom: 8,
  },

  completedTitle: {
    fontSize: 21,
    fontWeight: "700",
    marginBottom: 8,
  },

  completedText: {
    textAlign: "center",
    fontSize: 15,
    opacity: 0.6,
    lineHeight: 22,
  },

  completedBy: {
    marginTop: 15,
    fontSize: 15,
  },

  bold: {
    fontWeight: "700",
  },

  infoContainer: {
    borderTopWidth: 1,
    paddingTop: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusIcon: {
    fontSize: 35,
    marginRight: 15,
  },

  statusActivity: {
    fontSize: 17,
    fontWeight: "700",
  },

  statusText: {
    marginTop: 4,
    opacity: 0.6,
  },

  notCompletedText: {
    opacity: 0.6,
    fontSize: 15,
  },

  error: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    marginBottom: 20,
  },

  backButtonLarge: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#222222",
  },

  backButtonText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});