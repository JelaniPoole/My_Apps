import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import {
  getAchievements,
  getAdaptiveDailyQuests,
  getCompletedTrackMasteries,
  getRecommendedChallenges,
  getRecommendedLessons,
  getRoadmapProgress,
  getSystemMessages,
  getNextChallengeRecommendation,
  getNextLessonRecommendation,
  getNextWorldZone,
  getWorldZones,
  RANKS,
} from "@/lib/linux-data";

const STAT_META: Record<string, { label: string; icon: string; color: string }> = {
  STR: { label: "STR", icon: "fitness", color: Colors.statSTR || "#FF6B35" },
  INT: { label: "INT", icon: "bulb", color: Colors.statINT || "#4DA6FF" },
  AGI: { label: "AGI", icon: "flash", color: Colors.statAGI || "#39FF14" },
  VIT: { label: "VIT", icon: "heart", color: Colors.statVIT || "#FF2D55" },
  DEF: { label: "DEF", icon: "shield", color: Colors.statDEF || "#808080" },
};

function getRankCeremony(rankLetter?: string) {
  switch (rankLetter) {
    case "D":
      return {
        colors: [Colors.rankD + "45", Colors.surface] as const,
        glow: Colors.rankD,
        icon: "water",
        iconColor: Colors.rankD,
        systemLine: "The System senses your awakening.",
        body: "You have stepped beyond novice territory. Faster growth and stronger hunts now answer your call.",
        shadowOpacity: 0.16,
        scanOpacity: 0.26,
        mode: "awaken" as const,
      };
    case "C":
      return {
        colors: [Colors.rankC + "45", Colors.surface] as const,
        glow: Colors.rankC,
        icon: "flash",
        iconColor: Colors.rankC,
        systemLine: "A higher gate has opened.",
        body: "Your presence now carries real pressure. Raids ahead will expect cleaner execution and sharper instincts.",
        shadowOpacity: 0.2,
        scanOpacity: 0.3,
        mode: "surge" as const,
      };
    case "B":
      return {
        colors: [Colors.rankB + "45", Colors.surface] as const,
        glow: Colors.rankB,
        icon: "flame",
        iconColor: Colors.rankB,
        systemLine: "Your hunter aura intensifies.",
        body: "This promotion marks a dangerous leap. The System is beginning to treat you like a real threat.",
        shadowOpacity: 0.24,
        scanOpacity: 0.34,
        mode: "flare" as const,
      };
    case "A":
      return {
        colors: [Colors.rankA + "45", Colors.surface] as const,
        glow: Colors.rankA,
        icon: "planet",
        iconColor: Colors.rankA,
        systemLine: "Emergency authority granted.",
        body: "Only elite hunters reach this level. Your victories now reshape the battlefield itself.",
        shadowOpacity: 0.28,
        scanOpacity: 0.38,
        mode: "monarch" as const,
      };
    case "S":
      return {
        colors: ["#FF2D55AA", Colors.surface] as const,
        glow: "#FF2D55",
        icon: "diamond",
        iconColor: "#FF2D55",
        systemLine: "The System acknowledges a monster.",
        body: "This is no ordinary promotion. You have entered the realm of overwhelming force and rare command mastery.",
        shadowOpacity: 0.34,
        scanOpacity: 0.42,
        mode: "eclipse" as const,
      };
    default:
      return {
        colors: [Colors.xpGold + "40", Colors.surface] as const,
        glow: Colors.xpGold,
        icon: "sparkles",
        iconColor: Colors.xpGold,
        systemLine: "The System has recognized your growth.",
        body: "Emergency-grade content and stronger rewards now feel closer than ever.",
        shadowOpacity: 0.14,
        scanOpacity: 0.24,
        mode: "system" as const,
      };
  }
}

function getFrameColor(frameId: string, fallback: string) {
  switch (frameId) {
    case "neon":
      return "#64D2FF";
    case "ember":
      return "#FF8A5B";
    default:
      return fallback;
  }
}

function PromotionAura({
  color,
  shadowOpacity,
  scanOpacity,
  mode,
}: {
  color: string;
  shadowOpacity: number;
  scanOpacity: number;
  mode: "system" | "awaken" | "surge" | "flare" | "monarch" | "eclipse";
}) {
  const pulse = useSharedValue(0.92);
  const ringOpacity = useSharedValue(0.18);
  const scanProgress = useSharedValue(0);

  React.useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800, easing: Easing.out(Easing.quad) }),
        withTiming(0.94, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.34, { duration: 1600, easing: Easing.out(Easing.quad) }),
        withTiming(0.12, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    scanProgress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [pulse, ringOpacity, scanProgress]);

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: ringOpacity.value * shadowOpacity * 3.2,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value + 0.08 }],
    opacity: ringOpacity.value,
  }));

  const ringSecondaryStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value + 0.18 }],
    opacity: ringOpacity.value * 0.7,
  }));

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -140 + scanProgress.value * 280 }],
    opacity: scanOpacity,
  }));

  const inverseScanStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 120 - scanProgress.value * 240 }],
    opacity: scanOpacity * 0.75,
  }));

  const flareLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -24 - pulse.value * 10 }, { scaleX: pulse.value }],
    opacity: ringOpacity.value * 0.9,
  }));

  const flareRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: 24 + pulse.value * 10 }, { scaleX: pulse.value }],
    opacity: ringOpacity.value * 0.9,
  }));

  const pillarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: pulse.value + 0.06 }],
    opacity: ringOpacity.value * 0.95,
  }));

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value * 0.88 }],
    opacity: ringOpacity.value * 1.1,
  }));

  return (
    <View pointerEvents="none" style={styles.promotionAuraWrap}>
      <Animated.View
        style={[
          styles.promotionShadow,
          { backgroundColor: color },
          shadowStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.promotionRing,
          { borderColor: color },
          ringStyle,
        ]}
      />
      {(mode === "surge" || mode === "monarch" || mode === "eclipse") ? (
        <Animated.View
          style={[
            styles.promotionRingSecondary,
            { borderColor: color },
            ringSecondaryStyle,
          ]}
        />
      ) : null}
      {(mode === "flare" || mode === "eclipse") ? (
        <>
          <Animated.View
            style={[
              styles.promotionFlareLeft,
              { backgroundColor: color },
              flareLeftStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.promotionFlareRight,
              { backgroundColor: color },
              flareRightStyle,
            ]}
          />
        </>
      ) : null}
      {(mode === "monarch" || mode === "eclipse") ? (
        <>
          <Animated.View
            style={[
              styles.promotionPillarLeft,
              { backgroundColor: color },
              pillarStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.promotionPillarRight,
              { backgroundColor: color },
              pillarStyle,
            ]}
          />
        </>
      ) : null}
      {mode === "eclipse" ? (
        <Animated.View
          style={[
            styles.promotionCore,
            { backgroundColor: color },
            coreStyle,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          styles.promotionScanLine,
          { backgroundColor: color },
          scanStyle,
        ]}
      />
      {(mode === "surge" || mode === "eclipse") ? (
        <Animated.View
          style={[
            styles.promotionScanLineSecondary,
            { backgroundColor: color },
            inverseScanStyle,
          ]}
        />
      ) : null}
    </View>
  );
}

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
  const [previewRankIndex, setPreviewRankIndex] = useState<number | null>(null);
  const [questRewardNotice, setQuestRewardNotice] = useState<{
    title: string;
    body: string;
  } | null>(null);
  const [achievementNotice, setAchievementNotice] = useState<{
    title: string;
    body: string;
    color: string;
    icon: string;
  } | null>(null);
  const unlockedAchievementIdsRef = React.useRef<string[]>([]);
  const {
    xp,
    stats,
    level,
    xpProgress,
    xpForNextLevel,
    xpIntoCurrentLevel,
    rank,
    nextRank,
    essenceShards,
    hunterName,
    activeFrame,
    title,
    currentStreak,
    totalPower,
    completedLessons,
    completedChallenges,
    terminalHistory,
    dailyProgress,
    addXp,
    claimDailyQuest,
    pendingRankUp,
    pendingTrackMastery,
    dismissRankUp,
    dismissTrackMastery,
    isLoaded,
  } = useProgress();

  const today = new Date().toDateString();
  const quests = useMemo(
    () =>
      getAdaptiveDailyQuests(today, {
        completedLessons,
        completedChallenges,
        terminalHistory,
        currentStreak,
      }),
    [today, completedLessons, completedChallenges, terminalHistory, currentStreak],
  );
  const nextLesson = getNextLessonRecommendation(completedLessons);
  const nextRaid = getNextChallengeRecommendation(completedChallenges);
  const upcomingLessons = getRecommendedLessons(completedLessons, 2);
  const upcomingRaids = getRecommendedChallenges(completedChallenges, 2);
  const achievements = useMemo(
    () =>
      getAchievements({
        completedLessons,
        completedChallenges,
        currentStreak,
        terminalHistory,
      }),
    [completedLessons, completedChallenges, currentStreak, terminalHistory],
  );
  const unlockedAchievements = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked),
    [achievements],
  );
  const nextAchievement = useMemo(
    () => achievements.find((achievement) => !achievement.unlocked) ?? null,
    [achievements],
  );
  const previewRankUp = useMemo(() => {
    if (previewRankIndex === null) return null;
    const to = RANKS[previewRankIndex];
    const from = RANKS[Math.max(previewRankIndex - 1, 0)];
    return { from, to };
  }, [previewRankIndex]);
  const systemMessages = useMemo(
    () =>
      getSystemMessages({
        level,
        currentStreak,
        essenceShards,
        completedLessons,
        completedChallenges,
        terminalHistory,
      }),
    [
      level,
      currentStreak,
      essenceShards,
      completedLessons,
      completedChallenges,
      terminalHistory,
    ],
  );
  const trackProgress = useMemo(
    () => getRoadmapProgress(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );
  const completedTrackMasteries = useMemo(
    () => getCompletedTrackMasteries(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );
  const worldZones = useMemo(
    () => getWorldZones(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );
  const nextWorldZone = useMemo(
    () => getNextWorldZone(completedLessons, completedChallenges),
    [completedLessons, completedChallenges],
  );

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
    setQuestRewardNotice({
      title: "Daily mission complete",
      body: `Rewards secured: +${xpReward} XP and +${questShardReward} shards.`,
    });
  }

  const webTop = Platform.OS === "web" ? 67 : 0;

  const playerStats: Record<string, number> = stats;
  const displayLevel = level;
  const displayXp = xp;
  const displayRank = rank.rank;
  const displayName = hunterName;
  const displayedShards = essenceShards ?? 0;
  const questShardReward = 5;
  const focusLesson = upcomingLessons[0] ?? null;
  const followupLesson = upcomingLessons[1] ?? null;
  const focusRaid = upcomingRaids[0] ?? null;
  const followupRaid = upcomingRaids[1] ?? null;
  const xpToNextPromotion = nextRank
    ? Math.max(0, xpForNextLevel - xpIntoCurrentLevel)
    : 0;
  const activePromotion = previewRankUp ?? pendingRankUp;
  const rankCeremony = getRankCeremony(activePromotion?.to.rank);

  React.useEffect(() => {
    if (!questRewardNotice) return;
    const timeout = setTimeout(() => setQuestRewardNotice(null), 3200);
    return () => clearTimeout(timeout);
  }, [questRewardNotice]);

  React.useEffect(() => {
    if (!achievementNotice) return;
    const timeout = setTimeout(() => setAchievementNotice(null), 4200);
    return () => clearTimeout(timeout);
  }, [achievementNotice]);

  React.useEffect(() => {
    if (!isLoaded) return;

    const unlockedIds = unlockedAchievements.map((achievement) => achievement.id);
    const previousUnlockedIds = unlockedAchievementIdsRef.current;

    if (previousUnlockedIds.length > 0) {
      const newlyUnlocked = unlockedAchievements.find(
        (achievement) => !previousUnlockedIds.includes(achievement.id),
      );

      if (newlyUnlocked) {
        setAchievementNotice({
          title: "Achievement Unlocked",
          body: `${newlyUnlocked.title} secured. ${newlyUnlocked.description}`,
          color: newlyUnlocked.color,
          icon: newlyUnlocked.icon,
        });
      }
    }

    unlockedAchievementIdsRef.current = unlockedIds;
  }, [isLoaded, unlockedAchievements]);

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
          <Pressable
            onPress={() => router.push("/profile")}
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <LinearGradient
              colors={[Colors.primary + "30", Colors.background]}
              style={styles.headerGradient}
            >
              <View
                style={[
                  styles.rankBadge,
                  {
                    borderColor: getFrameColor(activeFrame, Colors.primary + "80"),
                    shadowColor: getFrameColor(activeFrame, rank.color),
                    shadowOpacity: 0.18,
                    shadowRadius: 12,
                  },
                ]}
              >
                <Text style={[styles.rankLetter, { color: getFrameColor(activeFrame, rank.color) }]}>{displayRank}</Text>
              </View>

              <View style={styles.headerInfo}>
                <Text style={styles.rankTitle}>{displayName}</Text>
                <Text style={styles.levelText}>{title} · {rank.title} · LV. {displayLevel}</Text>

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

                <View style={styles.profileTapRow}>
                  <Text style={styles.profileTapText}>Tap profile to view loadout</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                </View>
              </View>
            </LinearGradient>
          </Pressable>
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
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Ionicons name="diamond" size={20} color={Colors.xpGold} />
            <Text style={styles.quickStatValue}>{displayedShards}</Text>
            <Text style={styles.quickStatLabel}>Shards</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600).delay(200)}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={18} color={Colors.xpGold} />
            <Text style={styles.sectionTitle}>The System</Text>
          </View>
          <View style={styles.systemCard}>
            {systemMessages.map((message) => (
              <View key={message.id} style={styles.systemMessageRow}>
                <View
                  style={[
                    styles.systemIcon,
                    message.tone === "warning"
                      ? styles.systemIconWarning
                      : message.tone === "success"
                      ? styles.systemIconSuccess
                      : styles.systemIconPrimary,
                  ]}
                >
                  <Ionicons
                    name={message.icon as any}
                    size={16}
                    color={
                      message.tone === "warning"
                        ? Colors.xpGold
                        : message.tone === "success"
                        ? Colors.success
                        : Colors.primary
                    }
                  />
                </View>
                <View style={styles.systemCopy}>
                  <Text style={styles.systemTitle}>{message.title}</Text>
                  <Text style={styles.systemBody}>{message.body}</Text>
                </View>
              </View>
            ))}
            <Pressable
              onPress={() => setPreviewRankIndex(1)}
              style={({ pressed }) => [styles.systemTestButton, pressed && styles.pressed]}
            >
              <Ionicons name="flask" size={16} color={Colors.xpGold} />
              <Text style={styles.systemTestButtonText}>Preview Rank Promotions</Text>
            </Pressable>
          </View>

          {questRewardNotice ? (
            <Animated.View entering={FadeInDown.duration(260)} style={styles.rewardNoticeCard}>
              <View style={[styles.rewardNoticeIcon, styles.rewardNoticeQuestIcon]}>
                <Ionicons name="checkmark-done-circle" size={18} color={Colors.success} />
              </View>
              <View style={styles.rewardNoticeCopy}>
                <Text style={styles.rewardNoticeTitle}>{questRewardNotice.title}</Text>
                <Text style={styles.rewardNoticeBody}>{questRewardNotice.body}</Text>
              </View>
            </Animated.View>
          ) : null}

          {achievementNotice ? (
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={[styles.rewardNoticeCard, styles.achievementNoticeCard]}
            >
              <View
                style={[
                  styles.rewardNoticeIcon,
                  { backgroundColor: achievementNotice.color + "20" },
                ]}
              >
                <Ionicons
                  name={achievementNotice.icon as any}
                  size={18}
                  color={achievementNotice.color}
                />
              </View>
              <View style={styles.rewardNoticeCopy}>
                <Text style={styles.rewardNoticeTitle}>{achievementNotice.title}</Text>
                <Text style={styles.rewardNoticeBody}>{achievementNotice.body}</Text>
              </View>
            </Animated.View>
          ) : null}

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
            <Ionicons name="map" size={18} color={Colors.primary} />
            <Text style={styles.sectionTitle}>World Map</Text>
            <Pressable
              onPress={() => router.push("/world")}
              style={({ pressed }) => [styles.sectionLink, pressed && styles.pressed]}
            >
              <Text style={[styles.sectionLinkText, { color: Colors.primary }]}>Open World</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push("/world")}
            style={({ pressed }) => [styles.worldCard, pressed && styles.pressed]}
          >
            <LinearGradient colors={[Colors.primary + "16", Colors.surface]} style={styles.worldGradient}>
              <View style={styles.worldTop}>
                <View style={styles.worldIconWrap}>
                  <Ionicons name="navigate" size={20} color={Colors.primary} />
                </View>
                <View style={styles.worldCopy}>
                  <Text style={styles.worldEyebrow}>Next Zone</Text>
                  <Text style={styles.worldTitle}>{nextWorldZone?.zoneName ?? "World Clear"}</Text>
                  <Text style={styles.worldText}>
                    {nextWorldZone?.state === "locked"
                      ? nextWorldZone.unlockRequirement
                      : nextWorldZone?.recommendedLesson
                      ? `Resume ${nextWorldZone.recommendedLesson.title} to keep this zone moving.`
                      : nextWorldZone?.recommendedChallenge
                      ? `The next boss check here is ${nextWorldZone.recommendedChallenge.title}.`
                      : "Every visible zone is already cleared."}
                  </Text>
                </View>
              </View>
              <View style={styles.worldFooter}>
                <Text style={styles.worldMeta}>
                  {worldZones.filter((zone) => zone.state !== "locked").length}/{worldZones.length} zones open
                </Text>
                <Text style={styles.worldMeta}>
                  {worldZones.filter((zone) => zone.state === "mastered").length} cleared
                </Text>
                <Text style={styles.worldAction}>Enter Map</Text>
              </View>
            </LinearGradient>
          </Pressable>

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
            <Ionicons name="school" size={18} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Track Mastery</Text>
          </View>
          <View style={styles.masteryCard}>
            <View style={styles.masteryTopRow}>
              <View>
                <Text style={styles.masteryValue}>
                  {completedTrackMasteries.length}/{Object.keys(trackProgress).length}
                </Text>
                <Text style={styles.masteryLabel}>Tracks Cleared</Text>
              </View>
              <Ionicons name="layers" size={22} color={Colors.accent} />
            </View>
            <Text style={styles.masteryText}>
              Clear whole learning tracks to earn milestone shard rewards and prove command mastery in each domain.
            </Text>
            <View style={styles.masteryPreviewList}>
              {Object.entries(trackProgress)
                .filter(([, progress]) => progress.total > 0)
                .slice(0, 3)
                .map(([name, progress]) => (
                  <View key={name} style={styles.masteryPreviewRow}>
                    <View style={styles.masteryPreviewTop}>
                      <Text style={styles.masteryPreviewName}>{name}</Text>
                      <Text style={styles.masteryPreviewValue}>
                        {progress.completed}/{progress.total}
                      </Text>
                    </View>
                    <View style={styles.masteryPreviewBarBg}>
                      <View
                        style={[
                          styles.masteryPreviewBarFill,
                          {
                            width: `${progress.pct * 100}%`,
                            backgroundColor:
                              progress.pct === 1 ? Colors.success : Colors.accent,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
            </View>
            <View style={styles.masteryPillRow}>
              {completedTrackMasteries.length > 0 ? (
                completedTrackMasteries.slice(0, 4).map((track) => (
                  <View key={track.name} style={styles.masteryPill}>
                    <Text style={styles.masteryPillText}>{track.name}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.masteryPillMuted}>
                  <Text style={styles.masteryPillMutedText}>No mastered tracks yet</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="today" size={18} color={Colors.warning} />
            <Text style={styles.sectionTitle}>Daily Quests</Text>
            <Pressable
              onPress={() => router.push("/quests")}
              style={({ pressed }) => [styles.sectionLink, pressed && styles.pressed]}
            >
              <Text style={styles.sectionLinkText}>Open Board</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.warning} />
            </Pressable>
          </View>
          <View style={styles.questOverviewCard}>
            <View style={styles.questOverviewTop}>
              <Text style={styles.questOverviewTitle}>Mission Board Status</Text>
              <Text style={styles.questOverviewValue}>
                {
                  quests.filter(
                    (quest) => getQuestProgress(quest) >= quest.target,
                  ).length
                }
                /{quests.length}
              </Text>
            </View>
            <View style={styles.questOverviewBarBg}>
              <View
                style={[
                  styles.questOverviewBarFill,
                  {
                    width: `${
                      (quests.filter(
                        (quest) => getQuestProgress(quest) >= quest.target,
                      ).length /
                        Math.max(quests.length, 1)) *
                      100
                    }%`,
                  },
                ]}
              />
            </View>
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
              <View style={styles.nextRankMetaRow}>
                <Text style={styles.nextRankMetaText}>
                  XP to next promotion: {xpToNextPromotion}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal visible={!!activePromotion} transparent animationType="fade">
        <View style={styles.rankUpOverlay}>
          <Animated.View
            key={`rank-promo-${activePromotion?.to.rank ?? "none"}-${previewRankIndex ?? "live"}`}
            entering={FadeInDown.duration(420)}
            style={styles.rankUpCard}
          >
            <LinearGradient
              colors={rankCeremony.colors}
              style={styles.rankUpGradient}
            >
              <PromotionAura
                color={rankCeremony.iconColor}
                shadowOpacity={rankCeremony.shadowOpacity}
                scanOpacity={rankCeremony.scanOpacity}
                mode={rankCeremony.mode}
              />
              <View style={[styles.rankUpAccentBar, { backgroundColor: rankCeremony.iconColor }]} />
              <View style={[styles.rankUpHalo, { backgroundColor: rankCeremony.glow }]} />
              <Ionicons name={rankCeremony.icon as any} size={54} color={rankCeremony.iconColor} />
              <Text style={[styles.rankUpSystemText, { color: rankCeremony.iconColor }]}>
                {rankCeremony.systemLine}
              </Text>
              <Text style={styles.rankUpTitle}>Rank Promotion</Text>
              <Text style={styles.rankUpFrom}>
                {activePromotion?.from.title} to{" "}
                <Text style={{ color: activePromotion?.to.color }}>
                  {activePromotion?.to.title}
                </Text>
              </Text>
              <View style={styles.rankUpBadgeRow}>
                <View style={[styles.rankUpBadge, { borderColor: activePromotion?.to.color ?? Colors.xpGold }]}>
                  <Text style={[styles.rankUpBadgeText, { color: activePromotion?.to.color ?? Colors.xpGold }]}>
                    {activePromotion?.to.rank}
                  </Text>
                </View>
              </View>
              <Text style={styles.rankUpBody}>{rankCeremony.body}</Text>
              {previewRankUp ? (
                <View style={styles.rankPreviewControls}>
                  <Pressable
                    style={[styles.rankPreviewButton, previewRankIndex === 1 && styles.rankPreviewButtonDisabled]}
                    onPress={() => setPreviewRankIndex((current) => (current && current > 1 ? current - 1 : current))}
                    disabled={previewRankIndex === 1}
                  >
                    <Text style={styles.rankPreviewButtonText}>Previous</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.rankPreviewButton, styles.rankPreviewButtonPrimary]}
                    onPress={() =>
                      setPreviewRankIndex((current) =>
                        current !== null && current < RANKS.length - 1 ? current + 1 : 1
                      )
                    }
                  >
                    <Text style={styles.rankPreviewButtonPrimaryText}>
                      {previewRankIndex === RANKS.length - 1 ? "Loop" : "Next"}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              <Pressable
                style={styles.rankUpButton}
                onPress={() => {
                  if (previewRankUp) {
                    setPreviewRankIndex(null);
                    return;
                  }
                  dismissRankUp();
                }}
              >
                <Text style={styles.rankUpButtonText}>
                  {previewRankUp ? "Close Preview" : "Accept Promotion"}
                </Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!pendingTrackMastery} transparent animationType="fade">
        <View style={styles.rankUpOverlay}>
          <Animated.View
            key={`track-mastery-${pendingTrackMastery?.name ?? "none"}`}
            entering={FadeInDown.duration(360)}
            style={styles.trackMasteryModal}
          >
            <LinearGradient
              colors={[Colors.accent + "28", Colors.surface]}
              style={styles.trackMasteryGradient}
            >
              <Ionicons name="school" size={48} color={Colors.accent} />
              <Text style={styles.trackMasteryEyebrow}>Track Mastered</Text>
              <Text style={styles.trackMasteryTitle}>{pendingTrackMastery?.name}</Text>
              <Text style={styles.trackMasteryBody}>
                The System recognizes full mastery of this discipline. Your hunter profile grows stronger with every completed domain.
              </Text>
              <View style={styles.trackMasteryRewardRow}>
                <View style={styles.trackMasteryRewardPill}>
                  <Text style={styles.trackMasteryRewardText}>
                    +{pendingTrackMastery?.shardsAwarded ?? 0} Shards
                  </Text>
                </View>
                <View style={styles.trackMasteryRewardPill}>
                  <Text
                    style={[
                      styles.trackMasteryRewardText,
                      { color: STAT_META[pendingTrackMastery?.statType ?? "INT"].color },
                    ]}
                  >
                    {pendingTrackMastery?.statType} path complete
                  </Text>
                </View>
                {pendingTrackMastery?.cosmeticReward ? (
                  <View
                    style={[
                      styles.trackMasteryRewardPill,
                      { borderColor: pendingTrackMastery.cosmeticReward.color + "55" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trackMasteryRewardText,
                        { color: pendingTrackMastery.cosmeticReward.color },
                      ]}
                    >
                      {pendingTrackMastery.cosmeticReward.label}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable style={styles.rankUpButton} onPress={dismissTrackMastery}>
                <Text style={styles.rankUpButtonText}>Claim Mastery</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
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
  profileTapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
  },
  profileTapText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

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
  sectionLink: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  sectionLinkText: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
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
  worldCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.primary + "28",
  },
  worldGradient: {
    padding: 16,
  },
  worldTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  worldIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.primary + "28",
    marginRight: 12,
  },
  worldCopy: { flex: 1 },
  worldEyebrow: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  worldTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 6,
  },
  worldText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  worldFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 14,
  },
  worldMeta: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  worldAction: {
    marginLeft: "auto",
    color: Colors.primary,
    fontSize: 13,
    fontWeight: "700",
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
  systemCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 14,
  },
  systemMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  systemIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  systemIconPrimary: { backgroundColor: Colors.primary + "18" },
  systemIconWarning: { backgroundColor: Colors.xpGold + "18" },
  systemIconSuccess: { backgroundColor: Colors.success + "18" },
  systemCopy: { flex: 1 },
  systemTitle: { color: Colors.text, fontSize: 14, fontWeight: "700" },
  systemBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  systemTestButton: {
    marginTop: 4,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  systemTestButtonText: {
    color: Colors.xpGold,
    fontSize: 12,
    fontWeight: "700",
  },
  rewardNoticeCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.success + "30",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  achievementNoticeCard: {
    borderColor: Colors.xpGold + "28",
  },
  rewardNoticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardNoticeQuestIcon: {
    backgroundColor: Colors.success + "14",
  },
  rewardNoticeCopy: {
    flex: 1,
  },
  rewardNoticeTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rewardNoticeBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  questOverviewCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  questOverviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  questOverviewTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "600",
  },
  questOverviewValue: {
    color: Colors.warning,
    fontSize: 12,
    fontWeight: "700",
  },
  questOverviewBarBg: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  questOverviewBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.warning,
  },

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
  masteryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  masteryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  masteryValue: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  masteryLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  masteryText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
  masteryPreviewList: {
    marginTop: 12,
    gap: 10,
  },
  masteryPreviewRow: {
    gap: 6,
  },
  masteryPreviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  masteryPreviewName: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  masteryPreviewValue: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  masteryPreviewBarBg: {
    height: 5,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  masteryPreviewBarFill: {
    height: "100%",
    borderRadius: 999,
  },
  masteryPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  masteryPill: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.accent + "24",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  masteryPillText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  masteryPillMuted: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  masteryPillMutedText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
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
  nextRankMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  nextRankMetaText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  rankUpOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  rankUpCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.xpGold + "40",
  },
  rankUpGradient: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  promotionAuraWrap: {
    position: "absolute",
    top: 28,
    width: 240,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  promotionShadow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    opacity: 0.18,
  },
  promotionRing: {
    position: "absolute",
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 1.5,
    opacity: 0.2,
  },
  promotionRingSecondary: {
    position: "absolute",
    width: 206,
    height: 206,
    borderRadius: 103,
    borderWidth: 1,
    opacity: 0.16,
  },
  promotionFlareLeft: {
    position: "absolute",
    width: 92,
    height: 2,
    left: 8,
    borderRadius: 999,
    opacity: 0.22,
  },
  promotionFlareRight: {
    position: "absolute",
    width: 92,
    height: 2,
    right: 8,
    borderRadius: 999,
    opacity: 0.22,
  },
  promotionPillarLeft: {
    position: "absolute",
    width: 16,
    height: 150,
    left: 44,
    borderRadius: 999,
    opacity: 0.16,
  },
  promotionPillarRight: {
    position: "absolute",
    width: 16,
    height: 150,
    right: 44,
    borderRadius: 999,
    opacity: 0.16,
  },
  promotionCore: {
    position: "absolute",
    width: 104,
    height: 104,
    borderRadius: 52,
    opacity: 0.12,
  },
  promotionScanLine: {
    position: "absolute",
    width: 220,
    height: 2,
    borderRadius: 999,
    opacity: 0.22,
  },
  promotionScanLineSecondary: {
    position: "absolute",
    width: 180,
    height: 1.5,
    borderRadius: 999,
    opacity: 0.16,
  },
  rankUpAccentBar: {
    position: "absolute",
    top: 0,
    left: 24,
    right: 24,
    height: 4,
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  rankUpHalo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -70,
    opacity: 0.28,
  },
  rankUpSystemText: {
    color: Colors.xpGold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 16,
  },
  rankUpTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },
  rankUpFrom: {
    color: Colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
  },
  rankUpBadgeRow: {
    marginTop: 18,
  },
  rankUpBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  rankUpBadgeText: {
    fontSize: 30,
    fontWeight: "900",
  },
  rankUpBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 18,
  },
  rankPreviewControls: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },
  rankPreviewButton: {
    minWidth: 110,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  rankPreviewButtonDisabled: {
    opacity: 0.45,
  },
  rankPreviewButtonPrimary: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary + "40",
  },
  rankPreviewButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  rankPreviewButtonPrimaryText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  rankUpButton: {
    marginTop: 24,
    backgroundColor: Colors.xpGold,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  rankUpButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
  trackMasteryModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.accent + "35",
  },
  trackMasteryGradient: {
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
  },
  trackMasteryEyebrow: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 14,
  },
  trackMasteryTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
    textAlign: "center",
  },
  trackMasteryBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 16,
  },
  trackMasteryRewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  trackMasteryRewardPill: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  trackMasteryRewardText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
});
