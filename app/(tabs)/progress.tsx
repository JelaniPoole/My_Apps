import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { lessons, challenges, commands, getCommandsByCategory } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function CommandRefCard({
  category,
  cmds,
}: {
  category: string;
  cmds: { name: string; description: string }[];
}) {
  return (
    <View style={styles.refCard}>
      <Text style={styles.refCategory}>{category}</Text>
      {cmds.map((cmd) => (
        <View key={cmd.name} style={styles.refRow}>
          <Text style={styles.refCmd}>{cmd.name}</Text>
          <Text style={styles.refDesc} numberOfLines={1}>
            {cmd.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { xp, level, xpProgress, completedLessons, completedChallenges, currentStreak, terminalHistory } =
    useProgress();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const grouped = getCommandsByCategory();

  const totalCommands = terminalHistory.length;
  const uniqueCommands = new Set(terminalHistory.map((c) => c.split(" ")[0])).size;

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
        <Text style={styles.title}>Your Progress</Text>

        <LinearGradient
          colors={["#0C1E3A", "#0D1117"]}
          style={styles.levelCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.levelTop}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>{level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Level {level}</Text>
              <Text style={styles.levelSubtitle}>{xp} total XP earned</Text>
            </View>
          </View>
          <View style={styles.levelBarBg}>
            <View
              style={[styles.levelBarFill, { width: `${Math.min(xpProgress * 100, 100)}%` }]}
            />
          </View>
          <Text style={styles.levelProgress}>
            {Math.round(xpProgress * 100)}% to Level {level + 1}
          </Text>
        </LinearGradient>

        <View style={styles.statsGrid}>
          <StatCard icon="flame" label="Day Streak" value={`${currentStreak}`} color={Colors.warning} />
          <StatCard
            icon="book"
            label="Lessons Done"
            value={`${completedLessons.length}/${lessons.length}`}
            color={Colors.accent}
          />
          <StatCard
            icon="flag"
            label="Challenges"
            value={`${completedChallenges.length}/${challenges.length}`}
            color={Colors.terminalGreen}
          />
          <StatCard
            icon="terminal"
            label="Commands Run"
            value={`${totalCommands}`}
            color="#A78BFA"
          />
        </View>

        <View style={styles.insightCard}>
          <Ionicons name="bulb" size={18} color={Colors.xpGold} />
          <Text style={styles.insightText}>
            {uniqueCommands === 0
              ? "Start practicing in the terminal to track your unique commands!"
              : `You've used ${uniqueCommands} unique commands. Keep exploring!`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Command Reference</Text>
        <Text style={styles.sectionSubtitle}>Quick reference for all commands</Text>

        {Object.entries(grouped).map(([category, cmds]) => (
          <CommandRefCard key={category} category={category} cmds={cmds} />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

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
    marginBottom: 20,
  },
  levelCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  levelTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent + "25",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  levelNumber: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: Colors.accent,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  levelSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  levelBarBg: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  levelBarFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  levelProgress: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    width: "48.5%",
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.xpGold + "10",
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.xpGold + "20",
  },
  insightText: {
    fontSize: 13,
    color: Colors.text,
    flex: 1,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  refCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refCategory: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.accent,
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 12,
  },
  refCmd: {
    fontFamily: monoFont,
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.terminalGreen,
    width: 70,
  },
  refDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
});
