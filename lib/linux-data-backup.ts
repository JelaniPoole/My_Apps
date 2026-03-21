export interface Command {
  name: string;
  syntax: string;
  description: string;
  examples: string[];
  category: string;
  statType: "STR" | "INT" | "AGI" | "VIT" | "DEF";
}

export interface LessonStep {
  instruction: string;
  expectedCommand: string;
  hint: string;
  successMessage: string;
  output: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  statReward: { type: "STR" | "INT" | "AGI" | "VIT" | "DEF"; amount: number };
  steps: LessonStep[];
  difficulty: "E" | "D" | "C" | "B" | "A";
  dungeonName: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  statReward: { type: "STR" | "INT" | "AGI" | "VIT" | "DEF"; amount: number };
  difficulty: "E" | "D" | "C" | "B" | "A";
  task: string;
  hints: string[];
  acceptedCommands: string[];
  output: string;
  bossName: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  type: "lesson" | "challenge" | "terminal" | "any";
  target: number;
}

export const RANKS = [
  { rank: "E", title: "E-Rank Hunter", minLevel: 1, color: "#808080" },
  { rank: "D", title: "D-Rank Hunter", minLevel: 5, color: "#4DA6FF" },
  { rank: "C", title: "C-Rank Hunter", minLevel: 10, color: "#39FF14" },
  { rank: "B", title: "B-Rank Hunter", minLevel: 15, color: "#FFB800" },
  { rank: "A", title: "A-Rank Hunter", minLevel: 25, color: "#FF6B35" },
  { rank: "S", title: "S-Rank Hunter", minLevel: 40, color: "#FF2D55" },
];

export function getRank(level: number) {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (level >= r.minLevel) current = r;
  }
  return current;
}

export function getNextRank(level: number) {
  const current = getRank(level);
  const idx = RANKS.indexOf(current);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

export const DAILY_QUESTS: DailyQuest[] = [
  { id: "dq1", title: "Clear 1 Dungeon", description: "Complete any lesson", xpReward: 25, type: "lesson", target: 1 },
  { id: "dq2", title: "Defeat 1 Boss", description: "Complete any challenge", xpReward: 30, type: "challenge", target: 1 },
  { id: "dq3", title: "Run 10 Commands", description: "Practice in the training ground", xpReward: 20, type: "terminal", target: 10 },
  { id: "dq4", title: "Clear 2 Dungeons", description: "Complete 2 lessons", xpReward: 50, type: "lesson", target: 2 },
  { id: "dq5", title: "Defeat 2 Bosses", description: "Complete 2 challenges", xpReward: 60, type: "challenge", target: 2 },
  { id: "dq6", title: "Run 25 Commands", description: "Heavy training session", xpReward: 40, type: "terminal", target: 25 },
];

export function getDailyQuests(dateStr: string): DailyQuest[] {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % 3;
  return [
    DAILY_QUESTS[idx],
    DAILY_QUESTS[idx + 3],
    { id: "dq_streak", title: "Stay Active", description: "Open the app today", xpReward: 10, type: "any", target: 1 },
  ];
}

export const commands: Command[] = [
  { name: "pwd", syntax: "pwd", description: "Print working directory", examples: ["pwd"], category: "Navigation", statType: "AGI" },
  { name: "ls", syntax: "ls [options] [path]", description: "List directory contents", examples: ["ls", "ls -la", "ls /home"], category: "Navigation", statType: "AGI" },
  { name: "cd", syntax: "cd [directory]", description: "Change directory", examples: ["cd /home", "cd ..", "cd ~"], category: "Navigation", statType: "AGI" },
  { name: "mkdir", syntax: "mkdir [directory]", description: "Create a new directory", examples: ["mkdir projects", "mkdir -p a/b/c"], category: "Files", statType: "STR" },
  { name: "touch", syntax: "touch [file]", description: "Create an empty file", examples: ["touch notes.txt", "touch index.html"], category: "Files", statType: "STR" },
  { name: "rm", syntax: "rm [options] [file]", description: "Remove files or directories", examples: ["rm file.txt", "rm -r folder"], category: "Files", statType: "STR" },
  { name: "cp", syntax: "cp [source] [dest]", description: "Copy files or directories", examples: ["cp file.txt backup.txt", "cp -r src dest"], category: "Files", statType: "STR" },
  { name: "mv", syntax: "mv [source] [dest]", description: "Move or rename files", examples: ["mv old.txt new.txt", "mv file.txt /tmp/"], category: "Files", statType: "STR" },
  { name: "cat", syntax: "cat [file]", description: "Display file contents", examples: ["cat readme.txt"], category: "Viewing", statType: "INT" },
  { name: "echo", syntax: "echo [text]", description: "Print text to terminal", examples: ["echo Hello", "echo $HOME"], category: "Basics", statType: "VIT" },
  { name: "grep", syntax: "grep [pattern] [file]", description: "Search for patterns in files", examples: ["grep error log.txt"], category: "Text", statType: "INT" },
  { name: "chmod", syntax: "chmod [mode] [file]", description: "Change file permissions", examples: ["chmod 755 script.sh", "chmod +x run.sh"], category: "Permissions", statType: "DEF" },
  { name: "whoami", syntax: "whoami", description: "Display current username", examples: ["whoami"], category: "System", statType: "VIT" },
  { name: "head", syntax: "head [options] [file]", description: "Display first lines of a file", examples: ["head file.txt"], category: "Viewing", statType: "INT" },
  { name: "tail", syntax: "tail [options] [file]", description: "Display last lines of a file", examples: ["tail file.txt"], category: "Viewing", statType: "INT" },
  { name: "wc", syntax: "wc [options] [file]", description: "Count lines, words, characters", examples: ["wc file.txt", "wc -l log.txt"], category: "Text", statType: "INT" },
  { name: "sort", syntax: "sort [options] [file]", description: "Sort lines of text", examples: ["sort names.txt"], category: "Text", statType: "INT" },
  { name: "find", syntax: "find [path] [expression]", description: "Search for files", examples: ["find . -name '*.txt'"], category: "Navigation", statType: "AGI" },
  { name: "clear", syntax: "clear", description: "Clear the terminal screen", examples: ["clear"], category: "Basics", statType: "VIT" },
  { name: "man", syntax: "man [command]", description: "Display manual page", examples: ["man ls"], category: "Basics", statType: "VIT" },
];

export const lessons: Lesson[] = []; // Backup only - no lessons data needed

export const challenges: Challenge[] = []; // Backup only - no challenges data needed

export function getCommandsByCategory(): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {};
  commands.forEach((cmd) => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });
  return grouped;
}
