import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Platform, KeyboardAvoidingView, Keyboard } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { useProgress } from "@/lib/progress-context";
import TerminalView from "@/components/TerminalView";

export default function TrainingGround() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { addTerminalCommand } = useProgress();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const webTop = Platform.OS === "web" ? 67 : 0;

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
      <View
        style={[
          styles.terminalWrap,
          {
            paddingBottom:
              Platform.OS === "web"
                ? 18
                : isKeyboardVisible
                ? 0
                : Math.max(tabBarHeight - insets.bottom + 8, 12),
          },
        ]}
      >
        <TerminalView
          welcomeMessage={"hunter@system:~$ Welcome, Hunter.\nType 'help' for available commands.\n"}
          prompt="hunter@system:~$"
          minHeight={320}
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
  terminalWrap: { flex: 1, marginHorizontal: 12, marginTop: 8 },
});
