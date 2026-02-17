import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import TerminalView from "@/components/TerminalView";

export default function TrainingGround() {
  const insets = useSafeAreaInsets();
  const { addTerminalCommand } = useProgress();
  const webTop = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + webTop + 8 }]}>
        <Ionicons name="terminal" size={22} color={Colors.terminalGreen} />
        <Text style={styles.headerTitle}>Training Ground</Text>
        <Text style={styles.headerSubtitle}>Practice freely</Text>
      </View>
      <View style={styles.terminalWrap}>
        <TerminalView
          welcomeMessage={"hunter@system:~$ Welcome, Hunter.\nType 'help' for available commands.\n"}
          prompt="hunter@system:~$"
          onCommand={(cmd) => {
            addTerminalCommand(cmd);
            return null;
          }}
        />
      </View>
      <View
        style={[
          styles.footer,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 : Math.max(insets.bottom, 16) + 50,
          },
        ]}
      >
        <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
        <Text style={styles.footerText}>
          Each command counts toward daily quests
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: { color: Colors.terminalGreen, fontSize: 18, fontWeight: "700" },
  headerSubtitle: { color: Colors.textSecondary, fontSize: 12, marginLeft: "auto" },
  terminalWrap: { flex: 1, marginHorizontal: 12, marginBottom: 8 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  footerText: { fontSize: 12, color: Colors.textMuted },
});
