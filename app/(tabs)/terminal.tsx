import React from "react";
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView } from "react-native";
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { paddingTop: insets.top + webTop + 8 }]}>
        <Ionicons name="terminal" size={22} color={Colors.terminalGreen} />
        <Text style={styles.headerTitle}>Training Ground</Text>
        <Text style={styles.headerSubtitle}>Practice freely</Text>
      </View>
      <View style={[styles.terminalWrap, { marginBottom: Platform.OS === "web" ? 80 : insets.bottom + 60 }]}>
        <TerminalView
          welcomeMessage={"hunter@system:~$ Welcome, Hunter.\nType 'help' for available commands.\n"}
          prompt="hunter@system:~$"
          onCommand={(cmd) => {
          addTerminalCommand(cmd);
        }}
        />
      </View>
    </KeyboardAvoidingView>
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
  terminalWrap: { flex: 1, marginHorizontal: 12, marginVertical: 8 },
});
