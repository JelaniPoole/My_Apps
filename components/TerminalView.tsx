import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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
  clearScreen?: boolean;
}

interface CommandHandlerHelpers {
  runDefaultCommand: (cmd: string) => CommandResult;
}

interface TerminalViewProps {
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
  minHeight?: number;
  themeId?: string;
}

interface ShellState {
  cwd: string;
  directories: Record<string, string[]>;
  files: Record<string, string>;
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
  "/home/user/Documents/notes.txt": "Welcome to Linux!\nThis is a text file.\nYou're doing great!",
  "/home/user/Documents/report.txt": "Quarterly Report Q1 2024\nRevenue: $1.2M\nGrowth: 15%",
  "/etc/hostname": "terminal-quest",
  "/home/user/projects/my-app/index.js": "console.log('Hello World');",
  "/home/user/projects/my-app/package.json": '{"name":"my-app","version":"1.0.0"}',
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

function joinPath(parent: string, name: string) {
  return parent === "/" ? `/${name}` : `${parent}/${name}`;
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

function tokenize(command: string) {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  for (let i = 0; i < command.length; i += 1) {
    const char = command[i];
    const next = command[i + 1];
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
      continue;
    }
    if (char === "'" || char === '"') {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    if (char === ">" && next === ">") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(">>");
      i += 1;
      continue;
    }
    if (char === "|" || char === ">") {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function splitByPipe(tokens: string[]) {
  const groups: string[][] = [];
  let current: string[] = [];
  tokens.forEach((token) => {
    if (token === "|") {
      groups.push(current);
      current = [];
    } else {
      current.push(token);
    }
  });
  groups.push(current);
  return groups;
}

function parseLineCount(args: string[], fallback: number) {
  const explicitIndex = args.findIndex((arg) => arg === "-n");
  if (explicitIndex !== -1) return Number.parseInt(args[explicitIndex + 1] ?? "", 10) || fallback;
  const shorthand = args.find((arg) => /^-\d+$/.test(arg));
  if (shorthand) return Number.parseInt(shorthand.slice(1), 10) || fallback;
  return fallback;
}

const monoFont = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

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
  minHeight = 120,
  themeId = "default",
}: TerminalViewProps) {
  const [lines, setLines] = useState<TerminalLine[]>(initialLines);
  const [input, setInput] = useState("");
  const [cwd, setCwd] = useState(initialCwd);
  const [directories, setDirectories] = useState<Record<string, string[]>>(() => cloneDirectories(initialDirectories ?? DEFAULT_DIRECTORIES));
  const [files, setFiles] = useState<Record<string, string>>(() => cloneFiles(initialFiles ?? DEFAULT_FILES));
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const homePath = initialCwd.startsWith("/home/") ? initialCwd.split("/").slice(0, 3).join("/") : "/home/user";
  const userName = getBaseName(homePath) || "user";
  const terminalTheme = getTerminalTheme(themeId);

  useEffect(() => {
    setCwd(initialCwd);
    setDirectories(cloneDirectories(initialDirectories ?? DEFAULT_DIRECTORIES));
    setFiles(cloneFiles(initialFiles ?? DEFAULT_FILES));
  }, [initialCwd, initialDirectories, initialFiles]);

  useEffect(() => {
    if (welcomeMessage) setLines([{ id: generateId(), type: "output", text: welcomeMessage }]);
  }, [welcomeMessage]);

  function getPrompt() {
    if (prompt.includes(":~$") || prompt.includes(":/$")) {
      const display = cwd === homePath ? "~" : cwd.replace(homePath, "~");
      const promptBase = prompt.includes(":") ? prompt.slice(0, prompt.lastIndexOf(":")) : `${userName}@system`;
      return `${promptBase}:${display}$`;
    }
    return prompt;
  }

  function resolvePath(path: string, state: ShellState) {
    if (path === "~" || path === "$HOME") return homePath;
    if (path.startsWith("~/")) return normalizePath(homePath + path.slice(1));
    if (path.startsWith("/")) return normalizePath(path);
    if (path === ".") return state.cwd;
    if (path === "..") return getParentPath(state.cwd);
    return normalizePath(state.cwd === "/" ? `/${path}` : `${state.cwd}/${path}`);
  }

  function ensureDirEntry(state: ShellState, parent: string, name: string) {
    if (!state.directories[parent]) state.directories[parent] = [];
    if (!state.directories[parent].includes(name)) state.directories[parent] = [...state.directories[parent], name];
  }

  function createFile(path: string, state: ShellState, content = "") {
    const parent = getParentPath(path);
    const name = getBaseName(path);
    if (state.directories[parent] === undefined) return { ok: false, error: `touch: cannot touch '${name}': No such file or directory` };
    state.files[path] = state.files[path] ?? content;
    ensureDirEntry(state, parent, name);
    return { ok: true };
  }

  function createDirectory(path: string, state: ShellState) {
    const parent = getParentPath(path);
    const name = getBaseName(path);
    if (state.directories[parent] === undefined) return { ok: false, error: `mkdir: cannot create directory '${name}': No such file or directory` };
    if (state.directories[path] !== undefined || state.files[path] !== undefined) {
      return { ok: false, error: `mkdir: cannot create directory '${name}': File exists` };
    }
    state.directories[path] = [];
    ensureDirEntry(state, parent, name);
    return { ok: true };
  }

  function writeRedirect(path: string, content: string, append: boolean, state: ShellState) {
    const parent = getParentPath(path);
    const name = getBaseName(path);
    if (state.directories[parent] === undefined) return { ok: false, error: `cannot write '${name}': No such file or directory` };
    state.files[path] = append && state.files[path] ? `${state.files[path]}\n${content}` : content;
    ensureDirEntry(state, parent, name);
    return { ok: true };
  }

  function removePath(path: string, state: ShellState) {
    const parent = getParentPath(path);
    const name = getBaseName(path);
    if (state.files[path] !== undefined) {
      delete state.files[path];
      state.directories[parent] = (state.directories[parent] ?? []).filter((entry) => entry !== name);
      return { ok: true };
    }
    if (state.directories[path] !== undefined) {
      if ((state.directories[path] ?? []).length > 0) return { ok: false, error: `rm: cannot remove '${name}': Directory not empty` };
      delete state.directories[path];
      state.directories[parent] = (state.directories[parent] ?? []).filter((entry) => entry !== name);
      return { ok: true };
    }
    return { ok: false, error: `rm: cannot remove '${name}': No such file or directory` };
  }

  function movePath(source: string, destination: string, state: ShellState) {
    const sourceName = getBaseName(source);
    const destParent = getParentPath(destination);
    const destName = getBaseName(destination);
    if (state.directories[destParent] === undefined) return { ok: false, error: `mv: cannot move to '${destName}': No such file or directory` };
    if (state.files[source] === undefined) return { ok: false, error: `mv: cannot stat '${sourceName}': No such file or directory` };
    const sourceParent = getParentPath(source);
    state.files[destination] = state.files[source];
    delete state.files[source];
    state.directories[sourceParent] = (state.directories[sourceParent] ?? []).filter((entry) => entry !== sourceName);
    ensureDirEntry(state, destParent, destName);
    return { ok: true };
  }

  function runSingle(tokens: string[], state: ShellState, stdin = ""): CommandResult {
    if (!tokens.length) return { output: "", type: "output" };
    const command = tokens[0];
    const args = tokens.slice(1);
    switch (command) {
      case "pwd":
        return { output: state.cwd, type: "output" };
      case "ls": {
        const flags = args.filter((arg) => arg.startsWith("-"));
        const targetArg = args.find((arg) => !arg.startsWith("-"));
        const targetPath = targetArg ? resolvePath(targetArg, state) : state.cwd;
        const contents = state.directories[targetPath];
        if (contents === undefined) return { output: `ls: cannot access '${targetArg ?? targetPath}': No such file or directory`, type: "error" };
        const showLong = flags.some((flag) => flag.includes("l"));
        const showAll = flags.some((flag) => flag.includes("a"));
        const onePerLine = flags.some((flag) => flag.includes("1"));
        const entries = [...contents];
        if (showAll) entries.unshift(".", "..");
        if (showLong) {
          return {
            output: entries.map((entry) => {
              const fullPath = entry === "." ? targetPath : entry === ".." ? getParentPath(targetPath) : joinPath(targetPath, entry);
              const isDir = state.directories[fullPath] !== undefined;
              return `${isDir ? "d" : "-"}rwxr-xr-x  1 ${userName} ${userName}  4096 Mar 27 08:00 ${entry}`;
            }).join("\n"),
            type: "output",
          };
        }
        return { output: entries.join(onePerLine ? "\n" : "  ") || "(empty)", type: "output" };
      }
      case "cd": {
        const target = args.length === 0 ? homePath : resolvePath(args[0], state);
        if (state.directories[target] === undefined) return { output: `cd: no such file or directory: ${args[0] ?? "~"}`, type: "error" };
        state.cwd = target;
        return { output: "", type: "output" };
      }
      case "cat": {
        if (!args.length) return stdin ? { output: stdin, type: "output" } : { output: "cat: missing file operand", type: "error" };
        const filePath = resolvePath(args[0], state);
        return state.files[filePath] !== undefined ? { output: state.files[filePath], type: "output" } : { output: `cat: ${args[0]}: No such file or directory`, type: "error" };
      }
      case "head": {
        const count = parseLineCount(args, 10);
        const fileArg = args.find((arg) => !arg.startsWith("-") && !/^\d+$/.test(arg));
        const content = fileArg ? state.files[resolvePath(fileArg, state)] : stdin;
        if (!content) return { output: fileArg ? `head: ${fileArg}: No such file or directory` : "head: missing file operand", type: "error" };
        return { output: content.split("\n").slice(0, count).join("\n"), type: "output" };
      }
      case "tail": {
        const count = parseLineCount(args, 10);
        const fileArg = args.find((arg) => !arg.startsWith("-") && !/^\d+$/.test(arg));
        const content = fileArg ? state.files[resolvePath(fileArg, state)] : stdin;
        if (!content) return { output: fileArg ? `tail: ${fileArg}: No such file or directory` : "tail: missing file operand", type: "error" };
        return { output: content.split("\n").slice(-count).join("\n"), type: "output" };
      }
      case "echo":
        return { output: args.join(" ").replace(/\$HOME/g, homePath).replace(/\$USER/g, userName).replace(/\$PWD/g, state.cwd), type: "output" };
      case "whoami":
        return { output: userName, type: "output" };
      case "mkdir": {
        if (!args.length) return { output: "mkdir: missing operand", type: "error" };
        const result = createDirectory(resolvePath(args[0], state), state);
        return result.ok ? { output: "", type: "success" } : { output: result.error!, type: "error" };
      }
      case "touch": {
        if (!args.length) return { output: "touch: missing file operand", type: "error" };
        const result = createFile(resolvePath(args[0], state), state);
        return result.ok ? { output: "", type: "success" } : { output: result.error!, type: "error" };
      }
      case "rm": {
        if (!args.length) return { output: "rm: missing operand", type: "error" };
        const result = removePath(resolvePath(args[0], state), state);
        return result.ok ? { output: "", type: "success" } : { output: result.error!, type: "error" };
      }
      case "cp": {
        if (args.length < 2) return { output: "cp: missing destination file operand", type: "error" };
        const sourcePath = resolvePath(args[0], state);
        if (state.files[sourcePath] === undefined) return { output: `cp: cannot stat '${args[0]}': No such file or directory`, type: "error" };
        const result = createFile(resolvePath(args[1], state), state, state.files[sourcePath]);
        return result.ok ? { output: "", type: "success" } : { output: result.error!, type: "error" };
      }
      case "mv": {
        if (args.length < 2) return { output: "mv: missing destination file operand", type: "error" };
        const result = movePath(resolvePath(args[0], state), resolvePath(args[1], state), state);
        return result.ok ? { output: "", type: "success" } : { output: result.error!, type: "error" };
      }
      case "chmod":
        return args.length < 2 ? { output: "chmod: missing operand", type: "error" } : { output: "", type: "success" };
      case "grep": {
        if (!args.length) return { output: "grep: missing pattern", type: "error" };
        const pattern = args[0];
        const fileArg = args[1];
        const content = fileArg ? state.files[resolvePath(fileArg, state)] : stdin;
        if (!content) return { output: fileArg ? `grep: ${fileArg}: No such file or directory` : "grep: missing input", type: "error" };
        return { output: content.split("\n").filter((line) => line.toLowerCase().includes(pattern.toLowerCase())).join("\n"), type: "output" };
      }
      case "wc": {
        const fileArg = args.find((arg) => !arg.startsWith("-"));
        const content = fileArg ? state.files[resolvePath(fileArg, state)] : stdin;
        if (!content) return { output: fileArg ? `wc: ${fileArg}: No such file or directory` : "wc: missing operand", type: "error" };
        const linesCount = content.split("\n").length;
        const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        const charsCount = content.length;
        if (args.includes("-l")) return { output: fileArg ? `${linesCount} ${fileArg}` : `${linesCount}`, type: "output" };
        return { output: fileArg ? `${linesCount} ${wordsCount} ${charsCount} ${fileArg}` : `${linesCount} ${wordsCount} ${charsCount}`, type: "output" };
      }
      case "sort": {
        const reverse = args.includes("-r");
        const fileArg = args.find((arg) => !arg.startsWith("-"));
        const content = fileArg ? state.files[resolvePath(fileArg, state)] : stdin;
        if (!content) return { output: fileArg ? `sort: ${fileArg}: No such file or directory` : "sort: missing operand", type: "error" };
        const sorted = [...content.split("\n")].sort();
        if (reverse) sorted.reverse();
        return { output: sorted.join("\n"), type: "output" };
      }
      case "find": {
        const startArg = args[0] && !args[0].startsWith("-") ? args[0] : ".";
        const startPath = resolvePath(startArg, state);
        const nameIndex = args.findIndex((arg) => arg === "-name");
        const pattern = nameIndex !== -1 ? args[nameIndex + 1]?.replace(/^['"]|['"]$/g, "") : undefined;
        const regex = pattern ? new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`) : null;
        const allPaths = [...Object.keys(state.directories), ...Object.keys(state.files)]
          .filter((path) => path.startsWith(startPath) && path !== startPath)
          .filter((path) => (regex ? regex.test(getBaseName(path)) : true))
          .map((path) => (path.startsWith(state.cwd) ? `.${path.slice(state.cwd.length) || "/"}` : path));
        return { output: allPaths.join("\n"), type: "output" };
      }
      case "man":
        return !args.length ? { output: "What manual page do you want?", type: "error" } : { output: `${args[0].toUpperCase()}(1)\n\nNAME\n    ${args[0]} - display information about ${args[0]}\n\nType 'q' to quit.`, type: "output" };
      case "clear":
        return { output: "", type: "output", clearScreen: true };
      case "help":
        return { output: "Available commands:\n  pwd, ls, cd, cat, head, tail, echo,\n  mkdir, touch, rm, cp, mv, chmod,\n  grep, wc, sort, find, man, history, which,\n  ps, kill, df, du, free, uptime,\n  ping, curl, wget, apt, git, journalctl,\n  clear, help", type: "output" };
      case "history": {
        const history = [...lines.filter((line) => line.type === "input").map((line) => line.text.slice(getPrompt().length + 1))];
        return { output: history.map((item, index) => `${String(index + 1).padStart(4, " ")}  ${item}`).join("\n"), type: "output" };
      }
      case "which":
        return !args[0] ? { output: "which: missing command name", type: "error" } : { output: `/usr/bin/${args[0]}`, type: "output" };
      case "ps":
        return { output: "USER       PID %CPU %MEM COMMAND\nhunter    1234  2.1  0.3 python bot.py\nhunter    2451  0.4  0.1 node server.js", type: "output" };
      case "kill":
        return !args[0] ? { output: "kill: usage: kill [pid]", type: "error" } : { output: "", type: "success" };
      case "df":
        return { output: "Filesystem      Size  Used Avail Use%\n/dev/sda1        80G   52G   24G  69%", type: "output" };
      case "du":
        return { output: "1.2M ./maps\n640K ./logs", type: "output" };
      case "free":
        return { output: "              total        used        free\nMem:           7.7Gi       2.3Gi       4.1Gi", type: "output" };
      case "uptime":
        return { output: "08:42:10 up 5 days,  3:17,  2 users,  load average: 0.21, 0.18, 0.14", type: "output" };
      case "ping":
        return !args[0] ? { output: "ping: missing host operand", type: "error" } : { output: `64 bytes from ${args[0]}: icmp_seq=1 ttl=57 time=12.4 ms`, type: "output" };
      case "curl":
        return !args[0] ? { output: "curl: no URL specified", type: "error" } : { output: "<html>\n  <title>Example Domain</title>\n</html>", type: "output" };
      case "wget":
        return !args[0] ? { output: "wget: missing URL", type: "error" } : { output: `Saving to: '${getBaseName(args[0]) || "download"}'\n${getBaseName(args[0]) || "download"} saved`, type: "output" };
      case "apt":
        switch (args[0]) {
          case "update":
            return { output: "Hit:1 main repository\nReading package lists... Done", type: "output" };
          case "install":
            return { output: `Installing ${args[1] ?? "package"}...\nDone`, type: "output" };
          case "upgrade":
            return { output: "Upgrading packages...\nDone", type: "output" };
          case "autoremove":
            return { output: "Removing unused packages...\nDone", type: "output" };
          default:
            return { output: "", type: "success" };
        }
      case "git":
        switch (args[0]) {
          case "status":
            return { output: "On branch main\nChanges not staged for commit:\n  modified: quest.log", type: "output" };
          case "log":
            return { output: "9be41ad Fix login retry\n31fa2ce Add raid rewards\n8bc102f Initial commit", type: "output" };
          case "diff":
            return { output: "diff --git a/quest.log b/quest.log\n+Defeat the cave troll", type: "output" };
          case "add":
            return { output: "", type: "success" };
          case "branch":
            return { output: "* main\n  feature/ui-refresh\n  hotfix/login", type: "output" };
          default:
            return { output: "", type: "success" };
        }
      case "journalctl":
        return args[0] === "-u" && args[1] ? { output: `Mar 27 08:10 ${args[1]}[221]: Starting worker process\nMar 27 08:11 ${args[1]}[221]: Ready for connections`, type: "output" } : { output: "Mar 27 08:10 systemd[1]: Started training target.", type: "output" };
      case "tee": {
        if (!args[0]) return { output: "tee: missing file operand", type: "error" };
        const write = writeRedirect(resolvePath(args[0], state), stdin, false, state);
        return write.ok ? { output: stdin, type: "output" } : { output: write.error!, type: "error" };
      }
      default:
        return { output: `${command}: command not found`, type: "error" };
    }
  }

  function runPipeline(command: string): CommandResult {
    const state: ShellState = {
      cwd,
      directories: cloneDirectories(directories),
      files: cloneFiles(files),
    };
    const tokens = tokenize(command);
    const redirectIndex = tokens.findIndex((token) => token === ">" || token === ">>");
    const redirectTarget = redirectIndex !== -1 ? tokens[redirectIndex + 1] : null;
    const append = redirectIndex !== -1 && tokens[redirectIndex] === ">>";
    const executionTokens = redirectIndex !== -1 ? tokens.slice(0, redirectIndex) : tokens;
    const stages = splitByPipe(executionTokens);
    let stdin = "";
    let lastResult: CommandResult = { output: "", type: "output" };
    for (const stage of stages) {
      lastResult = runSingle(stage, state, stdin);
      if (lastResult.type === "error" || lastResult.clearScreen) break;
      stdin = lastResult.output;
    }
    if (!lastResult.clearScreen && lastResult.type !== "error" && redirectTarget) {
      const write = writeRedirect(resolvePath(redirectTarget, state), stdin, append, state);
      lastResult = write.ok ? { output: "", type: "success" } : { output: write.error!, type: "error" };
    }
    setCwd(state.cwd);
    setDirectories(state.directories);
    setFiles(state.files);
    return lastResult.clearScreen ? lastResult : { ...lastResult, output: redirectTarget ? lastResult.output : stdin || lastResult.output };
  }

  function processCommand(cmd: string): CommandResult {
    const trimmed = cmd.trim();
    if (!trimmed) return { output: "", type: "output" };
    return runPipeline(trimmed);
  }

  function handleSubmit() {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = commandHandler?.(trimmed, { runDefaultCommand: processCommand }) ?? processCommand(trimmed);
    const nextLines: TerminalLine[] = result.clearScreen ? [] : [...lines, { id: generateId(), type: "input", text: `${getPrompt()} ${trimmed}` }];
    if (result.output) nextLines.push({ id: generateId(), type: result.type, text: result.output });
    if (result.extraLines?.length) nextLines.push(...result.extraLines.map((line) => ({ ...line, id: line.id || generateId() })));
    if (onCommand) onCommand(trimmed);
    setLines(nextLines);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }

  return (
    <Pressable
      style={[styles.container, { minHeight, backgroundColor: terminalTheme.background, borderColor: terminalTheme.border }]}
      onPress={() => inputRef.current?.focus()}
    >
      <ScrollView
        ref={scrollRef}
        style={[styles.scrollView, { backgroundColor: terminalTheme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {lines.length === 0 ? <Text style={[styles.line, { color: terminalTheme.prompt }]}>{getPrompt()}</Text> : null}
        {lines.map((line) =>
          line.type === "input" ? (
            <Text key={line.id} style={styles.line}>
              <Text style={[styles.promptText, { color: terminalTheme.prompt }]}>{getPrompt()} </Text>
              <Text style={[styles.inputLine, { color: terminalTheme.input }]}>{line.text.slice(getPrompt().length + 1)}</Text>
            </Text>
          ) : (
            <Text
              key={line.id}
              style={[
                styles.line,
                { color: terminalTheme.output },
                line.type === "error" && { color: terminalTheme.error },
                line.type === "success" && { color: terminalTheme.success },
              ]}
            >
              {line.text}
            </Text>
          ),
        )}
      </ScrollView>
      <View style={[styles.inputRow, { borderTopColor: terminalTheme.border, backgroundColor: terminalTheme.inputBg }]}>
        <Text style={[styles.prompt, { color: terminalTheme.prompt }]}>{getPrompt()} </Text>
        <TextInput
          ref={inputRef}
          style={[styles.input, { color: terminalTheme.input }]}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSubmit}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={!disabled}
          placeholderTextColor={terminalTheme.placeholder}
          placeholder="type a command..."
          returnKeyType="send"
          blurOnSubmit={false}
          selectionColor={terminalTheme.input}
        />
      </View>
    </Pressable>
  );
}

function getTerminalTheme(themeId: string) {
  switch (themeId) {
    case "shadowcore":
      return {
        background: "#090811",
        inputBg: "#110F1B",
        border: "#352759",
        prompt: "#64D2FF",
        input: "#B794F4",
        output: Colors.text,
        error: Colors.error,
        success: "#FFB800",
        placeholder: "#5E5578",
      };
    case "frostbyte":
      return {
        background: "#07131A",
        inputBg: "#0B1C24",
        border: "#1E5362",
        prompt: "#8BE9FD",
        input: "#64D2FF",
        output: "#DDF7FF",
        error: "#FF7A8A",
        success: "#9EF98D",
        placeholder: "#5D8592",
      };
    case "emberline":
      return {
        background: "#140B09",
        inputBg: "#1E110E",
        border: "#5B2F24",
        prompt: "#FFB800",
        input: "#FF8A5B",
        output: "#FFE9DE",
        error: "#FF6B7D",
        success: "#FFD36B",
        placeholder: "#8C6358",
      };
    default:
      return {
        background: "#0A0E14",
        inputBg: "#080C12",
        border: Colors.border,
        prompt: Colors.accent,
        input: Colors.terminalGreen,
        output: Colors.text,
        error: Colors.error,
        success: Colors.warning,
        placeholder: Colors.textMuted,
      };
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0A0E14",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  scrollView: {},
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
