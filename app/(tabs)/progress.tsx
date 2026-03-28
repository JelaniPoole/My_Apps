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
import Animated, { FadeInDown } from "react-native-reanimated";
import Colors from "@/constants/colors";
import {
  getAchievements,
  getCommandsByCategory,
  RANKS,
} from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

const STAT_META: Record<string, { label: string; fullName: string; icon: string; color: string; desc: string }> = {
  STR: { label: "STR", fullName: "Strength", icon: "fitness", color: Colors.statSTR, desc: "File Operations" },
  INT: { label: "INT", fullName: "Intelligence", icon: "bulb", color: Colors.statINT, desc: "Text Processing" },
  AGI: { label: "AGI", fullName: "Agility", icon: "flash", color: Colors.statAGI, desc: "Navigation" },
  VIT: { label: "VIT", fullName: "Vitality", icon: "heart", color: Colors.statVIT, desc: "System Commands" },
  DEF: { label: "DEF", fullName: "Defense", icon: "shield", color: Colors.statDEF, desc: "Permissions" },
};

function CommandRefCard({ category, cmds }: { category: string; cmds: { name: string; description: string }[] }) {
  return (
    <View style={styles.refCard}>
      <Text style={styles.refCategory}>{category}</Text>
      {cmds.map((cmd) => (
        <View key={cmd.name} style={styles.refRow}>
          <Text style={styles.refCmd}>{cmd.name}</Text>
          <Text style={styles.refDesc} numberOfLines={1}>{cmd.description}</Text>
        </View>
      ))}
    </View>
  );
}

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const {
    stats, level, rank, completedLessons, completedChallenges,
    currentStreak, terminalHistory, totalPower,
  } = useProgress();
  const webTop = Platform.OS === "web" ? 67 : 0;
  const grouped = getCommandsByCategory();
  const uniqueCommands = new Set(terminalHistory.map((c) => c.split(" ")[0])).size;
  const achievements = getAchievements({
    completedLessons,
    completedChallenges,
    currentStreak,
    terminalHistory,
  });
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Ionicons name="analytics" size={22} color={Colors.primary} />
          <Text style={styles.pageTitle}>Hunter Stats</Text>
        </View>

        <Animated.View entering={FadeInDown.duration(500)}>
          <LinearGradient colors={[Colors.primary + "20", Colors.surface]} style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={[styles.profileRank, { borderColor: rank.color }]}>
                <Text style={[styles.profileRankText, { color: rank.color }]}>{rank.rank}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileTitle}>{rank.title}</Text>
                <Text style={styles.profileLevel}>Level {level}</Text>
              </View>
              <View style={styles.profilePower}>
                <Text style={styles.powerValue}>{totalPower}</Text>
                <Text style={styles.powerLabel}>Power</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(100)}>
          <Text style={styles.sectionTitle}>Detailed Stats</Text>
          <View style={styles.statsGrid}>
            {Object.entries(stats).map(([key, val]) => {
              const meta = STAT_META[key];
              return (
                <View key={key} style={styles.statDetailCard}>
                  <View style={[styles.statDetailIcon, { backgroundColor: meta.color + "20" }]}>
                    <Ionicons name={meta.icon as any} size={20} color={meta.color} />
                  </View>
                  <Text style={[styles.statDetailValue, { color: meta.color }]}>{val}</Text>
                  <Text style={styles.statDetailLabel}>{meta.fullName}</Text>
                  <Text style={styles.statDetailDesc}>{meta.desc}</Text>
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(200)}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementSummaryCard}>
            <View style={styles.achievementSummaryHeader}>
              <View>
                <Text style={styles.achievementSummaryValue}>
                  {unlockedAchievements.length}/{achievements.length}
                </Text>
                <Text style={styles.achievementSummaryLabel}>Achievements Unlocked</Text>
              </View>
              <Ionicons name="trophy" size={24} color={Colors.xpGold} />
            </View>
            <Text style={styles.achievementSummaryText}>
              Clear lessons, defeat raids, keep your streak alive, and use more commands to unlock every badge.
            </Text>
          </View>
          <View style={styles.achievementList}>
            {achievements.map((achievement) => {
              const pct = Math.min(achievement.progress / achievement.target, 1);

              return (
                <View
                  key={achievement.id}
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
                </View>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <Text style={styles.sectionTitle}>Rank Progression</Text>
          {RANKS.map((r) => (
            <View key={r.rank} style={[styles.rankRow, level >= r.minLevel && styles.rankUnlocked]}>
              <View style={[styles.rankIcon, { borderColor: r.color }]}>
                <Text style={[styles.rankLetter, { color: r.color }]}>{r.rank}</Text>
              </View>
              <View style={styles.rankInfo}>
                <Text style={[styles.rankName, level >= r.minLevel && { color: r.color }]}>{r.title}</Text>
                <Text style={styles.rankReq}>Level {r.minLevel}+</Text>
              </View>
              {level >= r.minLevel && (
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
              )}
            </View>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(300)}>
          {uniqueCommands > 0 && (
            <View style={styles.insightCard}>
              <Ionicons name="bulb" size={18} color={Colors.xpGold} />
              <Text style={styles.insightText}>
                  You&apos;ve mastered {uniqueCommands} unique commands. {uniqueCommands >= 15 ? "Impressive skill set!" : "Keep exploring!"}
              </Text>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <Text style={styles.sectionTitle}>Command Reference</Text>
          <Text style={styles.sectionSubtitle}>Quick reference for all commands</Text>
          {Object.entries(grouped).map(([category, cmds]) => (
            <CommandRefCard key={category} category={category} cmds={cmds} />
          ))}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  pageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 16 },
  pageTitle: { color: Colors.text, fontSize: 24, fontWeight: "800" },

  profileCard: { margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.primary + "30" },
  profileRow: { flexDirection: "row", alignItems: "center" },
  profileRank: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", borderWidth: 2 },
  profileRankText: { fontSize: 24, fontWeight: "900" },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileTitle: { color: Colors.text, fontSize: 18, fontWeight: "700" },
  profileLevel: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  profilePower: { alignItems: "center" },
  powerValue: { color: Colors.accent, fontSize: 24, fontWeight: "800" },
  powerLabel: { color: Colors.textMuted, fontSize: 11 },

  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "700", marginHorizontal: 20, marginTop: 20, marginBottom: 10 },
  sectionSubtitle: { color: Colors.textSecondary, fontSize: 13, marginHorizontal: 20, marginBottom: 12, marginTop: -4 },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: 16 },
  statDetailCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    width: "31%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statDetailIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", marginBottom: 6 },
  statDetailValue: { fontSize: 22, fontWeight: "800" },
  statDetailLabel: { color: Colors.text, fontSize: 11, fontWeight: "600", marginTop: 2 },
  statDetailDesc: { color: Colors.textMuted, fontSize: 9, marginTop: 1 },

  achievementSummaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementSummaryValue: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  achievementSummaryLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  achievementSummaryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  achievementList: { marginHorizontal: 16, marginTop: 10, gap: 10 },
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
  achievementBody: { flex: 1 },
  achievementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  achievementTitle: { color: Colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  achievementProgressValue: { color: Colors.textMuted, fontSize: 12, fontWeight: "600" },
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
  achievementBarFill: { height: "100%", borderRadius: 3 },

  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  rankUnlocked: { opacity: 1 },
  rankIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center", borderWidth: 2 },
  rankLetter: { fontSize: 16, fontWeight: "900" },
  rankInfo: { flex: 1, marginLeft: 12 },
  rankName: { color: Colors.textMuted, fontSize: 14, fontWeight: "600" },
  rankReq: { color: Colors.textMuted, fontSize: 11 },

  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.xpGold + "10",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.xpGold + "20",
  },
  insightText: { fontSize: 13, color: Colors.text, flex: 1, lineHeight: 18 },

  refCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refCategory: { fontSize: 13, fontWeight: "600", color: Colors.accent, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: 1 },
  refRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, gap: 12 },
  refCmd: { fontFamily: monoFont, fontSize: 14, fontWeight: "600", color: Colors.terminalGreen, width: 70 },
  refDesc: { fontSize: 13, color: Colors.textSecondary, flex: 1 },
});
