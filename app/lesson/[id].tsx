import React, { useState } from "react";
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
import Animated, { FadeIn, FadeInDown, SlideInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { lessons } from "@/lib/linux-data";
import { useProgress } from "@/lib/progress-context";

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

interface OutputLine {
  id: string;
  type: "prompt" | "output" | "success" | "error";
  text: string;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function normalizeCommand(command: string) {
  return command.trim().replace(/\s+/g, " ").toLowerCase();
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = lessons.find((l) => l.id === id);
  const insets = useSafeAreaInsets();
  const { addXp, completeLesson, completedLessons } = useProgress();

  const [currentStep, setCurrentStep] = useState(0);
  const [input, setInput] = useState("");
  const [outputLines, setOutputLines] = useState<OutputLine[]>([]);
  const [stepCompleted, setStepCompleted] = useState(false);
  const [lessonDone, setLessonDone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  if (!lesson) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Lesson not found</Text>
      </View>
    );
  }

  // TypeScript now knows lesson is defined after the null check
  const step = lesson.steps[currentStep];
  const isAlreadyCompleted = completedLessons.includes(lesson.id);

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed || stepCompleted) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newLines: OutputLine[] = [...outputLines];
    newLines.push({ id: generateId(), type: "prompt", text: `$ ${trimmed}` });

    const normalizedInput = normalizeCommand(trimmed);
    const acceptedCommands = step.acceptedCommands ?? [step.expectedCommand];

    if (acceptedCommands.some((command) => normalizeCommand(command) === normalizedInput)) {
      if (step.output) {
        newLines.push({ id: generateId(), type: "output", text: step.output });
      }
      newLines.push({ id: generateId(), type: "success", text: step.successMessage });
      setStepCompleted(true);

      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      newLines.push({
        id: generateId(),
        type: "error",
        text: `Not quite. Try: ${step.hint}`,
      });
    }

    setOutputLines(newLines);
    setInput("");
  }

  function handleNext() {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < lesson!.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setStepCompleted(false);
      setShowHint(false);
      setOutputLines([]);
      setInput("");
    } else {
      if (!isAlreadyCompleted) {
        addXp(lesson!.xpReward);
        completeLesson(lesson!.id);
      }
      setLessonDone(true);
    }
  }

  if (lessonDone) {
    return (
      <View style={[styles.container, styles.doneContainer]}>
        <Animated.View entering={FadeIn.duration(500)} style={styles.doneContent}>
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.terminalGreen} />
          </View>
          <Text style={styles.doneTitle}>Lesson Complete!</Text>
          <Text style={styles.doneSubtitle}>{lesson.title}</Text>
          {!isAlreadyCompleted && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.xpEarned}>
              <Ionicons name="star" size={20} color={Colors.xpGold} />
              <Text style={styles.xpEarnedText}>+{lesson.xpReward} XP</Text>
            </Animated.View>
          )}
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.doneButton, pressed && { opacity: 0.8 }]}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
            <Text style={styles.doneButtonText}>Back to Lessons</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {lesson.title}
          </Text>
          <Text style={styles.stepIndicator}>
            Step {currentStep + 1} of {lesson.steps.length}
          </Text>
        </View>
        <Pressable
          onPress={() => setShowHint(!showHint)}
          style={[styles.hintBtn, showHint && { backgroundColor: Colors.warning + "20" }]}
        >
          <Ionicons name="bulb-outline" size={18} color={Colors.warning} />
        </Pressable>
      </View>

      <View style={styles.progressDots}>
        {lesson.steps.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < currentStep && styles.dotCompleted,
              i === currentStep && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <ScrollView
        style={styles.screenBody}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bodyShell}>
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={SlideInRight.duration(300)} style={styles.lessonPanel}>
              <View style={styles.instructionCard}>
                <View style={styles.lessonMetaRow}>
                  <View style={styles.lessonChip}>
                    <Text style={styles.lessonChipLabel}>Concept</Text>
                    <Text style={styles.lessonChipValue}>{step.concept}</Text>
                  </View>
                  <View style={styles.lessonChip}>
                    <Text style={styles.lessonChipLabel}>Track</Text>
                    <Text style={styles.lessonChipValue}>{lesson.category}</Text>
                  </View>
                </View>
                <Text style={styles.instruction}>{step.instruction}</Text>
                <Text style={styles.explanation}>{step.explanation}</Text>
                {step.example ? (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Example</Text>
                    <Text style={styles.exampleText}>{step.example}</Text>
                  </View>
                ) : null}
                {step.whyItWorks ? (
                  <View style={styles.whyBox}>
                    <Text style={styles.whyLabel}>Why it works</Text>
                    <Text style={styles.whyText}>{step.whyItWorks}</Text>
                  </View>
                ) : null}
                {showHint && (
                  <View style={styles.hintBox}>
                    <Ionicons name="bulb" size={14} color={Colors.warning} />
                    <Text style={styles.hintText}>{step.hint}</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </ScrollView>

          <View
            style={[
              styles.lessonTerminalWrap,
              { paddingBottom: Platform.OS === "web" ? 12 : Math.max(insets.bottom, 12) },
            ]}
          >
            <View style={styles.terminalArea}>
              <View style={styles.terminalContent}>
                {outputLines.length === 0 ? <Text style={[styles.termLine, styles.promptLine]}>hunter@system:~$</Text> : null}
                {outputLines.map((line) => (
                  line.type === "prompt" ? (
                    <Text key={line.id} style={styles.termLine}>
                      <Text style={styles.promptLine}>$ </Text>
                      <Text style={styles.commandLine}>{line.text.slice(2)}</Text>
                    </Text>
                  ) : (
                    <Text
                      key={line.id}
                      style={[
                        styles.termLine,
                        line.type === "error" && styles.errorLine,
                        line.type === "success" && styles.successLine,
                      ]}
                    >
                      {line.text}
                    </Text>
                  )
                ))}
              </View>

              {!stepCompleted ? (
                <View style={styles.inputRow}>
                  <Text style={styles.promptChar}>hunter@system:~$ </Text>
                  <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleSubmit}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="type the command..."
                    placeholderTextColor={Colors.textMuted}
                    returnKeyType="send"
                    blurOnSubmit={false}
                    selectionColor={Colors.terminalGreen}
                  />
                </View>
              ) : (
                <Pressable
                  onPress={handleNext}
                  style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.85 }]}
                >
                  <Text style={styles.nextText}>
                    {currentStep < lesson.steps.length - 1 ? "Next Step" : "Finish Lesson"}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color="#000" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 18,
    paddingBottom: 8,
    gap: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
  },
  stepIndicator: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
    textAlign: "center",
  },
  hintBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  screenBody: {
    flex: 1,
  },
  bodyShell: {
    flex: 1,
  },
  bodyScroll: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 18,
  },
  dotCompleted: {
    backgroundColor: Colors.terminalGreen,
  },
  lessonPanel: {
    gap: 10,
  },
  instructionCard: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  instruction: {
    fontSize: 18,
    color: Colors.text,
    lineHeight: 28,
    fontWeight: "700" as const,
  },
  lessonMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  lessonChip: {
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  lessonChipLabel: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  lessonChipValue: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700" as const,
    marginTop: 2,
  },
  explanation: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginTop: 12,
  },
  exampleBox: {
    marginTop: 16,
    paddingTop: 14,
  },
  exampleLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  exampleText: {
    color: Colors.terminalGreen,
    fontFamily: monoFont,
    fontSize: 15,
    marginTop: 8,
  },
  whyBox: {
    marginTop: 12,
    paddingTop: 12,
  },
  whyLabel: {
    color: Colors.accent,
    fontSize: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.6,
  },
  whyText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hintText: {
    fontSize: 14,
    color: Colors.warning,
    flex: 1,
    lineHeight: 21,
  },
  lessonTerminalWrap: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },
  terminalArea: {
    backgroundColor: "#0A0E14",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 220,
  },
  terminalContent: {
    padding: 12,
  },
  termLine: {
    fontFamily: monoFont,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 6,
  },
  promptLine: {
    color: Colors.accent,
  },
  commandLine: {
    color: Colors.terminalGreen,
  },
  errorLine: {
    color: Colors.error,
  },
  successLine: {
    color: Colors.warning,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(48, 54, 61, 0.5)",
    backgroundColor: "#080C12",
  },
  promptChar: {
    fontFamily: monoFont,
    fontSize: 14,
    color: Colors.accent,
  },
  input: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 14,
    color: Colors.terminalGreen,
    padding: 0,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.terminalGreen,
    paddingVertical: 14,
    margin: 12,
    borderRadius: 10,
  },
  nextText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#000",
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
