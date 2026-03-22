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

interface CommandResult {
  output: string;
  type: "output" | "error" | "success";
  extraLines?: TerminalLine[];
}

interface CommandHandlerHelpers {
  runDefaultCommand: (cmd: string) => CommandResult;
}

interface TerminalViewProps {
  /**
   * Optional callback for tracking commands (e.g., XP/progress).
   * The built-in command processor will still run and display output.
   */
  onCommand?: (cmd: string) => void;
  commandHandler?: (cmd: string, helpers: CommandHandlerHelpers) => CommandResult | null | void;
  prompt?: string;
  initialLines?: TerminalLine[];
  autoFocus?: boolean;
  disabled?: boolean;
  welcomeMessage?: string;
  initialCwd?: string;
  initialDirectories?: Record<string, string[]>;
  initialFiles?: Record<string, string>;
}

const DEFAULT_DIRECTORIES: Record<string, string[]> = {
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

const DEFAULT_FILES: Record<string, string> = {
  "/home/user/Documents/notes.txt": "Welcome to Linux!\nThis is a text file.\nYou're doing great!\nKeep learning commands.\nPractice makes perfect.",
  "/home/user/Documents/report.txt": "Quarterly Report Q1 2024\nRevenue: $1.2M\nGrowth: 15%\nTeam size: 12",
  "/etc/hostname": "terminal-quest",
  "/home/user/projects/my-app/index.js": "console.log('Hello World');",
  "/home/user/projects/my-app/package.json": '{"name": "my-app", "version": "1.0.0"}',
};

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function cloneDirectories(directories: Record<string, string[]>) {
  return Object.fromEntries(Object.entries(directories).map(([path, entries]) => [path, [...entries]]));
}

function cloneFiles(files: Record<string, string>) {
  return { ...files };
}

function splitPath(path: string) {
  return path.split("/").filter(Boolean);
}

function getParentPath(path: string) {
  const parts = splitPath(path);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

function getBaseName(path: string) {
  const parts = splitPath(path);
  return parts[parts.length - 1] ?? "";
}

function normalizePath(path: string) {
  const segments = path.split("/");
  const normalized: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }

  return normalized.length ? `/${normalized.join("/")}` : "/";
}

function listDirectoryNames(path: string, directories: Record<string, string[]>) {
  return directories[path] ?? [];
}

export default function TerminalView({
  onCommand,
  commandHandler,
  prompt = "hunter@system:~$",
  initialLines = [],
  autoFocus = true,
  disabled = false,
  welcomeMessage,
  initialCwd = "/home/user",
  initialDirectories,
  initialFiles,
}: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState(initialCwd);
  const [directories, setDirectories] = useState<Record<string, string[]>>(() =>
    cloneDirectories(initialDirectories ?? DEFAULT_DIRECTORIES)
  );
  const [files, setFiles] = useState<Record<string, string>>(() =>
    cloneFiles(initialFiles ?? DEFAULT_FILES)
  );
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setCwd(initialCwd);
    setDirectories(cloneDirectories(initialDirectories ?? DEFAULT_DIRECTORIES));
    setFiles(cloneFiles(initialFiles ?? DEFAULT_FILES));
  }, [initialCwd, initialDirectories, initialFiles]);

  useEffect(() => {
    if (welcomeMessage) {
      setLines([{ id: generateId(), type: "output", text: welcomeMessage }]);
    }
  }, [welcomeMessage]);

  function getPrompt() {
    if (prompt.includes(":~$") || prompt.includes(":/$")) {
      const home = initialCwd.startsWith("/home/") ? initialCwd.split("/").slice(0, 3).join("/") : "/home/user";
      const display = cwd === home ? "~" : cwd.replace(home, "~");
      const promptBase = prompt.includes(":") ? prompt.slice(0, prompt.lastIndexOf(":")) : "hunter@system";
      return `${promptBase}:${display}$`;
    }
    return prompt;
  }

  function resolvePath(path: string): string {
    const home = initialCwd.startsWith("/home/") ? initialCwd.split("/").slice(0, 3).join("/") : "/home/user";
    if (path === "~" || path === "$HOME") return home;
    if (path.startsWith("~/")) return normalizePath(home + path.slice(1));
    if (path.startsWith("/")) return normalizePath(path);
    if (path === "..") {
      const parts = cwd.split("/").filter(Boolean);
      parts.pop();
      return "/" + parts.join("/") || "/";
    }
    if (path === ".") return cwd;
    return normalizePath(cwd === "/" ? "/" + path : cwd + "/" + path);
  }

  function createDirectory(path: string) {
    const parent = getParentPath(path);
    const name = getBaseName(path);

    if (!name) return { ok: false, error: `mkdir: cannot create directory '${path}': Invalid path` };
    if (directories[path] !== undefined || files[path] !== undefined) {
      return { ok: false, error: `mkdir: cannot create directory '${name}': File exists` };
    }
    if (directories[parent] === undefined) {
      return { ok: false, error: `mkdir: cannot create directory '${name}': No such file or directory` };
    }

    setDirectories((prev) => {
      const next = cloneDirectories(prev);
      next[path] = [];
      next[parent] = [...(next[parent] ?? []), name];
      return next;
    });
    return { ok: true };
  }

  function createFile(path: string, content = "") {
    const parent = getParentPath(path);
    const name = getBaseName(path);

    if (!name) return { ok: false, error: `touch: cannot touch '${path}': Invalid path` };
    if (directories[parent] === undefined) {
      return { ok: false, error: `touch: cannot touch '${name}': No such file or directory` };
    }

    setFiles((prev) => ({ ...prev, [path]: prev[path] ?? content }));
    if (!listDirectoryNames(parent, directories).includes(name)) {
      setDirectories((prev) => {
        const next = cloneDirectories(prev);
        next[parent] = [...(next[parent] ?? []), name];
        return next;
      });
    }
    return { ok: true };
  }

  function removePath(path: string) {
    const name = getBaseName(path);
    const parent = getParentPath(path);

    if (files[path] !== undefined) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[path];
        return next;
      });
      setDirectories((prev) => {
        const next = cloneDirectories(prev);
        next[parent] = (next[parent] ?? []).filter((entry) => entry !== name);
        return next;
      });
      return { ok: true };
    }

    if (directories[path] !== undefined) {
      if ((directories[path] ?? []).length > 0) {
        return { ok: false, error: `rm: cannot remove '${name}': Directory not empty` };
      }
      setDirectories((prev) => {
        const next = cloneDirectories(prev);
        delete next[path];
        next[parent] = (next[parent] ?? []).filter((entry) => entry !== name);
        return next;
      });
      return { ok: true };
    }

    return { ok: false, error: `rm: cannot remove '${name}': No such file or directory` };
  }

  function copyFile(source: string, destination: string) {
    if (files[source] === undefined) {
      return { ok: false, error: `cp: cannot stat '${getBaseName(source)}': No such file or directory` };
    }
    const created = createFile(destination, files[source]);
    if (!created.ok) return created;
    setFiles((prev) => ({ ...prev, [destination]: files[source] }));
    return { ok: true };
  }

  function moveFile(source: string, destination: string) {
    if (files[source] === undefined) {
      return { ok: false, error: `mv: cannot stat '${getBaseName(source)}': No such file or directory` };
    }

    const sourceParent = getParentPath(source);
    const sourceName = getBaseName(source);
    const destParent = getParentPath(destination);
    const destName = getBaseName(destination);

    if (directories[destParent] === undefined) {
      return { ok: false, error: `mv: cannot move to '${destName}': No such file or directory` };
    }

    const sourceContent = files[source];
    setFiles((prev) => {
      const next = { ...prev };
      delete next[source];
      next[destination] = sourceContent;
      return next;
    });
    setDirectories((prev) => {
      const next = cloneDirectories(prev);
      next[sourceParent] = (next[sourceParent] ?? []).filter((entry) => entry !== sourceName);
      if (!(next[destParent] ?? []).includes(destName)) {
        next[destParent] = [...(next[destParent] ?? []), destName];
      }
      return next;
    });
    return { ok: true };
  }

  function writeRedirectedFile(destination: string, content: string, append: boolean) {
    const parent = getParentPath(destination);
    const name = getBaseName(destination);
    if (directories[parent] === undefined) {
      return { ok: false, error: `cannot write '${name}': No such file or directory` };
    }

    setFiles((prev) => ({
      ...prev,
      [destination]: append && prev[destination] ? `${prev[destination]}\n${content}` : content,
    }));
    if (!listDirectoryNames(parent, directories).includes(name)) {
      setDirectories((prev) => {
        const next = cloneDirectories(prev);
        next[parent] = [...(next[parent] ?? []), name];
        return next;
      });
    }
    return { ok: true };
  }

  function processCommand(cmd: string): CommandResult {
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
        const contents = directories[path];
        if (contents === undefined) return { output: `ls: cannot access '${targetPath ?? path}': No such file or directory`, type: "error" };
        if (showAll) {
          const items = contents.map((item) => {
            const fullPath = path === "/" ? "/" + item : path + "/" + item;
            const isDir = directories[fullPath] !== undefined;
            return `${isDir ? "d" : "-"}rwxr-xr-x  1 user user  4096 Jan 15 10:00 ${item}`;
          });
          return { output: items.join("\n") || "(empty)", type: "output" };
        }
        return { output: contents.join("  ") || "(empty)", type: "output" };
      }

      case "cd": {
        if (args.length === 0 || args[0] === "~") {
          setCwd(resolvePath("~"));
          return { output: "", type: "output" };
        }
        const target = resolvePath(args[0]);
        if (directories[target] !== undefined) {
          setCwd(target);
          return { output: "", type: "output" };
        }
        return { output: `cd: no such file or directory: ${args[0]}`, type: "error" };
      }

      case "cat": {
        if (args.length === 0) return { output: "cat: missing file operand", type: "error" };
        const filePath = resolvePath(args[0]);
        const content = files[filePath];
        if (content !== undefined) return { output: content, type: "output" };
        return { output: `cat: ${args[0]}: No such file or directory`, type: "error" };
      }

      case "head": {
        if (args.length === 0) return { output: "head: missing file operand", type: "error" };
        const file = args.find((a) => !a.startsWith("-")) || "";
        const filePath = resolvePath(file);
        const content = files[filePath];
        if (content !== undefined) {
          const lineCount = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 3 : 3;
          return { output: content.split("\n").slice(0, lineCount).join("\n"), type: "output" };
        }
        return { output: `head: ${file}: No such file or directory`, type: "error" };
      }

      case "tail": {
        if (args.length === 0) return { output: "tail: missing file operand", type: "error" };
        const file = args.find((a) => !a.startsWith("-")) || "";
        const filePath = resolvePath(file);
        const content = files[filePath];
        if (content !== undefined) {
          const lineCount = args.includes("-n") ? parseInt(args[args.indexOf("-n") + 1]) || 3 : 3;
          const allLines = content.split("\n");
          return { output: allLines.slice(-lineCount).join("\n"), type: "output" };
        }
        return { output: `tail: ${file}: No such file or directory`, type: "error" };
      }

      case "echo": {
        const appendRedirectIndex = args.findIndex((arg) => arg === ">>");
        const redirectIndex = args.findIndex((arg) => arg === ">");
        if (appendRedirectIndex !== -1 || redirectIndex !== -1) {
          const index = appendRedirectIndex !== -1 ? appendRedirectIndex : redirectIndex;
          const destination = args[index + 1];
          if (!destination) return { output: "echo: missing redirect target", type: "error" };
          const text = args
            .slice(0, index)
            .join(" ")
            .replace(/\$HOME/g, resolvePath("~"))
            .replace(/\$USER/g, "user");
          const write = writeRedirectedFile(resolvePath(destination), text, appendRedirectIndex !== -1);
          return write.ok ? { output: "", type: "success" } : { output: `echo: ${write.error}`, type: "error" };
        }
        const text = args.join(" ").replace(/\$HOME/g, "/home/user").replace(/\$USER/g, "user");
        return { output: text, type: "output" };
      }

      case "whoami":
        return { output: "user", type: "output" };

      case "mkdir":
        if (args.length === 0) return { output: "mkdir: missing operand", type: "error" };
        {
          const result = createDirectory(resolvePath(args[0]));
          return result.ok ? { output: "", type: "success" } : { output: result.error, type: "error" };
        }

      case "touch":
        if (args.length === 0) return { output: "touch: missing file operand", type: "error" };
        {
          const result = createFile(resolvePath(args[0]));
          return result.ok ? { output: "", type: "success" } : { output: result.error, type: "error" };
        }

      case "rm":
        if (args.length === 0) return { output: "rm: missing operand", type: "error" };
        {
          const result = removePath(resolvePath(args[0]));
          return result.ok ? { output: "", type: "success" } : { output: result.error, type: "error" };
        }

      case "cp":
        if (args.length < 2) return { output: "cp: missing destination file operand", type: "error" };
        {
          const result = copyFile(resolvePath(args[0]), resolvePath(args[1]));
          return result.ok ? { output: "", type: "success" } : { output: result.error, type: "error" };
        }

      case "mv":
        if (args.length < 2) return { output: "mv: missing destination file operand", type: "error" };
        {
          const result = moveFile(resolvePath(args[0]), resolvePath(args[1]));
          return result.ok ? { output: "", type: "success" } : { output: result.error, type: "error" };
        }

      case "chmod":
        if (args.length < 2) return { output: "chmod: missing operand", type: "error" };
        return { output: "", type: "success" };

      case "grep": {
        if (args.length < 2) return { output: "grep: missing operand", type: "error" };
        const pattern = args[0];
        const file = args[1];
        const content = files[resolvePath(file)];
        if (content === undefined) return { output: `grep: ${file}: No such file or directory`, type: "error" };
        const matches = content
          .split("\n")
          .filter((line) => line.toLowerCase().includes(pattern.toLowerCase()));
        return { output: matches.join("\n") || "", type: "output" };
      }

      case "wc": {
        if (args.length === 0) return { output: "wc: missing operand", type: "error" };
        const file = args.find((a) => !a.startsWith("-")) || "";
        const content = files[resolvePath(file)];
        if (content === undefined) return { output: `wc: ${file}: No such file or directory`, type: "error" };
        const lines = content.split("\n").length;
        const words = content.trim() ? content.trim().split(/\s+/).length : 0;
        const chars = content.length;
        if (args.includes("-l")) {
          return { output: `${lines} ${file}`, type: "output" };
        }
        return { output: `${lines} ${words} ${chars} ${file}`, type: "output" };
      }

      case "sort":
        if (args.length === 0) return { output: "sort: missing operand", type: "error" };
        {
          const file = args.find((a) => !a.startsWith("-")) || "";
          const content = files[resolvePath(file)];
          if (content === undefined) return { output: `sort: ${file}: No such file or directory`, type: "error" };
          const sorted = [...content.split("\n")].sort();
          if (args.includes("-r")) sorted.reverse();
          return { output: sorted.join("\n"), type: "output" };
        }

      case "find":
        {
          const startPath = args[0] && !args[0].startsWith("-") ? resolvePath(args[0]) : cwd;
          const nameIndex = args.findIndex((arg) => arg === "-name");
          const pattern = nameIndex !== -1 ? args[nameIndex + 1]?.replace(/^['"]|['"]$/g, "") : undefined;
          const allPaths = [...Object.keys(directories), ...Object.keys(files)]
            .filter((path) => path.startsWith(startPath) && path !== startPath)
            .filter((path) => (pattern ? getBaseName(path).match(new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`)) : true))
            .map((path) => (path.startsWith(cwd) ? `.${path.slice(cwd.length) || "/"}` : path));
          return { output: allPaths.join("\n"), type: "output" };
        }

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

    const result =
      commandHandler?.(trimmed, { runDefaultCommand: processCommand }) ?? processCommand(trimmed);
    if (result.output) {
      newLines.push({ id: generateId(), type: result.type, text: result.output });
    }
    if (result.extraLines?.length) {
      newLines.push(
        ...result.extraLines.map((line) => ({
          ...line,
          id: line.id || generateId(),
        }))
      );
    }

    if (onCommand) {
      onCommand(trimmed);
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
        {lines.length === 0 ? <Text style={[styles.line, styles.idlePrompt]}>{getPrompt()}</Text> : null}
        {lines.map((line) => (
          line.type === "input" ? (
            <Text key={line.id} style={styles.line}>
              <Text style={styles.promptText}>{getPrompt()} </Text>
              <Text style={styles.inputLine}>
                {line.text.slice(getPrompt().length + 1)}
              </Text>
            </Text>
          ) : (
            <Text
              key={line.id}
              style={[
                styles.line,
                line.type === "error" && styles.errorLine,
                line.type === "success" && styles.successLine,
              ]}
            >
              {line.text}
            </Text>
          )
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
  idlePrompt: {
    color: Colors.accent,
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
  promptText: {
    color: Colors.accent,
  },
  input: {
    flex: 1,
    fontFamily: monoFont,
    fontSize: 13,
    color: Colors.terminalGreen,
    padding: 0,
    margin: 0,
    minHeight: 20,
  },
});
