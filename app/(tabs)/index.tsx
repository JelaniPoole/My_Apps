import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import { getDailyQuests } from "@/lib/linux-data";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STAT_META: Record<string, { label: string; icon: string; color: string }> = {
  STR: { label: "STR", icon: "fitness", color: Colors.statSTR },
  INT: { label: "INT", icon: "bulb", color: Colors.statINT },
  AGI: { label: "AGI", icon: "flash", color: Colors.statAGI },
  VIT: { label: "VIT", icon: "heart", color: Colors.statVIT },
  DEF: { label: "DEF", icon: "shield", color: Colors.statDEF },
};

function StatBar({ type, value }: { type: string; value: number }) {
  const meta = STAT_META[type];
  const maxStat = 50;
  const pct = Math.min(value / maxStat, 1);

  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: meta.color + "20" }]}>
        <Ionicons name={meta.icon as any} size={14} color={meta.color} />
      </View>
      <Text style={[styles.statLabel, { color: meta.color }]}>{meta.label}</Text>
      <View style={styles.statBarBg}>
        <View style={[styles.statBarFill, { width: `${pct * 100}%`, backgroundColor: meta.color }]} />
      </View>
      <Text style={[styles.statValue, { color: meta.color }]}>{value}</Text>
    </View>
  );
}

function DailyQuestCard({
  quest,
  progress: questProgress,
  claimed,
  onClaim,
}: {
  quest: { id: string; title: string; description: string; xpReward: number; target: number };
  progress: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const done = questProgress >= quest.target;

  return (
    <View style={[styles.questCard, done && styles.questDone]}>
      <View style={styles.questLeft}>
        <Ionicons
          name={done ? "checkmark-circle" : "radio-button-off"}
          size={22}
          color={done ? Colors.success : Colors.textMuted}
        />
      </View>
      <View style={styles.questContent}>
        <Text style={[styles.questTitle, done && styles.questTitleDone]}>{quest.title}</Text>
        <Text style={styles.questDesc}>{quest.description}</Text>
        <View style={styles.questProgressRow}>
          <View style={styles.questBarBg}>
            <View
              style={[
                styles.questBarFill,
                { width: `${Math.min(questProgress / quest.target, 1) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.questProgressText}>
            {Math.min(questProgress, quest.target)}/{quest.target}
          </Text>
        </View>
      </View>
      <View style={styles.questRight}>
        {done && !claimed ? (
          <Pressable style={styles.claimBtn} onPress={onClaim}>
            <Text style={styles.claimText}>+{quest.xpReward}</Text>
          </Pressable>
        ) : (
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={10} color={claimed ? Colors.textMuted : Colors.xpGold} />
            <Text style={[styles.xpText, claimed && { color: Colors.textMuted }]}>{quest.xpReward}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function HunterDashboard() {
  const insets = useSafeAreaInsets();
  const {
    xp,
    stats,
    level,
    xpProgress,
    rank,
    nextRank,
    currentStreak,
    totalPower,
    completedLessons,
    completedChallenges,
    dailyProgress,
    addXp,
    claimDailyQuest,
    xpIntoCurrentLevel,
    xpForNextLevel,
  } = useProgress();

  const today = new Date().toDateString();
  const quests = getDailyQuests(today);

  function getQuestProgress(quest: { type: string }) {
    switch (quest.type) {
      case "lesson":
        return dailyProgress.lessonsToday;
      case "challenge":
        return dailyProgress.challengesToday;
      case "terminal":
        return dailyProgress.commandsToday;
      case "any":
        return 1;
      default:
        return 0;
    }
  }

  function handleClaimQuest(questId: string, xpReward: number) {
    claimDailyQuest(questId);
    addXp(xpReward);
  }

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <LinearGradient
            colors={[Colors.primary + "30", Colors.background]}
            style={styles.headerGradient}
          >
            <View style={styles.rankBadge}>
              <Text style={[styles.rankLetter, { color: rank.color }]}>{rank.rank}</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.rankTitle}>{rank.title}</Text>
              <Text style={styles.levelText}>LV. {level}</Text>

              <View style={styles.xpBarContainer}>
                <View style={styles.xpBarBg}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.xpBarFill, { width: `${xpProgress * 100}%` }]}
                  />
                </View>
                <Text style={styles.xpBarText}>
                  {xpIntoCurrentLevel} / {xpForNextLevel - (level - 1) * (level - 1) * 25} XP
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Ionicons name="flame" size={20} color={Colors.warning} />
            <Text style={styles.quickStatValue}>{currentStreak}</Text>
            <Text style={styles.quickStatLabel}>Streak</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="flash" size={20} color={Colors.accent} />
            <Text style={styles.quickStatValue}>{totalPower}</Text>
            <Text style={styles.quickStatLabel}>Power</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="trophy" size={20} color={Colors.xpGold} />
            <Text style={styles.quickStatValue}>{completedLessons.length + completedChallenges.length}</Text>
            <Text style={styles.quickStatLabel}>Clears</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="star" size={20} color={Colors.primary} />
            <Text style={styles.quickStatValue}>{xp}</Text>
            <Text style={styles.quickStatLabel}>XP</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Hunter Stats</Text>
          </View>
          <View style={styles.statsCard}>
            {Object.entries(stats).map(([key, val]) => (
              <StatBar key={key} type={key} value={val} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="today" size={18} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Daily Quests</Text>
          </View>
          {quests.map((quest) => (
            <DailyQuestCard
              key={quest.id}
              quest={quest}
              progress={getQuestProgress(quest)}
              claimed={dailyProgress.questsClaimed.includes(quest.id)}
              onClaim={() => handleClaimQuest(quest.id, quest.xpReward)}
            />
          ))}
        </Animated.View>

        {nextRank && (
          <Animated.View entering={FadeInDown.duration(600).delay(400)}>
            <View style={styles.nextRankCard}>
              <Text style={styles.nextRankLabel}>Next Rank</Text>
              <View style={styles.nextRankRow}>
                <Text style={[styles.nextRankName, { color: nextRank.color }]}>
                  {nextRank.title}
                </Text>
                <Text style={styles.nextRankReq}>LV. {nextRank.minLevel}</Text>
              </View>
              <View style={styles.nextRankBar}>
                <View
                  style={[
                    styles.nextRankFill,
                    {
                      width: `${Math.min(level / nextRank.minLevel, 1) * 100}%`,
                      backgroundColor: nextRank.color,
                    },
                  ]}
                />
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },

  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary + "40",
  },
  rankBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.primary + "80",
  },
  rankLetter: { fontSize: 32, fontWeight: "900" },
  headerInfo: { flex: 1, marginLeft: 16 },
  rankTitle: { color: Colors.text, fontSize: 18, fontWeight: "700" },
  levelText: { color: Colors.primaryGlow, fontSize: 14, fontWeight: "600", marginTop: 2 },
  xpBarContainer: { marginTop: 10 },
  xpBarBg: { height: 8, backgroundColor: Colors.surface, borderRadius: 4, overflow: "hidden" },
  xpBarFill: { height: "100%", borderRadius: 4 },
  xpBarText: { color: Colors.textSecondary, fontSize: 11, marginTop: 4 },

  quickStats: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickStatItem: { flex: 1, alignItems: "center" },
  quickStatValue: { color: Colors.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  quickStatLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  quickStatDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },

  statsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statLabel: { fontSize: 13, fontWeight: "700", width: 36, marginLeft: 8 },
  statBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  statBarFill: { height: "100%", borderRadius: 4 },
  statValue: { fontSize: 14, fontWeight: "700", width: 30, textAlign: "right" },

  questCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  questDone: { borderColor: Colors.success + "40" },
  questLeft: { marginRight: 12 },
  questContent: { flex: 1 },
  questTitle: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  questTitleDone: { textDecorationLine: "line-through", color: Colors.textMuted },
  questDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  questProgressRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  questBarBg: { flex: 1, height: 4, backgroundColor: Colors.background, borderRadius: 2, overflow: "hidden" },
  questBarFill: { height: "100%", backgroundColor: Colors.accent, borderRadius: 2 },
  questProgressText: { color: Colors.textMuted, fontSize: 11 },
  questRight: { marginLeft: 8 },
  claimBtn: {
    backgroundColor: Colors.xpGold,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  claimText: { color: Colors.background, fontSize: 12, fontWeight: "700" },
  xpBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  xpText: { color: Colors.xpGold, fontSize: 12, fontWeight: "600" },

  nextRankCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextRankLabel: { color: Colors.textSecondary, fontSize: 12, fontWeight: "600" },
  nextRankRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  nextRankName: { fontSize: 18, fontWeight: "700" },
  nextRankReq: { color: Colors.textMuted, fontSize: 13 },
  nextRankBar: {
    height: 6,
    backgroundColor: Colors.background,
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 10,
  },
  nextRankFill: { height: "100%", borderRadius: 3 },
});
