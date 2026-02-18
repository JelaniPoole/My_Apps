import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
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
  const { completedLessons, completeLesson, addXp, addStat } = useProgress();
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showComplete, setShowComplete] = useState(false);

  function handleCommand(cmd: string) {
    if (!activeLesson) return "";
    const step = activeLesson.steps[currentStep];
    if (!step) return "";

    const trimmed = cmd.trim().toLowerCase();
    const expected = step.expectedCommand.toLowerCase();

    if (trimmed === expected) {
      const output = step.output;
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
      return output ? output + "\n" + step.successMessage : step.successMessage;
    }
    return `Command not recognized. ${step.hint}`;
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <View style={[styles.dungeonHeader, { paddingTop: insets.top + webTop + 8 }]}>
          <Pressable onPress={closeDungeon} hitSlop={16}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </Pressable>
          <View style={styles.dungeonHeaderCenter}>
            <Text style={styles.dungeonHeaderTitle}>{activeLesson.dungeonName}</Text>
            <Text style={styles.floorText}>
              Floor {currentStep + 1}/{activeLesson.steps.length}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

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

        <View style={styles.instructionCard}>
          <Ionicons name="alert-circle" size={18} color={Colors.accent} />
          <Text style={styles.instructionText}>{step?.instruction}</Text>
        </View>

        <View style={styles.terminalWrap}>
          <TerminalView onCommand={handleCommand} />
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
        contentContainerStyle={{ paddingBottom: Platform.OS === "web" ? 34 : 20, paddingTop: insets.top + webTop }}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dungeonHeaderCenter: { flex: 1, alignItems: "center" },
  dungeonHeaderTitle: { color: Colors.text, fontSize: 16, fontWeight: "700" },
  floorText: { color: Colors.textSecondary, fontSize: 12 },

  floorProgress: { flexDirection: "row", justifyContent: "center", gap: 6, paddingVertical: 12 },
  floorDot: { width: 10, height: 10, borderRadius: 5 },
  floorCleared: { backgroundColor: Colors.success },
  floorCurrent: { backgroundColor: Colors.accent },
  floorLocked: { backgroundColor: Colors.border },

  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.accent + "30",
  },
  instructionText: { flex: 1, color: Colors.text, fontSize: 14, lineHeight: 20 },

  terminalWrap: { flex: 1, margin: 16 },

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
