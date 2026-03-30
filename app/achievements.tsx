import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { getAchievements } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const {
    completedLessons,
    completedChallenges,
    currentStreak,
    terminalHistory,
  } = useProgress();

  const achievements = getAchievements({
    completedLessons,
    completedChallenges,
    currentStreak,
    terminalHistory,
  });
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 8,
          paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32,
        }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Achievements</Text>
            <Text style={styles.subtitle}>Track every badge and long-term milestone.</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(400)} style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryValue}>
                {unlockedAchievements.length}/{achievements.length}
              </Text>
              <Text style={styles.summaryLabel}>Achievements Unlocked</Text>
            </View>
            <Ionicons name="trophy" size={24} color={Colors.xpGold} />
          </View>
          <Text style={styles.summaryText}>
            Clear lessons, defeat raids, keep your streak alive, and use more commands to unlock every badge.
          </Text>
        </Animated.View>

        <View style={styles.list}>
          {achievements.map((achievement, index) => {
            const pct = Math.min(achievement.progress / achievement.target, 1);

            return (
              <Animated.View
                key={achievement.id}
                entering={FadeInDown.duration(350).delay(50 + index * 30)}
                style={[
                  styles.achievementCard,
                  achievement.unlocked && styles.achievementCardUnlocked,
                ]}
              >
                <View
                  style={[
                    styles.achievementIcon,
                    { backgroundColor: achievement.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={achievement.icon as any}
                    size={20}
                    color={achievement.color}
                  />
                </View>
                <View style={styles.achievementBody}>
                  <View style={styles.achievementRow}>
                    <Text style={styles.achievementTitle}>{achievement.title}</Text>
                    {achievement.unlocked ? (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                    ) : (
                      <Text style={styles.achievementProgressValue}>
                        {achievement.progress}/{achievement.target}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <View style={styles.achievementBarBg}>
                    <View
                      style={[
                        styles.achievementBarFill,
                        { width: `${pct * 100}%`, backgroundColor: achievement.color },
                      ]}
                    />
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 12,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  summaryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  list: {
    marginHorizontal: 16,
    marginTop: 12,
    gap: 10,
  },
  achievementCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementCardUnlocked: {
    borderColor: Colors.success + "35",
    backgroundColor: Colors.success + "08",
  },
  achievementIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementBody: {
    flex: 1,
  },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  achievementTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  achievementProgressValue: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  achievementDescription: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  achievementBarBg: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  achievementBarFill: {
    height: "100%",
    borderRadius: 3,
  },
});
