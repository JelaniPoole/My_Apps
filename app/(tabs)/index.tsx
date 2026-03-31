import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import {
  getAchievements,
  getAdaptiveDailyQuests,
  getRecommendedChallenges,
  getRecommendedLessons,
  getNextChallengeRecommendation,
  getNextLessonRecommendation,
} from "@/lib/linux-data";

const STAT_META: Record<string, { label: string; icon: string; color: string }> = {
  STR: { label: "STR", icon: "fitness", color: Colors.statSTR || "#FF6B35" },
  INT: { label: "INT", icon: "bulb", color: Colors.statINT || "#4DA6FF" },
  AGI: { label: "AGI", icon: "flash", color: Colors.statAGI || "#39FF14" },
  VIT: { label: "VIT", icon: "heart", color: Colors.statVIT || "#FF2D55" },
  DEF: { label: "DEF", icon: "shield", color: Colors.statDEF || "#808080" },
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
    terminalHistory,
    dailyProgress,
    addXp,
    claimDailyQuest,
    isLoaded,
  } = useProgress();

  const today = new Date().toDateString();
  const quests = getAdaptiveDailyQuests(today, {
    completedLessons,
    completedChallenges,
    terminalHistory,
    currentStreak,
  });
  const nextLesson = getNextLessonRecommendation(completedLessons);
  const nextRaid = getNextChallengeRecommendation(completedChallenges);
  const upcomingLessons = getRecommendedLessons(completedLessons, 2);
  const upcomingRaids = getRecommendedChallenges(completedChallenges, 2);
  const achievements = getAchievements({
    completedLessons,
    completedChallenges,
    currentStreak,
    terminalHistory,
  });
  const unlockedAchievements = achievements.filter((achievement) => achievement.unlocked);
  const nextAchievement = achievements.find((achievement) => !achievement.unlocked) ?? null;

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

  const playerStats: Record<string, number> = stats;
  const displayLevel = level;
  const displayXp = xp;
  const displayRank = rank.rank;
  const displayName = "Hunter";
  const focusLesson = upcomingLessons[0] ?? null;
  const followupLesson = upcomingLessons[1] ?? null;
  const focusRaid = upcomingRaids[0] ?? null;
  const followupRaid = upcomingRaids[1] ?? null;

  if (!isLoaded) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Ionicons name="hourglass" size={32} color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 12, fontSize: 16 }}>Loading Hunter Data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(600)}>
          <LinearGradient
            colors={[Colors.primary + "30", Colors.background]}
            style={styles.headerGradient}
          >
            <View style={styles.rankBadge}>
              <Text style={[styles.rankLetter, { color: rank.color }]}>{displayRank}</Text>
            </View>

            <View style={styles.headerInfo}>
              <Text style={styles.rankTitle}>{displayName}</Text>
              <Text style={styles.levelText}>LV. {displayLevel}</Text>

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
                  {displayXp} XP
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
            <Text style={styles.quickStatValue}>{displayXp}</Text>
            <Text style={styles.quickStatLabel}>XP</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="stats-chart" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Hunter Stats</Text>
          </View>
          <View style={styles.statsCard}>
            {Object.entries(playerStats).map(([key, val]) => (
              <StatBar key={key} type={key} value={val} />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(300)}>
          {nextLesson || nextRaid ? (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="compass" size={18} color={Colors.accent} />
                <Text style={styles.sectionTitle}>Recommended Next</Text>
              </View>
              <View style={styles.activePathColumn}>
                {nextLesson ? (
                  <Pressable onPress={() => router.push(`/lesson/${nextLesson.id}`)} style={({ pressed }) => [styles.recommendCard, pressed && styles.pressed]}>
                    <LinearGradient colors={[Colors.accent + "18", Colors.surface]} style={styles.recommendGradient}>
                      <View style={styles.recommendTop}>
                        <View style={styles.recommendIcon}>
                          <Ionicons name={nextLesson.icon as any} size={22} color={Colors.accent} />
                        </View>
                        <View style={styles.recommendBody}>
                          <Text style={styles.recommendEyebrow}>Next Lesson · {nextLesson.category}</Text>
                          <Text style={styles.recommendTitle}>{nextLesson.title}</Text>
                          <Text style={styles.recommendDesc}>{nextLesson.description}</Text>
                          <Text style={styles.recommendReason}>
                            Best next move: builds your {nextLesson.statReward.type} path before harder fights.
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recommendFooter}>
                        <Text style={styles.recommendMeta}>{nextLesson.steps.length} steps</Text>
                        <Text style={styles.recommendMeta}>+{nextLesson.xpReward} XP</Text>
                        <Text style={styles.recommendAction}>Start Lesson</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ) : null}
                {nextRaid ? (
                  <Pressable onPress={() => router.push("/challenges")} style={({ pressed }) => [styles.recommendCard, pressed && styles.pressed]}>
                    <LinearGradient colors={[Colors.warning + "18", Colors.surface]} style={styles.recommendGradient}>
                      <View style={styles.recommendTop}>
                        <View style={[styles.recommendIcon, { borderColor: Colors.warning + "30" }]}>
                          <Ionicons name={nextRaid.icon as any} size={22} color={Colors.warning} />
                        </View>
                        <View style={styles.recommendBody}>
                          <Text style={[styles.recommendEyebrow, { color: Colors.warning }]}>
                            Next Raid · Rank {nextRaid.difficulty}
                          </Text>
                          <Text style={styles.recommendTitle}>{nextRaid.title}</Text>
                          <Text style={styles.recommendDesc}>{nextRaid.task}</Text>
                          <Text style={styles.recommendReason}>
                            Raid focus: a good boss check for your current rank and command depth.
                          </Text>
                        </View>
                      </View>
                      <View style={styles.recommendFooter}>
                        <Text style={styles.recommendMeta}>Boss fight</Text>
                        <Text style={styles.recommendMeta}>+{nextRaid.xpReward} XP</Text>
                        <Text style={[styles.recommendAction, { color: Colors.warning }]}>Open Raids</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.pathPlanCard}>
                <View style={styles.pathPlanHeader}>
                  <Ionicons name="navigate" size={16} color={Colors.primary} />
                  <Text style={styles.pathPlanTitle}>Path Focus</Text>
                </View>
                <Text style={styles.pathPlanText}>
                  {focusLesson
                    ? `Start with ${focusLesson.title} to keep your lesson path moving.`
                    : "Your lesson path is clear right now."}{" "}
                  {focusRaid
                    ? `Then challenge ${focusRaid.title} when you want a boss check.`
                    : "All current raids are cleared."}
                </Text>
                {(followupLesson || followupRaid) ? (
                  <View style={styles.pathPlanNextRow}>
                    {followupLesson ? (
                      <View style={styles.pathPlanPill}>
                        <Text style={styles.pathPlanPillText}>After that: {followupLesson.title}</Text>
                      </View>
                    ) : null}
                    {followupRaid ? (
                      <View style={styles.pathPlanPill}>
                        <Text style={styles.pathPlanPillText}>Upcoming raid: {followupRaid.title}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </>
          ) : null}

          <View style={styles.sectionHeader}>
            <Ionicons name="ribbon" size={18} color={Colors.xpGold} />
            <Text style={styles.sectionTitle}>Achievement Track</Text>
          </View>
          <View style={styles.achievementSummaryCard}>
            <View style={styles.achievementSummaryTop}>
              <View>
                <Text style={styles.achievementSummaryValue}>
                  {unlockedAchievements.length}/{achievements.length}
                </Text>
                <Text style={styles.achievementSummaryLabel}>Achievements Unlocked</Text>
              </View>
              <Ionicons name="trophy" size={22} color={Colors.xpGold} />
            </View>
            {nextAchievement ? (
              <>
                <Text style={styles.achievementNextTitle}>{nextAchievement.title}</Text>
                <Text style={styles.achievementNextDesc}>{nextAchievement.description}</Text>
                <View style={styles.questProgressRow}>
                  <View style={styles.questBarBg}>
                    <View
                      style={[
                        styles.questBarFill,
                        {
                          width: `${(nextAchievement.progress / nextAchievement.target) * 100}%`,
                          backgroundColor: nextAchievement.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.questProgressText}>
                    {nextAchievement.progress}/{nextAchievement.target}
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.achievementNextDesc}>
                You have cleared every current achievement target. Time to add more.
              </Text>
            )}
          </View>

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
  pressed: { opacity: 0.88 },

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
  activePathColumn: {
    gap: 10,
  },
  recommendCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  recommendGradient: {
    padding: 16,
  },
  recommendTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  recommendIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  recommendBody: {
    flex: 1,
    marginLeft: 12,
  },
  recommendEyebrow: {
    color: Colors.accent,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  recommendTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  recommendDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },
  recommendReason: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  recommendFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    gap: 12,
  },
  recommendMeta: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  recommendAction: {
    marginLeft: "auto",
    color: Colors.accent,
    fontSize: 13,
    fontWeight: "700",
  },
  pathPlanCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pathPlanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pathPlanTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  pathPlanText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
  pathPlanNextRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pathPlanPill: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pathPlanPillText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

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

  achievementSummaryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  achievementSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  achievementSummaryValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  achievementSummaryLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  achievementNextTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
  },
  achievementNextDesc: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

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
  questProgressRow: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
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

