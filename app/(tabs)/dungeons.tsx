import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import { lessons, Lesson } from "@/lib/linux-data";
import TerminalView from "@/components/TerminalView";

const diffColors: Record<string, string> = {
  E: Colors.rankE,
  D: Colors.rankD,
  C: Colors.rankC,
  B: Colors.rankB,
  A: Colors.rankA,
};

function DungeonCard({
  lesson,
  cleared,
  onEnter,
}: {
  lesson: Lesson;
  cleared: boolean;
  onEnter: () => void;
}) {
  return (
    <Pressable onPress={onEnter} style={({ pressed }) => [styles.dungeonCard, pressed && styles.pressed]}>
      <LinearGradient
        colors={[cleared ? Colors.success + "15" : diffColors[lesson.difficulty] + "15", Colors.surface]}
        style={styles.dungeonGradient}
      >
        <View style={styles.dungeonTop}>
          <View style={[styles.dungeonIconWrap, { borderColor: cleared ? Colors.success + "60" : diffColors[lesson.difficulty] + "60" }]}>
            <Ionicons
              name={cleared ? "checkmark-circle" : (lesson.icon as any)}
              size={24}
              color={cleared ? Colors.success : diffColors[lesson.difficulty]}
            />
          </View>
          <View style={styles.dungeonInfo}>
            <Text style={styles.dungeonName}>{lesson.dungeonName}</Text>
            <Text style={styles.dungeonTitle}>{lesson.title}</Text>
          </View>
          <View style={[styles.diffBadge, { backgroundColor: diffColors[lesson.difficulty] + "20" }]}>
            <Text style={[styles.diffText, { color: diffColors[lesson.difficulty] }]}>{lesson.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.dungeonDesc}>{lesson.description}</Text>
        <View style={styles.dungeonFooter}>
          <View style={styles.rewardRow}>
            <Ionicons name="star" size={12} color={Colors.xpGold} />
            <Text style={styles.rewardText}>{lesson.xpReward} XP</Text>
          </View>
          <View style={styles.rewardRow}>
            <Text style={[styles.rewardText, { color: Colors["stat" + lesson.statReward.type as keyof typeof Colors] as string }]}>
              +{lesson.statReward.amount} {lesson.statReward.type}
            </Text>
          </View>
          <View style={styles.stepCount}>
            <Ionicons name="layers" size={12} color={Colors.textMuted} />
            <Text style={styles.stepText}>{lesson.steps.length} floors</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function Dungeons() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { completedLessons, completeLesson, addXp, addStat } = useProgress();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  function handleCommand(cmd: string, helpers: { runDefaultCommand: (cmd: string) => { output: string; type: "output" | "error" | "success" } }) {
    if (!activeLesson) return { output: "", type: "output" as const };
    const step = activeLesson.steps[currentStep];
    if (!step) return { output: "", type: "output" as const };

    const trimmed = cmd.trim().toLowerCase();
    const acceptedCommands = (step.acceptedCommands ?? [step.expectedCommand]).map((command) =>
      command.trim().replace(/\s+/g, " ").toLowerCase()
    );

    if (acceptedCommands.includes(trimmed.replace(/\s+/g, " "))) {
      const defaultResult = helpers.runDefaultCommand(cmd);
      if (currentStep < activeLesson.steps.length - 1) {
        setTimeout(() => setCurrentStep((s) => s + 1), 500);
      } else {
        if (!completedLessons.includes(activeLesson.id)) {
          addXp(activeLesson.xpReward);
          addStat(activeLesson.statReward.type, activeLesson.statReward.amount);
          completeLesson(activeLesson.id);
        }
        setTimeout(() => setShowComplete(true), 500);
      }
      return {
        output: step.output || defaultResult.output,
        type: step.output ? "output" as const : defaultResult.type,
        extraLines: [
          {
            id: "",
            text: step.successMessage,
            type: "success" as const,
          },
        ],
      };
    }
    return {
      output: `Command not recognized. ${step.hint}`,
      type: "error" as const,
    };
  }

  function closeDungeon() {
    setActiveLesson(null);
    setCurrentStep(0);
    setShowComplete(false);
  }

  const webTop = Platform.OS === "web" ? 67 : 0;

  if (activeLesson) {
    const step = activeLesson.steps[currentStep];
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View style={[styles.dungeonHeader, { paddingTop: insets.top + webTop + 8 }]}>
          <Pressable onPress={closeDungeon} hitSlop={16}>
            <Ionicons name="arrow-back" size={20} color={Colors.text} />
          </Pressable>
          <View style={styles.dungeonHeaderCenter}>
            <Text style={styles.dungeonHeaderTitle}>{activeLesson.dungeonName}</Text>
            <Text style={styles.floorText}>
              Floor {currentStep + 1}/{activeLesson.steps.length}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.activeLessonLayout}>
          <ScrollView
            style={styles.activeBodyScroll}
            contentContainerStyle={styles.activeBodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.floorProgress}>
              {activeLesson.steps.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.floorDot,
                    i < currentStep
                      ? styles.floorCleared
                      : i === currentStep
                      ? styles.floorCurrent
                      : styles.floorLocked,
                  ]}
                />
              ))}
            </View>

            <View style={styles.lessonPanel}>
              <View style={styles.instructionCard}>
                <View style={styles.lessonMetaRow}>
                  <View style={styles.lessonChip}>
                    <Text style={styles.lessonChipLabel}>Concept</Text>
                    <Text style={styles.lessonChipValue}>{step?.concept}</Text>
                  </View>
                  <View style={styles.lessonChip}>
                    <Text style={styles.lessonChipLabel}>Track</Text>
                    <Text style={styles.lessonChipValue}>{activeLesson.category}</Text>
                  </View>
                </View>
                <View style={styles.instructionHeader}>
                  <Ionicons name="alert-circle" size={18} color={Colors.accent} />
                  <Text style={styles.instructionText}>{step?.instruction}</Text>
                </View>
                <Text style={styles.explanationText}>{step?.explanation}</Text>
                {step?.example ? (
                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Example</Text>
                    <Text style={styles.exampleText}>{step.example}</Text>
                  </View>
                ) : null}
                {step?.whyItWorks ? (
                  <View style={styles.whyBox}>
                    <Text style={styles.whyLabel}>Why it works</Text>
                    <Text style={styles.whyText}>{step.whyItWorks}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </ScrollView>

          <View
            style={[
              styles.terminalWrap,
              {
                paddingBottom:
                  Platform.OS === "web"
                    ? 12
                    : isKeyboardVisible
                    ? 0
                    : Math.max(tabBarHeight - insets.bottom + 8, 12),
              },
            ]}
          >
            <TerminalView
              commandHandler={handleCommand}
              autoFocus={false}
              initialCwd={activeLesson.terminalSeed?.cwd}
              initialDirectories={activeLesson.terminalSeed?.directories}
              initialFiles={activeLesson.terminalSeed?.files}
              minHeight={280}
            />
          </View>
        </View>

        <Modal visible={showComplete} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <Animated.View entering={FadeIn.duration(400)} style={styles.completeCard}>
              <LinearGradient colors={[Colors.primary + "30", Colors.surface]} style={styles.completeGradient}>
                <Ionicons name="trophy" size={48} color={Colors.xpGold} />
                <Text style={styles.completeTitle}>DUNGEON CLEARED</Text>
                <Text style={styles.completeName}>{activeLesson.dungeonName}</Text>

                <View style={styles.rewardsSection}>
                  <View style={styles.rewardItem}>
                    <Ionicons name="star" size={20} color={Colors.xpGold} />
                    <Text style={styles.rewardAmount}>+{activeLesson.xpReward} XP</Text>
                  </View>
                  <View style={styles.rewardItem}>
                    <Ionicons name="trending-up" size={20} color={Colors["stat" + activeLesson.statReward.type as keyof typeof Colors] as string} />
                    <Text style={[styles.rewardAmount, { color: Colors["stat" + activeLesson.statReward.type as keyof typeof Colors] as string }]}>
                      +{activeLesson.statReward.amount} {activeLesson.statReward.type}
                    </Text>
                  </View>
                </View>

                <Pressable style={styles.closeBtn} onPress={closeDungeon}>
                  <Text style={styles.closeBtnText}>Continue</Text>
                </Pressable>
              </LinearGradient>
            </Animated.View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 90, paddingTop: insets.top + webTop }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageHeader}>
          <Ionicons name="map" size={22} color={Colors.primary} />
          <Text style={styles.pageTitle}>Dungeons</Text>
        </View>
        <Text style={styles.pageSubtitle}>Clear dungeons to earn XP and level up your stats</Text>

        {lessons.map((lesson, idx) => (
          <Animated.View key={lesson.id} entering={FadeInDown.duration(400).delay(idx * 80)}>
            <DungeonCard
              lesson={lesson}
              cleared={completedLessons.includes(lesson.id)}
              onEnter={() => {
                setActiveLesson(lesson);
                setCurrentStep(0);
                setShowComplete(false);
              }}
            />
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  pressed: { opacity: 0.8 },

  pageHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 16 },
  pageTitle: { color: Colors.text, fontSize: 24, fontWeight: "800" },
  pageSubtitle: { color: Colors.textSecondary, fontSize: 14, marginHorizontal: 20, marginTop: 4, marginBottom: 16 },

  dungeonCard: { marginHorizontal: 16, marginBottom: 12, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: Colors.border },
  dungeonGradient: { padding: 16 },
  dungeonTop: { flexDirection: "row", alignItems: "center" },
  dungeonIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  dungeonInfo: { flex: 1, marginLeft: 12 },
  dungeonName: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  dungeonTitle: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  diffBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  diffText: { fontSize: 13, fontWeight: "800" },
  dungeonDesc: { color: Colors.textSecondary, fontSize: 13, marginTop: 10, marginLeft: 58 },
  dungeonFooter: { flexDirection: "row", alignItems: "center", marginTop: 12, marginLeft: 58, gap: 16 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  rewardText: { fontSize: 12, fontWeight: "600", color: Colors.xpGold },
  stepCount: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepText: { color: Colors.textMuted, fontSize: 12 },

  dungeonHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  dungeonHeaderCenter: { flex: 1, alignItems: "center" },
  dungeonHeaderTitle: { color: Colors.text, fontSize: 15, fontWeight: "700" },
  floorText: { color: Colors.textSecondary, fontSize: 11, marginTop: 1 },

  floorProgress: { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 10 },
  activeLessonLayout: { flex: 1 },
  activeBodyScroll: { flex: 1 },
  activeBodyContent: { paddingHorizontal: 18, paddingTop: 2, paddingBottom: 12 },
  lessonPanel: {
    gap: 10,
  },
  floorDot: { width: 6, height: 6, borderRadius: 3 },
  floorCleared: { backgroundColor: Colors.success },
  floorCurrent: { backgroundColor: Colors.accent, width: 18 },
  floorLocked: { backgroundColor: Colors.border },

  instructionCard: {
    paddingHorizontal: 2,
    paddingVertical: 4,
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
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  lessonChipValue: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  instructionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  instructionText: { flex: 1, color: Colors.text, fontSize: 18, lineHeight: 28, fontWeight: "700" },
  explanationText: {
    color: Colors.textSecondary,
    fontSize: 15,
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
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  exampleText: {
    color: Colors.terminalGreen,
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
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  whyText: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },

  terminalWrap: {
    paddingHorizontal: 18,
    paddingTop: 10,
    backgroundColor: Colors.background,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  completeCard: { borderRadius: 20, overflow: "hidden", width: "100%", maxWidth: 340, borderWidth: 1, borderColor: Colors.primary + "40" },
  completeGradient: { padding: 32, alignItems: "center" },
  completeTitle: { color: Colors.xpGold, fontSize: 22, fontWeight: "900", marginTop: 16, letterSpacing: 2 },
  completeName: { color: Colors.textSecondary, fontSize: 14, marginTop: 6 },
  rewardsSection: { marginTop: 24, gap: 12 },
  rewardItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  rewardAmount: { color: Colors.xpGold, fontSize: 18, fontWeight: "700" },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 28,
  },
  closeBtnText: { color: Colors.text, fontSize: 16, fontWeight: "700" },
});
