import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
} from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface TerminalLine {
  id: string;
  type: "input" | "output" | "error" | "success";
  text: string;
}

interface TerminalViewProps {
  onCommand?: (cmd: string) => string | null;
  prompt?: string;
  initialLines?: TerminalLine[];
  autoFocus?: boolean;
  disabled?: boolean;
  welcomeMessage?: string;
}

const SIMULATED_FS: Record<string, string[]> = {
  "/": ["home", "etc", "var", "tmp", "usr"],
  "/home": ["user"],
  "/home/user": ["Desktop", "Documents", "Downloads", "Music", "Pictures", "projects"],
  "/home/user/Desktop": [],
  "/home/user/Documents": ["notes.txt", "report.txt"],
  "/home/user/Downloads": ["image.png", "setup.zip"],
  "/home/user/projects": ["my-app", "website"],
  "/home/user/projects/my-app": ["index.js", "package.json"],
  "/etc": ["hostname", "passwd"],
  "/tmp": ["temp.log"],
};

const FILE_CONTENTS: Record<string, string> = {
  "/home/user/Documents/notes.txt": "Welcome to Linux!\nThis is a text file.\nYou're doing great!\nKeep learning commands.\nPractice makes perfect.",
  "/home/user/Documents/report.txt": "Quarterly Report Q1 2024\nRevenue: $1.2M\nGrowth: 15%\nTeam size: 12",
  "/etc/hostname": "terminal-quest",
  "/home/user/projects/my-app/index.js": "console.log('Hello World');",
  "/home/user/projects/my-app/package.json": '{"name": "my-app", "version": "1.0.0"}',
};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function TerminalView({
  onCommand,
  prompt = "hunter@system:~$",
  initialLines = [],
  autoFocus = true,
  disabled = false,
  welcomeMessage,
}: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState("/home/user");
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (welcomeMessage) {
      setLines([{ id: generateId(), type: "output", text: welcomeMessage }]);
    }
  }, []);

  function getPrompt() {
    const home = "/home/user";
    const display = cwd === home ? "~" : cwd.replace(home, "~");
    return `hunter@system:${display}$`;
  }

  function resolvePath(path: string): string {
    if (path === "~" || path === "$HOME") return "/home/user";
    if (path.startsWith("~/")) return "/home/user" + path.slice(1);
    if (path.startsWith("/")) return path;
    if (path === "..") {
      const parts = cwd.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/") || "/";
    }
    if (path === ".") return cwd;
    return cwd === "/" ? "/" + path : cwd + "/" + path;
  }

  function processCommand(cmd: string): { output: string; type: "output" | "error" | "success" } {
    const trimmed = cmd.trim();
    if (!trimmed) return { output: "", type: "output" };

    const parts = trimmed.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
      case "pwd":
        return { output: cwd, type: "output" };

      case "ls": {
        const showAll = args.includes("-la") || args.includes("-l") || args.includes("-a");
        const targetPath = args.find((a) => !a.startsWith("-"));
        const path = targetPath ? resolvePath(targetPath) : cwd;
        const contents = SIMULATED_FS[path];
        if (!contents && contents !== undefined) return { output: `ls: cannot access '${targetPath}': No such file or directory`, type: "error" };
        if (contents === undefined) return { output: `ls: cannot access '${path}': No such file or directory`, type: "error" };
        if (showAll) {
          const items = contents.map((item) => {
            const fullPath = path === "/" ? "/" + item : path + "/" + item;
            const isDir = SIMULATED_FS[fullPath] !== undefined;
            return `${isDir ? "d" : "-"}rwxr-xr-x  1 user user  4096 Jan 15 10:00 ${item}`;
          });
          return { output: items.join("\n") || "(empty)", type: "output" };
        }
        return { output: contents.join("  ") || "(empty)", type: "output" };
      }

      case "cd": {
        if (args.length === 0 || args[0] === "~") {
          setCwd("/home/user");
          return { output: "", type: "output" };
        }
        const target = resolvePath(args[0]);
        if (SIMULATED_FS[target] !== undefined) {
          setCwd(target);
          return { output: "", type: "output" };
        }
        return { output: `cd: no such file or directory: ${args[0]}`, type: "error" };
      }

      case "cat": {
        if (args.length === 0) return { output: "cat: missing file operand", type: "error" };
        const filePath = resolvePath(args[0]);
        const content = FILE_CONTENTS[filePath];
        if (content) return { output: content, type: "output" };
        return { output: `cat: ${args[0]}: No such file or directory`, type: "error" };
      }

      case "head": {
        if (args.length === 0) return { output: "head: missing file operand", type: "error" };
        const file = args.find((a) => !a.startsWith("-")) || "";
        const filePath = resolvePath(file);
        const content = FILE_CONTENTS[filePath];
        if (content) {
          const lineCount = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 3 : 3;
          return { output: content.split("\n").slice(0, lineCount).join("\n"), type: "output" };
        }
        return { output: `head: ${file}: No such file or directory`, type: "error" };
      }

      case "tail": {
        if (args.length === 0) return { output: "tail: missing file operand", type: "error" };
        const file = args.find((a) => !a.startsWith("-")) || "";
        const filePath = resolvePath(file);
        const content = FILE_CONTENTS[filePath];
        if (content) {
          const lineCount = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 3 : 3;
          const allLines = content.split("\n");
          return { output: allLines.slice(-lineCount).join("\n"), type: "output" };
        }
        return { output: `tail: ${file}: No such file or directory`, type: "error" };
      }

      case "echo": {
        const text = args.join(" ").replace(/\$HOME/g, "/home/user").replace(/\$USER/g, "user");
        return { output: text, type: "output" };
      }

      case "whoami":
        return { output: "user", type: "output" };

      case "mkdir":
        if (args.length === 0) return { output: "mkdir: missing operand", type: "error" };
        return { output: "", type: "success" };

      case "touch":
        if (args.length === 0) return { output: "touch: missing file operand", type: "error" };
        return { output: "", type: "success" };

      case "rm":
        if (args.length === 0) return { output: "rm: missing operand", type: "error" };
        return { output: "", type: "success" };

      case "cp":
        if (args.length < 2) return { output: "cp: missing destination file operand", type: "error" };
        return { output: "", type: "success" };

      case "mv":
        if (args.length < 2) return { output: "mv: missing destination file operand", type: "error" };
        return { output: "", type: "success" };

      case "chmod":
        if (args.length < 2) return { output: "chmod: missing operand", type: "error" };
        return { output: "", type: "success" };

      case "grep": {
        if (args.length < 2) return { output: "grep: missing operand", type: "error" };
        return { output: "Pattern matched in file", type: "output" };
      }

      case "wc": {
        if (args.length === 0) return { output: "wc: missing operand", type: "error" };
        return { output: "42 128 1024 " + (args.find((a) => !a.startsWith("-")) || ""), type: "output" };
      }

      case "sort":
        if (args.length === 0) return { output: "sort: missing operand", type: "error" };
        return { output: "alice\nbob\ncharlie\ndave\neve", type: "output" };

      case "find":
        return { output: "./file1.txt\n./dir/file2.txt\n./notes.txt", type: "output" };

      case "man":
        if (args.length === 0) return { output: "What manual page do you want?", type: "error" };
        return { output: `${args[0].toUpperCase()}(1)\n\nNAME\n    ${args[0]} - ${getManDescription(args[0])}\n\nType 'q' to quit.`, type: "output" };

      case "clear":
        setLines([]);
        return { output: "", type: "output" };

      case "help":
        return {
          output: "Available commands:\n  pwd, ls, cd, cat, head, tail, echo,\n  mkdir, touch, rm, cp, mv, chmod,\n  grep, wc, sort, find, whoami, man,\n  clear, help",
          type: "output",
        };

      default:
        return { output: `${command}: command not found`, type: "error" };
    }
  }

  function getManDescription(cmd: string): string {
    const descs: Record<string, string> = {
      ls: "list directory contents",
      cd: "change the working directory",
      pwd: "print name of current working directory",
      cat: "concatenate files and print on the standard output",
      grep: "print lines that match patterns",
      chmod: "change file mode bits",
    };
    return descs[cmd] || "display information about " + cmd;
  }

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newLines: TerminalLine[] = [...lines];
    newLines.push({ id: generateId(), type: "input", text: `${getPrompt()} ${trimmed}` });

    if (onCommand) {
      const result = onCommand(trimmed);
      if (result !== null) {
        if (result) {
          newLines.push({ id: generateId(), type: "output", text: result });
        }
      }
    } else {
      const result = processCommand(trimmed);
      if (result.output) {
        newLines.push({ id: generateId(), type: result.type, text: result.output });
      }
    }

    setLines(newLines);
    setInput("");

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 50);
  }

  return (
    <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {lines.map((line) => (
          <Text
            key={line.id}
            style={[
              styles.line,
              line.type === "input" && styles.inputLine,
              line.type === "error" && styles.errorLine,
              line.type === "success" && styles.successLine,
            ]}
          >
            {line.text}
          </Text>
        ))}
      </ScrollView>
      <View style={styles.inputRow}>
        <Text style={styles.prompt}>{getPrompt()} </Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={!disabled}
          placeholderTextColor={Colors.textMuted}
          placeholder="type a command..."
          returnKeyType="send"
          blurOnSubmit={false}
          selectionColor={Colors.terminalGreen}
        />
      </View>
    </Pressable>
  );
}

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E14",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 4,
  },
  line: {
    fontFamily: monoFont,
    fontSize: 13,
    lineHeight: 20,
    color: Colors.text,
    marginBottom: 2,
  },
  inputLine: {
    color: Colors.terminalGreen,
  },
  errorLine: {
    color: Colors.error,
  },
  successLine: {
    color: Colors.success,
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
  prompt: {
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
    margin: 0,
  },
});
