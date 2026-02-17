import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { challenges } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

interface OutputLine {
  id: string;
  type: "prompt" | "output" | "error" | "success";
  text: string;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function ChallengeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const challenge = challenges.find((c) => c.id === id);
  const insets = useSafeAreaInsets();
  const { addXp, completeChallenge, completedChallenges } = useProgress();

  const [input, setInput] = useState("");
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [solved, setSolved] = useState(false);
  const [hintIndex, setHintIndex] = useState(-1);
  const [attempts, setAttempts] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  if (!challenge) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Challenge not found</Text>
      </View>
    );
  }

  const isAlreadyCompleted = completedChallenges.includes(challenge.id);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || solved) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newLines: OutputLine[] = [...outputLines];
    newLines.push({ id: generateId(), type: "prompt", text: `$ ${trimmed}` });
    setAttempts((a) => a + 1);

    if (challenge.acceptedCommands.includes(trimmed)) {
      if (challenge.output) {
        newLines.push({ id: generateId(), type: "output", text: challenge.output });
      }
      newLines.push({ id: generateId(), type: "success", text: "Correct! Challenge solved!" });
      setSolved(true);

      if (!isAlreadyCompleted) {
        addXp(challenge.xpReward);
        completeChallenge(challenge.id);
      }

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      newLines.push({
        id: generateId(),
        type: "error",
        text: "Not quite right. Try again!",
      });
    }

    setOutputLines(newLines);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  function revealHint() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHintIndex((prev) => Math.min(prev + 1, challenge.hints.length - 1));
  }

  if (solved) {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.doneContent}>
          <View style={styles.doneIcon}>
            <Ionicons name="trophy" size={64} color={Colors.xpGold} />
          </View>
          <Text style={styles.doneTitle}>Challenge Solved!</Text>
          <Text style={styles.doneSubtitle}>{challenge.title}</Text>
          <Text style={styles.attemptsText}>
            Solved in {attempts} {attempts === 1 ? "attempt" : "attempts"}
          </Text>
          {!isAlreadyCompleted && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.xpEarned}>
              <Ionicons name="star" size={20} color={Colors.xpGold} />
              <Text style={styles.xpEarnedText}>+{challenge.xpReward} XP</Text>
            </Animated.View>
          )}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
            <Text style={styles.doneButtonText}>Back to Challenges</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const diffColor =
    challenge.difficulty === "beginner"
      ? Colors.success
      : challenge.difficulty === "intermediate"
      ? Colors.warning
      : Colors.error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {challenge.title}
          </Text>
          <View style={styles.headerMeta}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + "20" }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>{challenge.difficulty}</Text>
            </View>
            <View style={styles.xpWrap}>
              <Ionicons name="star" size={12} color={Colors.xpGold} />
              <Text style={styles.xpText}>{challenge.xpReward} XP</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.taskCard}>
        <Ionicons name="flag" size={18} color={Colors.accent} />
        <Text style={styles.taskText}>{challenge.task}</Text>
      </View>

      {hintIndex >= 0 && (
        <Animated.View entering={FadeInDown.duration(300)} style={styles.hintsContainer}>
          {challenge.hints.slice(0, hintIndex + 1).map((hint, i) => (
            <View key={i} style={styles.hintRow}>
              <Ionicons name="bulb" size={14} color={Colors.warning} />
              <Text style={styles.hintText}>{hint}</Text>
            </View>
          ))}
        </Animated.View>
      )}

      <View style={styles.terminalArea}>
        <ScrollView
          ref={scrollRef}
          style={styles.terminalScroll}
          contentContainerStyle={styles.terminalContent}
          showsVerticalScrollIndicator={false}
        >
          {outputLines.map((line) => (
            <Text
              key={line.id}
              style={[
                styles.termLine,
                line.type === "prompt" && styles.promptLine,
                line.type === "error" && styles.errorLine,
                line.type === "success" && styles.successLine,
              ]}
            >
              {line.text}
            </Text>
          ))}
        </ScrollView>

        <View style={styles.inputRow}>
          <Text style={styles.promptChar}>$ </Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSubmit}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            placeholder="your answer..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="send"
            blurOnSubmit={false}
            selectionColor={Colors.terminalGreen}
          />
        </View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={revealHint}
          disabled={hintIndex >= challenge.hints.length - 1}
          style={({ pressed }) => [
            styles.hintBtn,
            pressed && { opacity: 0.7 },
            hintIndex >= challenge.hints.length - 1 && { opacity: 0.4 },
          ]}
        >
          <Ionicons name="bulb" size={18} color={Colors.warning} />
          <Text style={styles.hintBtnText}>
            {hintIndex >= challenge.hints.length - 1
              ? "No more hints"
              : `Hint (${hintIndex + 1}/${challenge.hints.length})`}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  headerMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: "600" as const,
    textTransform: "capitalize" as const,
  },
  xpWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  xpText: {
    fontSize: 12,
    color: Colors.xpGold,
    fontWeight: "500" as const,
  },
  taskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    flex: 1,
  },
  hintsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    gap: 6,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.warning + "10",
    borderRadius: 8,
    padding: 10,
  },
  hintText: {
    fontSize: 13,
    color: Colors.warning,
    flex: 1,
  },
  terminalArea: {
    flex: 1,
    marginHorizontal: 16,
    backgroundColor: "#0A0E14",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  terminalScroll: {
    flex: 1,
  },
  terminalContent: {
    padding: 12,
  },
  termLine: {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 4,
  },
  promptLine: {
    color: Colors.terminalGreen,
  },
  errorLine: {
    color: Colors.error,
  },
  successLine: {
    color: Colors.accent,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(48, 54, 61, 0.5)",
    backgroundColor: "#080C12",
  },
  promptChar: {
    fontFamily: monoFont,
    fontSize: 13,
    color: Colors.accent,
  },
  input: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 13,
    color: Colors.terminalGreen,
    padding: 0,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  hintBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.warning + "15",
    paddingVertical: 12,
    borderRadius: 10,
  },
  hintBtnText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: Colors.warning,
  },
  doneContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  doneContent: {
    alignItems: "center",
    paddingHorizontal: 32,
  },
  doneIcon: {
    marginBottom: 20,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  doneSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  attemptsText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  xpEarned: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.xpGold + "15",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 32,
  },
  xpEarnedText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.xpGold,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.surface,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  errorText: {
    fontSize: 18,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
