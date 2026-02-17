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

export const lessons: Lesson[] = [
  {
    id: "1",
    title: "Where Am I?",
    description: "Learn to navigate the filesystem with pwd, ls, and cd",
    icon: "compass",
    category: "Navigation",
    xpReward: 50,
    statReward: { type: "AGI", amount: 3 },
    difficulty: "E",
    dungeonName: "Cavern of Paths",
    steps: [
      { instruction: "Find out where you are. Type 'pwd' to print your current directory.", expectedCommand: "pwd", hint: "pwd stands for 'print working directory'", successMessage: "You're in /home/user. This is your home directory!", output: "/home/user" },
      { instruction: "See what's around you. Type 'ls' to list the contents.", expectedCommand: "ls", hint: "ls stands for 'list'", successMessage: "You can see the files and folders here!", output: "Desktop  Documents  Downloads  Music  Pictures  projects" },
      { instruction: "Move into Documents. Type 'cd Documents'.", expectedCommand: "cd Documents", hint: "cd stands for 'change directory'", successMessage: "You've entered Documents!", output: "" },
      { instruction: "Confirm your location with 'pwd'.", expectedCommand: "pwd", hint: "Use pwd again to confirm", successMessage: "Dungeon cleared! You've mastered basic navigation!", output: "/home/user/Documents" },
    ],
  },
  {
    id: "2",
    title: "Creating Things",
    description: "Create files and directories with touch and mkdir",
    icon: "add-circle",
    category: "Files",
    xpReward: 60,
    statReward: { type: "STR", amount: 4 },
    difficulty: "E",
    dungeonName: "Forge of Creation",
    steps: [
      { instruction: "Create a new directory called 'projects'. Type 'mkdir projects'.", expectedCommand: "mkdir projects", hint: "mkdir stands for 'make directory'", successMessage: "Directory created!", output: "" },
      { instruction: "Enter it with 'cd projects'.", expectedCommand: "cd projects", hint: "Use cd to change into the directory", successMessage: "You're inside projects now!", output: "" },
      { instruction: "Create a file called 'readme.txt' using 'touch readme.txt'.", expectedCommand: "touch readme.txt", hint: "touch creates empty files", successMessage: "File created!", output: "" },
      { instruction: "Verify with 'ls'.", expectedCommand: "ls", hint: "List to see your file", successMessage: "Dungeon cleared! You can now forge files and folders!", output: "readme.txt" },
    ],
  },
  {
    id: "3",
    title: "Reading Files",
    description: "View file contents with cat, head, and tail",
    icon: "document-text",
    category: "Viewing",
    xpReward: 60,
    statReward: { type: "INT", amount: 4 },
    difficulty: "E",
    dungeonName: "Library of Scrolls",
    steps: [
      { instruction: "Read a file. Type 'cat notes.txt' to see its contents.", expectedCommand: "cat notes.txt", hint: "cat displays the entire file", successMessage: "cat shows the whole file!", output: "Welcome to Linux!\nThis is a text file.\nYou're doing great!\nKeep learning commands.\nPractice makes perfect." },
      { instruction: "See just the first lines. Type 'head notes.txt'.", expectedCommand: "head notes.txt", hint: "head shows the beginning", successMessage: "head shows the top of the file!", output: "Welcome to Linux!\nThis is a text file.\nYou're doing great!" },
      { instruction: "See the last lines. Type 'tail notes.txt'.", expectedCommand: "tail notes.txt", hint: "tail shows the end", successMessage: "Dungeon cleared! You can read any scroll now!", output: "Keep learning commands.\nPractice makes perfect." },
    ],
  },
  {
    id: "4",
    title: "Copy & Move",
    description: "Copy, move, and rename files with cp and mv",
    icon: "copy",
    category: "Files",
    xpReward: 70,
    statReward: { type: "STR", amount: 5 },
    difficulty: "D",
    dungeonName: "Hall of Mirrors",
    steps: [
      { instruction: "Copy a file. Type 'cp report.txt backup.txt'.", expectedCommand: "cp report.txt backup.txt", hint: "cp copies files", successMessage: "File duplicated!", output: "" },
      { instruction: "Verify with 'ls'.", expectedCommand: "ls", hint: "List to confirm", successMessage: "Both files exist!", output: "backup.txt  report.txt" },
      { instruction: "Rename backup.txt. Type 'mv backup.txt archive.txt'.", expectedCommand: "mv backup.txt archive.txt", hint: "mv renames files", successMessage: "File renamed!", output: "" },
      { instruction: "Confirm with 'ls'.", expectedCommand: "ls", hint: "Check the listing", successMessage: "Dungeon cleared! Master of duplication and teleportation!", output: "archive.txt  report.txt" },
    ],
  },
  {
    id: "5",
    title: "Deleting Stuff",
    description: "Safely remove files and directories with rm",
    icon: "trash",
    category: "Files",
    xpReward: 70,
    statReward: { type: "STR", amount: 5 },
    difficulty: "D",
    dungeonName: "Void Chamber",
    steps: [
      { instruction: "Remove a file with 'rm old_file.txt'.", expectedCommand: "rm old_file.txt", hint: "rm removes files permanently", successMessage: "Destroyed! No trash can in Linux!", output: "" },
      { instruction: "Check it's gone with 'ls'.", expectedCommand: "ls", hint: "List the directory", successMessage: "Gone forever!", output: "important.txt  projects" },
      { instruction: "Remove a directory with 'rm -r old_folder'.", expectedCommand: "rm -r old_folder", hint: "-r means recursive", successMessage: "Dungeon cleared! You wield the power of destruction!", output: "" },
    ],
  },
  {
    id: "6",
    title: "Finding Text",
    description: "Search inside files with grep",
    icon: "search",
    category: "Text",
    xpReward: 80,
    statReward: { type: "INT", amount: 6 },
    difficulty: "C",
    dungeonName: "Maze of Secrets",
    steps: [
      { instruction: "Search for 'error' in a log. Type 'grep error server.log'.", expectedCommand: "grep error server.log", hint: "grep searches text patterns", successMessage: "Found all error lines!", output: "[ERROR] Connection timeout at 14:32\n[ERROR] Database unreachable at 15:01\n[ERROR] Auth failed for user admin" },
      { instruction: "Case-insensitive search. Type 'grep -i warning server.log'.", expectedCommand: "grep -i warning server.log", hint: "-i ignores case", successMessage: "Finds all variations!", output: "[WARNING] Disk usage at 85%\n[Warning] Memory low\n[warning] Slow query detected" },
      { instruction: "Count matches. Type 'grep -c error server.log'.", expectedCommand: "grep -c error server.log", hint: "-c counts matches", successMessage: "Dungeon cleared! Your perception is unmatched!", output: "3" },
    ],
  },
  {
    id: "7",
    title: "Permissions",
    description: "Control file permissions with chmod",
    icon: "lock-closed",
    category: "Permissions",
    xpReward: 90,
    statReward: { type: "DEF", amount: 7 },
    difficulty: "B",
    dungeonName: "Guardian's Gate",
    steps: [
      { instruction: "Check permissions with 'ls -la'.", expectedCommand: "ls -la", hint: "-la shows permissions", successMessage: "r=read, w=write, x=execute!", output: "total 16\ndrwxr-xr-x  2 user user 4096 Jan 15 10:00 .\n-rw-r--r--  1 user user  256 Jan 15 09:30 config.txt\n-rw-r--r--  1 user user  512 Jan 15 09:45 script.sh" },
      { instruction: "Make script.sh executable. Type 'chmod +x script.sh'.", expectedCommand: "chmod +x script.sh", hint: "+x adds execute permission", successMessage: "Script is now executable!", output: "" },
      { instruction: "Verify with 'ls -la'.", expectedCommand: "ls -la", hint: "Check permissions again", successMessage: "Dungeon cleared! You command access itself!", output: "total 16\ndrwxr-xr-x  2 user user 4096 Jan 15 10:00 .\n-rw-r--r--  1 user user  256 Jan 15 09:30 config.txt\n-rwxr-xr-x  1 user user  512 Jan 15 09:45 script.sh" },
    ],
  },
  {
    id: "8",
    title: "Who Am I?",
    description: "Learn system info commands",
    icon: "person",
    category: "System",
    xpReward: 50,
    statReward: { type: "VIT", amount: 3 },
    difficulty: "E",
    dungeonName: "Mirror of Self",
    steps: [
      { instruction: "Find your username. Type 'whoami'.", expectedCommand: "whoami", hint: "whoami shows current user", successMessage: "You are 'user'!", output: "user" },
      { instruction: "See your home. Type 'echo $HOME'.", expectedCommand: "echo $HOME", hint: "$HOME is an environment variable", successMessage: "Environment variables store system info!", output: "/home/user" },
      { instruction: "Print a message. Type 'echo Hello Linux'.", expectedCommand: "echo Hello Linux", hint: "echo prints text", successMessage: "Dungeon cleared! You know yourself!", output: "Hello Linux" },
    ],
  },
];

export const challenges: Challenge[] = [
  { id: "c1", title: "Lost in the Filesystem", description: "Navigate to your home directory", icon: "navigate", xpReward: 30, statReward: { type: "AGI", amount: 2 }, difficulty: "E", task: "You're lost! Navigate to your home directory with one command.", hints: ["There's a shortcut to go home...", "Try cd with a special character"], acceptedCommands: ["cd ~", "cd", "cd $HOME", "cd /home/user"], output: "", bossName: "Shadow of Confusion" },
  { id: "c2", title: "Create a Project", description: "Set up a project structure", icon: "folder-open", xpReward: 40, statReward: { type: "STR", amount: 3 }, difficulty: "E", task: "Create a new directory called 'my-app'.", hints: ["Use the make directory command", "The command starts with 'mk'"], acceptedCommands: ["mkdir my-app"], output: "", bossName: "Formless Void" },
  { id: "c3", title: "Find the Bug", description: "Search through a log file for errors", icon: "bug", xpReward: 50, statReward: { type: "INT", amount: 4 }, difficulty: "C", task: "Search for 'error' in 'app.log'.", hints: ["Which command searches text?", "Think g-r-e-p"], acceptedCommands: ["grep error app.log", "grep 'error' app.log", "grep \"error\" app.log"], output: "[2024-01-15] error: null pointer exception\n[2024-01-15] error: connection refused", bossName: "Bug Lord" },
  { id: "c4", title: "Backup Mission", description: "Make a backup of critical data", icon: "shield-checkmark", xpReward: 40, statReward: { type: "STR", amount: 3 }, difficulty: "E", task: "Copy 'database.sql' to 'database_backup.sql'.", hints: ["Which command copies files?", "cp [source] [destination]"], acceptedCommands: ["cp database.sql database_backup.sql"], output: "", bossName: "Data Wraith" },
  { id: "c5", title: "Clean Up", description: "Remove unnecessary files", icon: "trash-bin", xpReward: 50, statReward: { type: "STR", amount: 4 }, difficulty: "D", task: "Remove 'temp.log' from the current directory.", hints: ["Which command removes files?", "Be careful with this power!"], acceptedCommands: ["rm temp.log"], output: "", bossName: "Entropy Beast" },
  { id: "c6", title: "Make It Run", description: "Give a script execute permissions", icon: "flash", xpReward: 60, statReward: { type: "DEF", amount: 5 }, difficulty: "C", task: "Make 'deploy.sh' executable.", hints: ["Change permissions", "Add execute permission"], acceptedCommands: ["chmod +x deploy.sh", "chmod 755 deploy.sh", "chmod 777 deploy.sh"], output: "", bossName: "Gate Guardian" },
  { id: "c7", title: "Rename the File", description: "Rename without copying", icon: "create", xpReward: 40, statReward: { type: "STR", amount: 3 }, difficulty: "E", task: "Rename 'draft.txt' to 'final.txt'.", hints: ["Which command moves or renames?", "mv can rename"], acceptedCommands: ["mv draft.txt final.txt"], output: "", bossName: "Shape Shifter" },
  { id: "c8", title: "Word Count", description: "Count the lines in a file", icon: "calculator", xpReward: 50, statReward: { type: "INT", amount: 4 }, difficulty: "D", task: "Count the lines in 'data.csv'.", hints: ["There's a command for counting", "wc with a flag"], acceptedCommands: ["wc -l data.csv", "wc data.csv"], output: "42 data.csv", bossName: "Number Phantom" },
  { id: "c9", title: "Sort It Out", description: "Sort file contents", icon: "swap-vertical", xpReward: 50, statReward: { type: "INT", amount: 4 }, difficulty: "D", task: "Sort the names in 'users.txt' alphabetically.", hints: ["There's a command for sorting", "It's called... sort"], acceptedCommands: ["sort users.txt"], output: "alice\nbob\ncharlie\ndave\neve", bossName: "Chaos Sorter" },
  { id: "c10", title: "Secret Identity", description: "Discover who you are", icon: "finger-print", xpReward: 20, statReward: { type: "VIT", amount: 2 }, difficulty: "E", task: "Display your current username.", hints: ["A command tells you who you are", "who... am... I?"], acceptedCommands: ["whoami"], output: "user", bossName: "Shadow Self" },
];

export function getCommandsByCategory(): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {};
  commands.forEach((cmd) => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });
  return grouped;
}
