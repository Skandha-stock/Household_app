import { socket } from "../lib/socket";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";

import { apiFetch } from "../lib/api";

type Activity = {
  id: number;
  name: string;
  icon: string | null;
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

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

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

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [showDatePicker, setShowDatePicker] =
    useState(false);

  const [household, setHousehold] =
    useState<Household | null>(null);

  const [activities, setActivities] =
    useState<Activity[]>([]);

  const [completions, setCompletions] =
    useState<Completion[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    function handleActivityCompleted() {
      if (household) {
        loadCalendar(
          household.id,
          selectedDate
        );
      }
    }

    socket.on(
      "activityCompleted",
      handleActivityCompleted
    );

    return () => {
      socket.off(
        "activityCompleted",
        handleActivityCompleted
      );
    };
  }, [household, selectedDate]);

  useEffect(() => {
    if (household) {
      loadCalendar(
        household.id,
        selectedDate
      );
    }
  }, [selectedDate, household]);

  async function loadInitialData() {
    try {
      setLoading(true);
      setError("");

      const [
        householdData,
        activityData,
      ] = await Promise.all([
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

      setHousehold(
        householdResponse.households[0]
      );

      setActivities(
        activityResponse.activities || []
      );

    } catch (err: any) {
      console.log(
        "CALENDAR INITIAL LOAD ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load calendar."
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
      setLoading(true);
      setError("");

      const dateString =
        formatDate(date);

      console.log(
        "Loading calendar:",
        householdId,
        dateString
      );

      const data: CalendarResponse =
        await apiFetch(
          `/activities/calendar/${householdId}?date=${dateString}`
        );

      console.log(
        "CALENDAR:",
        data
      );

      setCompletions(
        data.completions || []
      );

    } catch (err: any) {
      console.log(
        "CALENDAR ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to load calendar."
      );

      setCompletions([]);
    } finally {
      setLoading(false);
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
    const date =
      new Date(selectedDate);

    date.setDate(
      date.getDate() - 1
    );

    setSelectedDate(date);
  }

  function goToNextDay() {
    const date =
      new Date(selectedDate);

    date.setDate(
      date.getDate() + 1
    );

    setSelectedDate(date);
  }

  function getCompletion(
    activityId: number
  ) {
    return completions.find(
      (completion) =>
        completion.activity.id ===
        activityId
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
      >
        <View style={styles.header}>
          <Pressable
            onPress={() =>
              router.back()
            }
            style={styles.backButton}
          >
            <Text
              style={styles.backText}
            >
              ‹ Back
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Calendar
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {household && (
          <Text
            style={styles.householdName}
          >
            {household.name}
          </Text>
        )}

        <View
          style={styles.dateControls}
        >
          <Pressable
            onPress={
              goToPreviousDay
            }
            style={styles.arrowButton}
          >
            <Text
              style={styles.arrowText}
            >
              ‹
            </Text>
          </Pressable>

          <Pressable
            onPress={() =>
              setShowDatePicker(true)
            }
            style={styles.dateButton}
          >
            <Text
              style={styles.dateText}
            >
              {formatDisplayDate(
                selectedDate
              )}
            </Text>
          </Pressable>

          <Pressable
            onPress={goToNextDay}
            style={styles.arrowButton}
          >
            <Text
              style={styles.arrowText}
            >
              ›
            </Text>
          </Pressable>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={
              handleDateChange
            }
          />
        )}

        {loading ? (
          <ActivityIndicator
            size="large"
            style={styles.loading}
          />
        ) : error ? (
          <Text style={styles.error}>
            {error}
          </Text>
        ) : (
          <View
            style={
              styles.activitiesContainer
            }
          >
            <Text
              style={styles.sectionTitle}
            >
              Household Activities
            </Text>

            {activities.map(
              (activity) => {
                const completion =
                  getCompletion(
                    activity.id
                  );

                return (
                  <View
                    key={activity.id}
                    style={[
                      styles.activityCard,
                      completion
                        ? styles.completedCard
                        : styles.pendingCard,
                    ]}
                  >
                    <Text
                      style={
                        styles.activityIcon
                      }
                    >
                      {activity.icon ||
                        "✓"}
                    </Text>

                    <View
                      style={
                        styles.activityInfo
                      }
                    >
                      <Text
                        style={
                          styles.activityName
                        }
                      >
                        {activity.name}
                      </Text>

                      {completion ? (
                        <>
                          <Text
                            style={
                              styles.completedStatus
                            }
                          >
                            ✓ Completed
                          </Text>

                          <Text
                            style={
                              styles.completedBy
                            }
                          >
                            by{" "}
                            <Text
                              style={
                                styles.userName
                              }
                            >
                              {
                                completion
                                  .user
                                  .name
                              }
                            </Text>
                          </Text>

                          <Text
                            style={
                              styles.loginId
                            }
                          >
                            {
                              completion
                                .user
                                .loginId
                            }
                          </Text>
                        </>
                      ) : (
                        <Text
                          style={
                            styles.pendingStatus
                          }
                        >
                          Not completed
                        </Text>
                      )}
                    </View>

                    <Text
                      style={
                        completion
                          ? styles.statusIconCompleted
                          : styles.statusIconPending
                      }
                    >
                      {completion
                        ? "✓"
                        : "—"}
                    </Text>
                  </View>
                );
              }
            )}

            {activities.length === 0 && (
              <Text
                style={styles.noActivities}
              >
                No activities found.
              </Text>
            )}
          </View>
        )}
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 10,
  },

  backButton: {
    width: 70,
  },

  backText: {
    fontSize: 17,
  },

  title: {
    fontSize: 28,
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
    marginBottom: 25,
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

  loading: {
    marginTop: 40,
  },

  error: {
    textAlign: "center",
    color: "red",
    marginTop: 30,
  },

  activitiesContainer: {
    marginTop: 10,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
  },

  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },

  completedCard: {
    borderColor: "#999999",
  },

  pendingCard: {
    borderColor: "#cccccc",
  },

  activityIcon: {
    fontSize: 35,
    marginRight: 15,
  },

  activityInfo: {
    flex: 1,
  },

  activityName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 5,
  },

  completedStatus: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 2,
  },

  completedBy: {
    fontSize: 14,
    marginTop: 3,
    opacity: 0.7,
  },

  userName: {
    fontWeight: "600",
    opacity: 1,
  },

  loginId: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 3,
  },

  pendingStatus: {
    fontSize: 14,
    marginTop: 3,
    opacity: 0.5,
  },

  statusIconCompleted: {
    fontSize: 25,
    fontWeight: "700",
  },

  statusIconPending: {
    fontSize: 25,
    opacity: 0.3,
  },

  noActivities: {
    textAlign: "center",
    marginTop: 30,
    opacity: 0.5,
  },
});