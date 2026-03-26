import React, { useEffect, useMemo, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { orderedChallenges } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

const colors = {
  background: "#0C0D14",
  card: "#151625",
  cardAlt: "#10131C",
  border: "#2B2D4A",
  text: "#F5F7FF",
  subtext: "#8D90B5",
  accent: "#64D2FF",
  success: "#4ADE80",
  danger: "#FF5D73",
  gold: "#FFC83D",
};

type RaidChallenge = (typeof orderedChallenges)[number];

const rankColors: Record<string, string> = {
  E: "#7CFF6B",
  D: "#64D2FF",
  C: "#FFC83D",
  B: "#FF8A5B",
  A: "#FF5D73",
  S: "#FF5D73",
};

export default function BossRaids() {
  const progressContext = useProgress();
  const progress = progressContext?.progress ?? {
    completedChallenges: [] as string[],
  };
  const completeChallenge =
    progressContext?.completeChallenge ?? (() => undefined);
  const addXP = progressContext?.addXP ?? (() => undefined);

  const [listMode, setListMode] = useState<"active" | "completed">("active");
  const [activeChallenge, setActiveChallenge] = useState<RaidChallenge | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hintIdx, setHintIdx] = useState(0);
  const [showVictory, setShowVictory] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const activeChallenges = useMemo(
    () =>
      orderedChallenges.filter(
        (challenge) => !progress.completedChallenges.includes(challenge.id),
      ),
    [progress.completedChallenges],
  );

  const completedChallenges = useMemo(
    () =>
      orderedChallenges.filter((challenge) =>
        progress.completedChallenges.includes(challenge.id),
      ),
    [progress.completedChallenges],
  );

  const visibleChallenges =
    listMode === "active" ? activeChallenges : completedChallenges;

  const openChallenge = (challenge: RaidChallenge) => {
    setActiveChallenge(challenge);
    setInput("");
    setFeedback("");
    setHintIdx(0);
    setShowVictory(false);
  };

  const closeChallenge = () => {
    setActiveChallenge(null);
    setInput("");
    setFeedback("");
    setHintIdx(0);
    setShowVictory(false);
  };

  const getAcceptedCommands = (challenge: RaidChallenge) => {
    const variants = (challenge as any).acceptedCommands;
    if (Array.isArray(variants) && variants.length > 0) {
      return variants as string[];
    }

    const fallback =
      (challenge as any).solution ??
      (challenge as any).command ??
      (challenge as any).answer;

    return typeof fallback === "string" ? [fallback] : [];
  };

  const getHints = (challenge: RaidChallenge) => {
    const hints = (challenge as any).hints;
    return Array.isArray(hints) ? (hints as string[]) : [];
  };

  const getReward = (challenge: RaidChallenge) => {
    return (
      (challenge as any).xpReward ??
      (challenge as any).reward ??
      (challenge as any).xp ??
      50
    );
  };

  const getRankColor = (difficulty?: string) => {
    if (!difficulty) {
      return colors.gold;
    }

    return rankColors[difficulty] ?? colors.gold;
  };

  const submitChallenge = () => {
    if (!activeChallenge) {
      return;
    }

    const normalized = input.trim().toLowerCase();
    if (!normalized) {
      setFeedback("Type a command before attacking.");
      return;
    }

    const accepted = getAcceptedCommands(activeChallenge).map((command) =>
      command.trim().toLowerCase(),
    );

    if (accepted.includes(normalized)) {
      if (!progress.completedChallenges.includes(activeChallenge.id)) {
        completeChallenge(activeChallenge.id);
        addXP(getReward(activeChallenge));
      }
      setFeedback("Raid cleared.");
      setShowVictory(true);
      return;
    }

    const hints = getHints(activeChallenge);
    if (hints.length > 0) {
      const nextHint = Math.min(hintIdx + 1, hints.length - 1);
      setHintIdx(nextHint);
      setFeedback(hints[nextHint] ?? "That command missed. Try again.");
      return;
    }

    setFeedback("That command missed. Check the clue and try again.");
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Raid Bosses</Text>
          <Text style={styles.subtitle}>Defeat elite command encounters.</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Bosses Defeated</Text>
            <Text style={styles.progressValue}>
              {completedChallenges.length}/{orderedChallenges.length}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(
                    8,
                    (completedChallenges.length /
                      Math.max(orderedChallenges.length, 1)) *
                      100,
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              listMode === "active" && styles.segmentButtonActive,
            ]}
            onPress={() => setListMode("active")}
          >
            <Text
              style={[
                styles.segmentButtonText,
                listMode === "active" && styles.segmentButtonTextActive,
              ]}
            >
              Continue
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              listMode === "completed" && styles.segmentButtonActive,
            ]}
            onPress={() => setListMode("completed")}
          >
            <Text
              style={[
                styles.segmentButtonText,
                listMode === "completed" && styles.segmentButtonTextActive,
              ]}
            >
              Completed
            </Text>
          </TouchableOpacity>
        </View>

        {visibleChallenges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {listMode === "active"
                ? "All raids are cleared."
                : "No completed raids yet."}
            </Text>
            <Text style={styles.emptyText}>
              {listMode === "active"
                ? "Replay cleared raids anytime from the Completed tab."
                : "Finished raids will move here so the main list stays focused."}
            </Text>
          </View>
        ) : null}

        {visibleChallenges.map((challenge) => {
          const cleared = progress.completedChallenges.includes(challenge.id);
          const rankColor = getRankColor((challenge as any).difficulty);
          return (
            <TouchableOpacity
              key={challenge.id}
              style={styles.challengeCard}
              activeOpacity={0.9}
              onPress={() => openChallenge(challenge)}
            >
              <View style={styles.challengeTop}>
                <View style={styles.challengeCopy}>
                  <Text style={[styles.challengeRank, { color: rankColor }]}>
                    Rank {(challenge as any).difficulty ?? "?"}
                  </Text>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    cleared && styles.statusBadgeComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      cleared && styles.statusTextComplete,
                    ]}
                  >
                    {cleared ? "Cleared" : "Open"}
                  </Text>
                </View>
              </View>

              <Text style={styles.challengeDescription}>
                {(challenge as any).description ??
                  (challenge as any).objective ??
                  "Use the correct Linux command to clear this raid."}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Modal visible={!!activeChallenge} transparent animationType="slide">
        <View
          style={[
            styles.modalBackdrop,
            keyboardVisible && styles.modalBackdropKeyboard,
          ]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
            style={[
              styles.modalAvoidingView,
              keyboardVisible && styles.modalAvoidingViewKeyboard,
            ]}
          >
            <View
              style={[
                styles.modalCard,
                keyboardVisible && styles.modalCardKeyboard,
              ]}
            >
              {activeChallenge ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <Text
                    style={[
                      styles.modalRank,
                      { color: getRankColor((activeChallenge as any).difficulty) },
                    ]}
                  >
                    Rank {(activeChallenge as any).difficulty ?? "?"}
                  </Text>
                  <Text style={styles.modalTitle}>{activeChallenge.title}</Text>
                  <Text style={styles.modalDescription}>
                    {(activeChallenge as any).description ??
                      (activeChallenge as any).objective ??
                      "Defeat this raid with the right command."}
                  </Text>

                  <View style={styles.contextCard}>
                    <Text style={styles.contextLabel}>Encounter</Text>
                    <Text style={styles.contextText}>
                      This boss is testing whether you can pick the right Linux
                      command for this situation, not just memorize a name.
                    </Text>
                    <Text style={styles.contextSubLabel}>What To Think About</Text>
                    <Text style={styles.contextText}>
                      Focus on what action the prompt is asking for, then choose
                      the command that best matches that job.
                    </Text>
                  </View>

                  <View style={styles.hintCard}>
                    <Text style={styles.hintLabel}>First Clue</Text>
                    <Text style={styles.hintText}>
                      {getHints(activeChallenge)[0] ??
                        "Start from the command family that matches the task."}
                    </Text>
                  </View>

                  {hintIdx > 0 && getHints(activeChallenge)[hintIdx] ? (
                    <View style={styles.hintCard}>
                      <Text style={styles.hintLabel}>More Help</Text>
                      <Text style={styles.hintText}>
                        {getHints(activeChallenge)[hintIdx]}
                      </Text>
                    </View>
                  ) : null}

                  {feedback ? (
                    <Text
                      style={[
                        styles.feedback,
                        showVictory ? styles.feedbackSuccess : styles.feedbackError,
                      ]}
                    >
                      {feedback}
                    </Text>
                  ) : null}

                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    placeholder="Type your command..."
                    placeholderTextColor={colors.subtext}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                  />

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={closeChallenge}
                    >
                      <Text style={styles.secondaryButtonText}>Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={showVictory ? closeChallenge : submitChallenge}
                    >
                      <Text style={styles.primaryButtonText}>
                        {showVictory ? "Done" : "Attack"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              ) : null}
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.subtext,
    fontSize: 15,
    marginTop: 6,
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progressLabel: {
    color: colors.subtext,
    fontSize: 14,
    fontWeight: "600",
  },
  progressValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.cardAlt,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: 999,
  },
  segmentedControl: {
    flexDirection: "row",
    alignSelf: "flex-start",
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: 18,
  },
  segmentButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  segmentButtonActive: {
    backgroundColor: colors.accent,
  },
  segmentButtonText: {
    color: colors.subtext,
    fontSize: 13,
    fontWeight: "700",
  },
  segmentButtonTextActive: {
    color: colors.background,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 21,
  },
  challengeCard: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 14,
  },
  challengeTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  challengeCopy: {
    flex: 1,
  },
  challengeRank: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  challengeTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
  },
  challengeDescription: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
  },
  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeComplete: {
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderColor: "rgba(74, 222, 128, 0.35)",
  },
  statusText: {
    color: colors.subtext,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statusTextComplete: {
    color: colors.success,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "center",
    padding: 16,
  },
  modalBackdropKeyboard: {
    justifyContent: "flex-end",
    paddingTop: 12,
    paddingBottom: 0,
  },
  modalAvoidingView: {
    justifyContent: "center",
  },
  modalAvoidingViewKeyboard: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    maxHeight: "86%",
  },
  modalCardKeyboard: {
    maxHeight: "95%",
  },
  modalScrollContent: {
    paddingBottom: 4,
  },
  modalRank: {
    color: colors.gold,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 10,
  },
  modalDescription: {
    color: colors.subtext,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  contextCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  contextLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  contextSubLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 4,
  },
  contextText: {
    color: colors.subtext,
    fontSize: 14,
    lineHeight: 21,
  },
  hintCard: {
    backgroundColor: colors.cardAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  hintLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  hintText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  feedback: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  feedbackSuccess: {
    color: colors.success,
  },
  feedbackError: {
    color: colors.danger,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
});
