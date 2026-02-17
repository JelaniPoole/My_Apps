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
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { challenges } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

function ChallengeCard({
  challenge,
  completed,
}: {
  challenge: (typeof challenges)[0];
  completed: boolean;
}) {
  function handlePress() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({ pathname: "/challenge/[id]", params: { id: challenge.id } });
  }

  const diffColor =
    challenge.difficulty === "beginner"
      ? Colors.success
      : challenge.difficulty === "intermediate"
      ? Colors.warning
      : Colors.error;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconWrap, completed && { backgroundColor: Colors.terminalGreen + "20" }]}>
          {completed ? (
            <Ionicons name="checkmark-circle" size={22} color={Colors.terminalGreen} />
          ) : (
            <Ionicons name={challenge.icon as any} size={22} color={diffColor} />
          )}
        </View>
        <View style={styles.xpWrap}>
          <Ionicons name="star" size={12} color={Colors.xpGold} />
          <Text style={styles.xpText}>{challenge.xpReward} XP</Text>
        </View>
      </View>
      <Text style={styles.cardTitle}>{challenge.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {challenge.description}
      </Text>
      <View style={[styles.diffBadge, { backgroundColor: diffColor + "15" }]}>
        <Text style={[styles.diffText, { color: diffColor }]}>{challenge.difficulty}</Text>
      </View>
    </Pressable>
  );
}

export default function ChallengesScreen() {
  const insets = useSafeAreaInsets();
  const { completedChallenges } = useProgress();
  const webTopInset = Platform.OS === "web" ? 67 : 0;

  const beginnerChallenges = challenges.filter((c) => c.difficulty === "beginner");
  const intermediateChallenges = challenges.filter((c) => c.difficulty === "intermediate");

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
        <Text style={styles.title}>Challenges</Text>
        <Text style={styles.subtitle}>
          Test your skills with real-world tasks
        </Text>

        <View style={styles.progressBar}>
          <Text style={styles.progressText}>
            {completedChallenges.length}/{challenges.length} completed
          </Text>
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${(completedChallenges.length / challenges.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Beginner</Text>
        <View style={styles.grid}>
          {beginnerChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              completed={completedChallenges.includes(challenge.id)}
            />
          ))}
        </View>

        <Text style={styles.sectionLabel}>Intermediate</Text>
        <View style={styles.grid}>
          {intermediateChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              completed={completedChallenges.includes(challenge.id)}
            />
          ))}
        </View>

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
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  progressBar: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  barBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    width: "48.5%",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.accent + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  xpWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpText: {
    fontSize: 12,
    color: Colors.xpGold,
    fontWeight: "600" as const,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10,
  },
  diffBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
});
