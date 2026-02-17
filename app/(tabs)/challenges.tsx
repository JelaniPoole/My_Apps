import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import { challenges, Challenge } from "@/lib/linux-data";

const diffColors: Record<string, string> = {
  E: Colors.rankE,
  D: Colors.rankD,
  C: Colors.rankC,
  B: Colors.rankB,
  A: Colors.rankA,
};

function BossCard({
  challenge,
  defeated,
  onFight,
}: {
  challenge: Challenge;
  defeated: boolean;
  onFight: () => void;
}) {
  return (
    <Pressable onPress={onFight} style={({ pressed }) => [styles.bossCard, pressed && styles.pressed]}>
      <LinearGradient
        colors={[defeated ? Colors.success + "10" : diffColors[challenge.difficulty] + "12", Colors.surface]}
        style={styles.bossGradient}
      >
        <View style={styles.bossTop}>
          <View style={[styles.bossIcon, { borderColor: defeated ? Colors.success + "60" : diffColors[challenge.difficulty] + "60" }]}>
            <Ionicons
              name={defeated ? "checkmark-circle" : (challenge.icon as any)}
              size={22}
              color={defeated ? Colors.success : diffColors[challenge.difficulty]}
            />
          </View>
          <View style={styles.bossInfo}>
            <Text style={styles.bossName}>{challenge.bossName}</Text>
            <Text style={styles.bossSubtitle}>{challenge.title}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColors[challenge.difficulty] + "20" }]}>
            <Text style={[styles.diffText, { color: diffColors[challenge.difficulty] }]}>{challenge.difficulty}</Text>
          </View>
        </View>
        <View style={styles.bossFooter}>
          <View style={styles.rewardRow}>
            <Ionicons name="star" size={12} color={Colors.xpGold} />
            <Text style={styles.rewardText}>{challenge.xpReward} XP</Text>
          </View>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardText, { color: Colors["stat" + challenge.statReward.type as keyof typeof Colors] as string }]}>
              +{challenge.statReward.amount} {challenge.statReward.type}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function BossRaids() {
  const insets = useSafeAreaInsets();
  const { completedChallenges, completeChallenge, addXp, addStat } = useProgress();
  const [activeChallenge, setActiveChallenge] = useState<Challenge | null>(null);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hintIdx, setHintIdx] = useState(0);
  const [showVictory, setShowVictory] = useState(false);

  function handleSubmit() {
    if (!activeChallenge || !input.trim()) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const trimmed = input.trim();
    const match = activeChallenge.acceptedCommands.some(
      (cmd) => cmd.toLowerCase() === trimmed.toLowerCase()
    );

    if (match) {
      if (!completedChallenges.includes(activeChallenge.id)) {
        addXp(activeChallenge.xpReward);
        addStat(activeChallenge.statReward.type, activeChallenge.statReward.amount);
        completeChallenge(activeChallenge.id);
      }
      setShowVictory(true);
    } else {
      setFeedback("That's not the right command. Try again!");
    }
    setInput("");
  }

  function showHint() {
    if (!activeChallenge) return;
    const hints = activeChallenge.hints;
    setFeedback(hints[Math.min(hintIdx, hints.length - 1)]);
    setHintIdx((h) => h + 1);
  }

  function closeBattle() {
    setActiveChallenge(null);
    setInput("");
    setFeedback("");
    setHintIdx(0);
    setShowVictory(false);
  }

  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Ionicons name="skull" size={22} color={Colors.error} />
          <Text style={styles.pageTitle}>Boss Raids</Text>
        </View>
        <Text style={styles.pageSubtitle}>
          Defeat bosses with the right Linux command
        </Text>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {completedChallenges.length}/{challenges.length} defeated
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedChallenges.length / challenges.length) * 100}%` }]} />
          </View>
        </View>

        {challenges.map((ch, idx) => (
          <Animated.View key={ch.id} entering={FadeInDown.duration(400).delay(idx * 60)}>
            <BossCard
              challenge={ch}
              defeated={completedChallenges.includes(ch.id)}
              onFight={() => {
                setActiveChallenge(ch);
                setInput("");
                setFeedback("");
                setHintIdx(0);
                setShowVictory(false);
              }}
            />
          </Animated.View>
        ))}
      </ScrollView>

      <Modal visible={!!activeChallenge && !showVictory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.battleCard}>
            <LinearGradient colors={[Colors.error + "20", Colors.surface]} style={styles.battleGradient}>
              <View style={styles.battleHeader}>
                <Text style={styles.battleBossName}>{activeChallenge?.bossName}</Text>
                <Pressable onPress={closeBattle} hitSlop={16}>
                  <Ionicons name="close" size={24} color={Colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.battleTask}>
                <Ionicons name="alert-circle" size={18} color={Colors.accent} />
                <Text style={styles.battleTaskText}>{activeChallenge?.task}</Text>
              </View>

              {activeChallenge?.output ? (
                <View style={styles.outputBox}>
                  <Text style={styles.outputText}>{activeChallenge.output}</Text>
                </View>
              ) : null}

              {feedback ? (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{feedback}</Text>
                </View>
              ) : null}

              <View style={styles.inputRow}>
                <Text style={styles.prompt}>$</Text>
                <TextInput
                  style={styles.battleInput}
                  value={input}
                  onChangeText={setInput}
                  onSubmitEditing={handleSubmit}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  placeholder="Enter command..."
                  placeholderTextColor={Colors.textMuted}
                  returnKeyType="send"
                  blurOnSubmit={false}
                  selectionColor={Colors.terminalGreen}
                />
              </View>

              <View style={styles.battleActions}>
                <Pressable style={styles.hintBtn} onPress={showHint}>
                  <Ionicons name="bulb" size={18} color={Colors.warning} />
                  <Text style={styles.hintText}>Hint</Text>
                </Pressable>
                <Pressable style={styles.attackBtn} onPress={handleSubmit}>
                  <Ionicons name="flash" size={18} color={Colors.text} />
                  <Text style={styles.attackText}>Attack</Text>
                </Pressable>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <Modal visible={showVictory} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.victoryCard}>
            <LinearGradient colors={[Colors.xpGold + "30", Colors.surface]} style={styles.victoryGradient}>
              <Ionicons name="trophy" size={48} color={Colors.xpGold} />
              <Text style={styles.victoryTitle}>BOSS DEFEATED</Text>
              <Text style={styles.victoryBoss}>{activeChallenge?.bossName}</Text>

              <View style={styles.rewardsSection}>
                <View style={styles.rewardItem}>
                  <Ionicons name="star" size={20} color={Colors.xpGold} />
                  <Text style={styles.rewardAmount}>+{activeChallenge?.xpReward} XP</Text>
                </View>
                {activeChallenge && (
                  <View style={styles.rewardItem}>
                    <Ionicons name="trending-up" size={20} color={Colors["stat" + activeChallenge.statReward.type as keyof typeof Colors] as string} />
                    <Text style={[styles.rewardAmount, { color: Colors["stat" + activeChallenge.statReward.type as keyof typeof Colors] as string }]}>
                      +{activeChallenge.statReward.amount} {activeChallenge.statReward.type}
                    </Text>
                  </View>
                )}
              </View>

              <Pressable style={styles.continueBtn} onPress={closeBattle}>
                <Text style={styles.continueBtnText}>Continue</Text>
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const monoFont = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pressed: { opacity: 0.8 },

  pageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 16 },
  pageTitle: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 14, marginHorizontal: 20, marginTop: 4, marginBottom: 12 },

  progressRow: { marginHorizontal: 20, marginBottom: 16 },
  progressText: { color: Colors.textSecondary, fontSize: 12, marginBottom: 6 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: Colors.error, borderRadius: 3 },

  bossCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  bossGradient: { padding: 14 },
  bossTop: { flexDirection: "row", alignItems: "center" },
  bossIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  bossInfo: { flex: 1, marginLeft: 12 },
  bossName: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  bossSubtitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 1 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  diffText: { fontSize: 13, fontWeight: "800" },
  bossFooter: { flexDirection: "row", gap: 16, marginTop: 10, marginLeft: 54 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 12, fontWeight: "600", color: Colors.xpGold },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 24 },

  battleCard: { width: "100%", maxWidth: 380, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.error + "40" },
  battleGradient: { padding: 24 },
  battleHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  battleBossName: { color: Colors.error, fontSize: 20, fontWeight: "800" },
  battleTask: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 16 },
  battleTaskText: { color: Colors.text, fontSize: 15, flex: 1, lineHeight: 22 },
  outputBox: { backgroundColor: Colors.background, borderRadius: 8, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  outputText: { fontFamily: monoFont, fontSize: 12, color: Colors.terminalGreen, lineHeight: 18 },
  feedbackBox: { backgroundColor: Colors.warning + "15", borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: Colors.warning + "30" },
  feedbackText: { color: Colors.warning, fontSize: 13 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  prompt: { fontFamily: monoFont, fontSize: 14, color: Colors.accent, marginRight: 8 },
  battleInput: { flex: 1, fontFamily: monoFont, fontSize: 14, color: Colors.terminalGreen, padding: 0 },

  battleActions: { flexDirection: "row", gap: 12 },
  hintBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.warning + "15",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.warning + "30",
  },
  hintText: { color: Colors.warning, fontWeight: "600", fontSize: 14 },
  attackBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  attackText: { color: Colors.text, fontWeight: "700", fontSize: 14 },

  victoryCard: { width: "100%", maxWidth: 340, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: Colors.xpGold + "40" },
  victoryGradient: { padding: 32, alignItems: "center" },
  victoryTitle: { color: Colors.xpGold, fontSize: 22, fontWeight: "900", marginTop: 16, letterSpacing: 2 },
  victoryBoss: { color: Colors.textSecondary, fontSize: 14, marginTop: 6 },
  rewardsSection: { marginTop: 24, gap: 12 },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardAmount: { color: Colors.xpGold, fontSize: 18, fontWeight: "700" },
  continueBtn: { backgroundColor: Colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: 12, marginTop: 28 },
  continueBtnText: { color: Colors.text, fontSize: 16, fontWeight: "700" },
});
