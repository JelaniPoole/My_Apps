import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { lessons } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color =
    difficulty === "beginner"
      ? Colors.success
      : difficulty === "intermediate"
      ? Colors.warning
      : Colors.error;
  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.badgeText, { color }]}>{difficulty}</Text>
    </View>
  );
}

function LessonCard({
  lesson,
  index,
  completed,
}: {
  lesson: (typeof lessons)[0];
  index: number;
  completed: boolean;
}) {
  function handlePress() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/lesson/[id]", params: { id: lesson.id } });
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.lessonCard, pressed && styles.pressed]}
    >
      <View style={styles.lessonLeft}>
        <View
          style={[
            styles.lessonIcon,
            completed && { backgroundColor: Colors.terminalGreen + "20" },
          ]}
        >
          {completed ? (
            <Ionicons name="checkmark-circle" size={24} color={Colors.terminalGreen} />
          ) : (
            <Ionicons name={lesson.icon as any} size={24} color={Colors.accent} />
          )}
        </View>
        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDesc} numberOfLines={1}>
            {lesson.description}
          </Text>
          <View style={styles.lessonMeta}>
            <DifficultyBadge difficulty={lesson.difficulty} />
            <View style={styles.xpBadge}>
              <Ionicons name="star" size={12} color={Colors.xpGold} />
              <Text style={styles.xpText}>{lesson.xpReward} XP</Text>
            </View>
          </View>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
    </Pressable>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { completedLessons, level, xp, xpProgress, currentStreak } = useProgress();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + webTopInset + 16 },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={["#0B2A1A", "#0D1117"]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Terminal Quest</Text>
              <Text style={styles.subtitle}>
                Level {level} \u00B7 {xp} XP
              </Text>
            </View>
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={20} color={Colors.warning} />
              <Text style={styles.streakText}>{currentStreak}</Text>
            </View>
          </View>

          <View style={styles.xpBarContainer}>
            <View style={styles.xpBarBg}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.min(xpProgress * 100, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.xpLabel}>
              {Math.round(xpProgress * 100)}% to Level {level + 1}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{completedLessons.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{lessons.length - completedLessons.length}</Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{lessons.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Lessons</Text>

        {lessons.map((lesson, index) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={index}
            completed={completedLessons.includes(lesson.id)}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  headerGradient: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.warning + "15",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.warning,
  },
  xpBarContainer: {
    marginBottom: 16,
  },
  xpBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    backgroundColor: Colors.terminalGreen,
    borderRadius: 3,
  },
  xpLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 12,
  },
  lessonCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  lessonLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 14,
  },
  lessonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  lessonDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  lessonMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpText: {
    fontSize: 12,
    color: Colors.xpGold,
    fontWeight: "500" as const,
  },
});
