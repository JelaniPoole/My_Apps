import React, { useMemo, useState } from "react";
import {
  Modal,
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
import { getAdaptiveDailyQuests } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

const QUEST_SHARD_REWARD = 5;

function DailyQuestCard({
  quest,
  progress,
  claimed,
  onClaim,
}: {
  quest: {
    id: string;
    title: string;
    description: string;
    xpReward: number;
    target: number;
  };
  progress: number;
  claimed: boolean;
  onClaim: () => void;
}) {
  const done = progress >= quest.target;
  const progressPct = Math.min(progress / quest.target, 1);

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
        <View style={styles.questTitleRow}>
          <Text style={[styles.questTitle, done && styles.questTitleDone]}>
            {quest.title}
          </Text>
          {done && !claimed ? (
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Ready</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.questDesc}>{quest.description}</Text>
        <View style={styles.questProgressRow}>
          <View style={styles.questBarBg}>
            <View
              style={[
                styles.questBarFill,
                { width: `${progressPct * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.questProgressText}>
            {Math.min(progress, quest.target)}/{quest.target}
          </Text>
        </View>
        <View style={styles.questRewardRow}>
          <View style={styles.questRewardPill}>
            <Ionicons name="star" size={11} color={Colors.xpGold} />
            <Text style={styles.questRewardText}>+{quest.xpReward} XP</Text>
          </View>
          <View style={styles.questRewardPill}>
            <Ionicons name="diamond" size={11} color={Colors.xpGold} />
            <Text style={styles.questRewardText}>+{QUEST_SHARD_REWARD} shards</Text>
          </View>
        </View>
      </View>
      <View style={styles.questRight}>
        {done && !claimed ? (
          <Pressable style={styles.claimBtn} onPress={onClaim}>
            <Text style={styles.claimText}>Claim</Text>
          </Pressable>
        ) : (
          <View style={styles.rewardBadge}>
            <Ionicons
              name="star"
              size={10}
              color={claimed ? Colors.textMuted : Colors.xpGold}
            />
            <Text
              style={[
                styles.rewardBadgeText,
                claimed && { color: Colors.textMuted },
              ]}
            >
              {quest.xpReward}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function QuestsScreen() {
  const insets = useSafeAreaInsets();
  const [rewardNotice, setRewardNotice] = useState<{
    title: string;
    body: string;
    xpReward: number;
    shardReward: number;
  } | null>(null);
  const {
    completedLessons,
    completedChallenges,
    terminalHistory,
    currentStreak,
    dailyProgress,
    addXp,
    claimDailyQuest,
    essenceShards,
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
    [
      today,
      completedLessons,
      completedChallenges,
      terminalHistory,
      currentStreak,
    ],
  );
  const webTop = Platform.OS === "web" ? 67 : 0;
  const claimedCount = dailyProgress.questsClaimed.filter((id) =>
    quests.some((quest) => quest.id === id),
  ).length;
  const completedCount = quests.filter((quest) => {
    const progress = getQuestProgress(quest.type, dailyProgress);
    return progress >= quest.target;
  }).length;

  function handleClaimQuest(questId: string, xpReward: number) {
    claimDailyQuest(questId);
    addXp(xpReward);
    setRewardNotice({
      title: "Mission rewards claimed",
      body: `+${xpReward} XP and +${QUEST_SHARD_REWARD} shards added to your hunter profile.`,
      xpReward,
      shardReward: QUEST_SHARD_REWARD,
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + webTop + 8,
          paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 28,
        }}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Daily Missions</Text>
            <Text style={styles.subtitle}>
              Complete system-assigned objectives for XP and shards.
            </Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(350)} style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View>
              <Text style={styles.summaryValue}>{claimedCount}/{quests.length}</Text>
              <Text style={styles.summaryLabel}>Missions Claimed</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryShardValue}>{essenceShards}</Text>
              <Text style={styles.summaryShardLabel}>Current Shards</Text>
            </View>
          </View>
          <Text style={styles.summaryText}>
            {completedCount === quests.length
              ? "All current missions are complete. Claim the remaining rewards and keep the streak alive."
              : "Clear lessons, raids, or training goals to fill out today’s mission board."}
          </Text>
          <View style={styles.summaryProgressBlock}>
            <View style={styles.summaryProgressTop}>
              <Text style={styles.summaryProgressLabel}>Board progress</Text>
              <Text style={styles.summaryProgressValue}>{completedCount}/{quests.length}</Text>
            </View>
            <View style={styles.summaryProgressBarBg}>
              <View
                style={[
                  styles.summaryProgressBarFill,
                  { width: `${(completedCount / Math.max(quests.length, 1)) * 100}%` },
                ]}
              />
            </View>
          </View>
          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaPill}>
              <Ionicons name="sparkles" size={12} color={Colors.xpGold} />
              <Text style={styles.summaryMetaText}>+5 shards per mission</Text>
            </View>
            <View style={styles.summaryMetaPill}>
              <Ionicons name="flame" size={12} color={Colors.warning} />
              <Text style={styles.summaryMetaText}>Streak-friendly objectives</Text>
            </View>
          </View>
          <Pressable
            onPress={() =>
              setRewardNotice({
                title: "System mission complete",
                body: "Previewing the daily mission reward ceremony.",
                xpReward: 40,
                shardReward: QUEST_SHARD_REWARD,
              })
            }
            style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}
          >
            <Ionicons name="flask" size={16} color={Colors.xpGold} />
            <Text style={styles.previewButtonText}>Preview Reward Ceremony</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.sectionTitle}>Mission Board</Text>
        {quests.map((quest, index) => (
          <Animated.View
            key={quest.id}
            entering={FadeInDown.duration(320).delay(40 * index)}
          >
            <DailyQuestCard
              quest={quest}
              progress={getQuestProgress(quest.type, dailyProgress)}
              claimed={dailyProgress.questsClaimed.includes(quest.id)}
              onClaim={() => handleClaimQuest(quest.id, quest.xpReward)}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={!!rewardNotice} transparent animationType="fade">
        <View style={styles.rewardOverlay}>
          <Animated.View entering={FadeInDown.duration(320)} style={styles.rewardModal}>
            <View style={styles.rewardModalGlow} />
            <Ionicons name="sparkles" size={48} color={Colors.xpGold} />
            <Text style={styles.rewardModalEyebrow}>System Mission Complete</Text>
            <Text style={styles.rewardModalTitle}>{rewardNotice?.title}</Text>
            <Text style={styles.rewardModalBody}>{rewardNotice?.body}</Text>
            <View style={styles.rewardModalRow}>
              <View style={styles.rewardModalPill}>
                <Ionicons name="star" size={14} color={Colors.xpGold} />
                <Text style={styles.rewardModalPillText}>
                  +{rewardNotice?.xpReward ?? 0} XP
                </Text>
              </View>
              <View style={styles.rewardModalPill}>
                <Ionicons name="diamond" size={14} color={Colors.xpGold} />
                <Text style={styles.rewardModalPillText}>
                  +{rewardNotice?.shardReward ?? 0} shards
                </Text>
              </View>
            </View>
            <Pressable style={styles.rewardModalButton} onPress={() => setRewardNotice(null)}>
              <Text style={styles.rewardModalButtonText}>Collect Reward</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function getQuestProgress(
  type: string,
  dailyProgress: {
    lessonsToday: number;
    challengesToday: number;
    commandsToday: number;
  },
) {
  switch (type) {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pressed: { opacity: 0.88 },
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
  headerCopy: { flex: 1 },
  title: { color: Colors.text, fontSize: 26, fontWeight: "800" },
  subtitle: { color: Colors.textSecondary, fontSize: 14, marginTop: 4 },
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
    fontSize: 28,
    fontWeight: "800",
  },
  summaryLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  summaryRight: {
    alignItems: "flex-end",
  },
  summaryShardValue: {
    color: Colors.xpGold,
    fontSize: 20,
    fontWeight: "800",
  },
  summaryShardLabel: {
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
  summaryProgressBlock: {
    marginTop: 14,
  },
  summaryProgressTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryProgressLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: "600",
  },
  summaryProgressValue: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  summaryProgressBarBg: {
    height: 6,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: Colors.background,
  },
  summaryProgressBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  summaryMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  summaryMetaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  summaryMetaText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  previewButton: {
    marginTop: 14,
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
  previewButtonText: {
    color: Colors.xpGold,
    fontSize: 12,
    fontWeight: "700",
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  questCard: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  questDone: { borderColor: Colors.success + "40" },
  questLeft: { marginRight: 12 },
  questContent: { flex: 1 },
  questTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  questTitle: { color: Colors.text, fontSize: 14, fontWeight: "600" },
  questTitleDone: { textDecorationLine: "line-through", color: Colors.textMuted },
  readyBadge: {
    backgroundColor: Colors.success + "18",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  readyBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  questDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  questProgressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  questBarBg: {
    flex: 1,
    height: 5,
    backgroundColor: Colors.background,
    borderRadius: 999,
    overflow: "hidden",
  },
  questBarFill: {
    height: "100%",
    backgroundColor: Colors.accent,
    borderRadius: 999,
  },
  questProgressText: { color: Colors.textMuted, fontSize: 11 },
  questRewardRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  questRewardPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  questRewardText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  questRight: { marginLeft: 8 },
  claimBtn: {
    backgroundColor: Colors.xpGold,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  claimText: { color: Colors.background, fontSize: 12, fontWeight: "700" },
  rewardBadge: { flexDirection: "row", alignItems: "center", gap: 3 },
  rewardBadgeText: { color: Colors.xpGold, fontSize: 12, fontWeight: "600" },
  rewardOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  rewardModal: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.xpGold + "35",
    paddingHorizontal: 24,
    paddingVertical: 30,
    alignItems: "center",
    overflow: "hidden",
  },
  rewardModalGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -70,
    backgroundColor: Colors.xpGold,
    opacity: 0.12,
  },
  rewardModalEyebrow: {
    color: Colors.xpGold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginTop: 14,
  },
  rewardModalTitle: {
    color: Colors.text,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 10,
  },
  rewardModalBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
  },
  rewardModalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 22,
  },
  rewardModalPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rewardModalPillText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  rewardModalButton: {
    marginTop: 24,
    backgroundColor: Colors.xpGold,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  rewardModalButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
});
