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

export interface CategoryRoadmap {
  name: string;
  icon: string;
  lessons: string[];
  challenges: string[];
  statType: "STR" | "INT" | "AGI" | "VIT" | "DEF";
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

// 85 Linux Commands (unchanged)
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
  { name: "ps", syntax: "ps [options]", description: "List running processes", examples: ["ps aux", "ps -ef"], category: "Processes", statType: "VIT" },
  { name: "kill", syntax: "kill [pid]", description: "Terminate a process", examples: ["kill 1234"], category: "Processes", statType: "VIT" },
  { name: "top", syntax: "top", description: "Monitor system processes", examples: ["top"], category: "Monitoring", statType: "VIT" },
  { name: "df", syntax: "df [options]", description: "Disk usage summary", examples: ["df -h"], category: "System", statType: "VIT" },
  { name: "du", syntax: "du [options] [path]", description: "Estimate file space usage", examples: ["du -sh *"], category: "System", statType: "VIT" },
  { name: "free", syntax: "free [options]", description: "Memory usage", examples: ["free -h"], category: "System", statType: "VIT" },
  { name: "uptime", syntax: "uptime", description: "System uptime", examples: ["uptime"], category: "System", statType: "VIT" },
  { name: "date", syntax: "date", description: "Display current date/time", examples: ["date"], category: "Basics", statType: "VIT" },
  { name: "cal", syntax: "cal", description: "Display calendar", examples: ["cal"], category: "Basics", statType: "VIT" },
  { name: "history", syntax: "history", description: "Command history", examples: ["history"], category: "Basics", statType: "VIT" },
  { name: "alias", syntax: "alias [name=command]", description: "Create command alias", examples: ["alias ll='ls -la'"], category: "Basics", statType: "VIT" },
  { name: "export", syntax: "export [var=value]", description: "Set environment variable", examples: ["export PATH=$PATH:/bin"], category: "Environment", statType: "VIT" },
  { name: "env", syntax: "env", description: "List environment variables", examples: ["env"], category: "Environment", statType: "VIT" },
  { name: "which", syntax: "which [command]", description: "Locate executable", examples: ["which ls"], category: "Navigation", statType: "AGI" },
  { name: "whereis", syntax: "whereis [command]", description: "Locate binary/source/man", examples: ["whereis ls"], category: "Navigation", statType: "AGI" },
  { name: "whatis", syntax: "whatis [command]", description: "Short description", examples: ["whatis ls"], category: "Basics", statType: "VIT" },
  { name: "file", syntax: "file [filename]", description: "File type identification", examples: ["file image.jpg"], category: "Viewing", statType: "INT" },
  { name: "ln", syntax: "ln [options] [source] [target]", description: "Create hard/soft links", examples: ["ln -s file.txt link.txt"], category: "Files", statType: "STR" },
  { name: "tar", syntax: "tar [options] [archive] [files]", description: "Archive files", examples: ["tar -czf backup.tar.gz folder/"], category: "Archives", statType: "STR" },
  { name: "gzip", syntax: "gzip [options] [file]", description: "Compress files", examples: ["gzip large.log"], category: "Archives", statType: "STR" },
  { name: "unzip", syntax: "unzip [archive]", description: "Extract zip files", examples: ["unzip project.zip"], category: "Archives", statType: "STR" },
  { name: "wget", syntax: "wget [url]", description: "Download files", examples: ["wget https://example.com/file"], category: "Network", statType: "AGI" },
  { name: "curl", syntax: "curl [options] [url]", description: "Transfer data", examples: ["curl -O example.com/file"], category: "Network", statType: "AGI" },
  { name: "ping", syntax: "ping [host]", description: "Test network connectivity", examples: ["ping google.com"], category: "Network", statType: "AGI" },
  { name: "ssh", syntax: "ssh [user@host]", description: "Remote login", examples: ["ssh user@server.com"], category: "Network", statType: "AGI" },
  { name: "scp", syntax: "scp [source] [dest]", description: "Secure copy", examples: ["scp file.txt user@server:/tmp/"], category: "Network", statType: "AGI" },
  { name: "apt", syntax: "apt [command]", description: "Package manager (Debian)", examples: ["apt update", "apt install vim"], category: "Packages", statType: "VIT" },
  { name: "yum", syntax: "yum [command]", description: "Package manager (RedHat)", examples: ["yum update", "yum install vim"], category: "Packages", statType: "VIT" },
  { name: "dnf", syntax: "dnf [command]", description: "Next-gen yum", examples: ["dnf update"], category: "Packages", statType: "VIT" },
  { name: "git", syntax: "git [command]", description: "Version control", examples: ["git clone", "git status"], category: "Git", statType: "INT" },
  { name: "docker", syntax: "docker [command]", description: "Container runtime", examples: ["docker ps", "docker run"], category: "Containers", statType: "VIT" },
  { name: "systemctl", syntax: "systemctl [command]", description: "Systemd service manager", examples: ["systemctl status nginx"], category: "Services", statType: "DEF" },
  { name: "journalctl", syntax: "journalctl [options]", description: "Query systemd journal", examples: ["journalctl -u nginx"], category: "Logs", statType: "INT" },
  { name: "sed", syntax: "sed [expression] [file]", description: "Stream editor", examples: ["sed 's/old/new/' file.txt"], category: "Text", statType: "INT" },
  { name: "awk", syntax: "awk [program] [file]", description: "Pattern scanning", examples: ["awk '{print $1}' file.txt"], category: "Text", statType: "INT" },
  { name: "cut", syntax: "cut [options] [file]", description: "Extract sections", examples: ["cut -d: -f1 /etc/passwd"], category: "Text", statType: "INT" },
  { name: "tr", syntax: "tr [set1] [set2]", description: "Translate characters", examples: ["tr 'a-z' 'A-Z'"], category: "Text", statType: "INT" },
  { name: "tee", syntax: "tee [options] [file]", description: "Pipe to file and stdout", examples: ["ls | tee listing.txt"], category: "Pipes", statType: "INT" },
  { name: "|", syntax: "|", description: "Pipe operator", examples: ["ls | grep txt"], category: "Pipes", statType: "INT" },
  { name: ">", syntax: ">", description: "Redirect output to file", examples: ["ls > files.txt"], category: "Redirects", statType: "INT" },
  { name: ">>", syntax: ">>", description: "Append to file", examples: ["echo done >> log.txt"], category: "Redirects", statType: "INT" },
  { name: "<", syntax: "<", description: "Redirect input from file", examples: ["sort < names.txt"], category: "Redirects", statType: "INT" },
  { name: "&&", syntax: "&&", description: "Logical AND", examples: ["mkdir dir && cd dir"], category: "Logic", statType: "INT" },
  { name: "||", syntax: "||", description: "Logical OR", examples: ["ping host || echo offline"], category: "Logic", statType: "INT" },
  { name: "screen", syntax: "screen", description: "Terminal multiplexer", examples: ["screen -S session"], category: "Sessions", statType: "AGI" },
  { name: "tmux", syntax: "tmux", description: "Terminal multiplexer", examples: ["tmux new"], category: "Sessions", statType: "AGI" },
  { name: "nano", syntax: "nano [file]", description: "Simple text editor", examples: ["nano notes.txt"], category: "Editors", statType: "INT" },
  { name: "vim", syntax: "vim [file]", description: "Advanced text editor", examples: ["vim config.txt"], category: "Editors", statType: "INT" },
  { name: "htop", syntax: "htop", description: "Enhanced process viewer", examples: ["htop"], category: "Monitoring", statType: "VIT" },
  { name: "ncdu", syntax: "ncdu [path]", description: "Disk usage analyzer", examples: ["ncdu /"], category: "System", statType: "VIT" },
  { name: "neofetch", syntax: "neofetch", description: "System information", examples: ["neofetch"], category: "System", statType: "VIT" },
];

export const lessons: Lesson[] = [
  {
    id: "1",
    title: "First Steps",
    description: "Learn basic navigation - where am I? What's around me?",
    icon: "location",
    category: "Navigation",
    xpReward: 50,
    statReward: { type: "AGI", amount: 2 },
    difficulty: "E",
    dungeonName: "Tutorial Caves",
    steps: [
      { instruction: "Check your location in the dungeon", expectedCommand: "pwd", hint: "pwd = Print Working Directory", successMessage: "🗺️ Location revealed: /home/hunter", output: "/home/hunter" },
      { instruction: "Scan for items (sword, shield, potions)", expectedCommand: "ls", hint: "ls = List directory contents", successMessage: "⚔️ Gear visible: sword shield potion", output: "sword shield potion\nREADME.md" },
      { instruction: "Return to base camp safely", expectedCommand: "cd ~", hint: "~ = home directory shortcut", successMessage: "🏕️ Safe at camp!", output: "" },
    ],
  },
  {
    id: "2", 
    title: "File Forge",
    description: "Learn to create files & folders - craft your hunter gear",
    icon: "hammer",
    category: "Files",
    xpReward: 60,
    statReward: { type: "STR", amount: 2 },
    difficulty: "E",
    dungeonName: "Forge Depths",
    steps: [
      { instruction: "Forge quest log", expectedCommand: "touch quest.log", hint: "touch = create empty file", successMessage: "📝 Quest log created!", output: "" },
      { instruction: "Build storage room", expectedCommand: "mkdir maps", hint: "mkdir = make directory", successMessage: "📦 Storage ready!", output: "" },
      { instruction: "Verify your crafting", expectedCommand: "ls", hint: "ls to check results", successMessage: "✅ Gear ready: quest.log maps", output: "quest.log maps" },
    ],
  },
  {
    id: "3",
    title: "File Operations Mastery",
    description: "Copy, move, delete - manage your inventory like a pro",
    icon: "shuffle",
    category: "Files",
    xpReward: 70,
    statReward: { type: "STR", amount: 3 },
    difficulty: "D",
    dungeonName: "Inventory Vault", 
    steps: [
      { instruction: "Backup your sword", expectedCommand: "cp sword sword.backup", hint: "cp source destination", successMessage: "🗡️ Backup complete!", output: "" },
      { instruction: "Rename to iron-sword", expectedCommand: "mv sword.backup iron-sword", hint: "mv = move/rename", successMessage: "🔨 Upgraded!", output: "" },
      { instruction: "Clean up empty pots", expectedCommand: "rm potion", hint: "rm to delete files", successMessage: "🧹 Cleaned!", output: "" },
    ],
  },
  {
    id: "4",
    title: "Text Inspection Basics",
    description: "Read files, count lines - analyze scrolls & logs",
    icon: "document-text",
    category: "Viewing",
    xpReward: 65,
    statReward: { type: "INT", amount: 2 },
    difficulty: "D",
    dungeonName: "Library Ruins",
    steps: [
      { instruction: "Read quest log", expectedCommand: "cat quest.log", hint: "cat = concatenate/show file", successMessage: "📖 Quest details revealed!", output: "Kill 5 goblins\nFind lost relic" },
      { instruction: "Check first 3 lines of map", expectedCommand: "head -3 maps/world.txt", hint: "head shows beginning", successMessage: "🗺️ Map preview!", output: "Forest Entrance\nGoblin Camp\n..." },
      { instruction: "Count lines in enemy log", expectedCommand: "wc -l enemies.txt", hint: "wc = word/line count", successMessage: "📊 12 enemies logged!", output: "12 enemies.txt" },
    ],
  },
  {
    id: "5",
    title: "Search & Filter Power",
    description: "grep + pipes - hunt specific enemies & items",
    icon: "search",
    category: "Text",
    xpReward: 80,
    statReward: { type: "INT", amount: 3 },
    difficulty: "D",
    dungeonName: "Enemy Archives",
    steps: [
      { instruction: "Find goblin mentions", expectedCommand: "grep goblin enemies.txt", hint: "grep = search pattern", successMessage: "👹 Goblins located!", output: "goblin x3\ngoblin shaman" },
      { instruction: "Count only orcs", expectedCommand: "grep orc enemies.txt | wc -l", hint: "'|' = pipe output", successMessage: "💪 4 orcs!", output: "4" },
    ],
  },
  {
    id: "6",
    title: "Pipe Power Unleashed",
    description: "Master pipes, redirects, tee - chain commands like a hunter",
    icon: "git-merge",
    category: "Pipes",
    xpReward: 100,
    statReward: { type: "INT", amount: 4 },
    difficulty: "C",
    dungeonName: "Pipeline Labyrinth",
    steps: [
      { instruction: "Filter txt files only", expectedCommand: "ls -1 | grep .txt", hint: "'|' pipes ls to grep", successMessage: "📄 Txt files isolated!", output: "quest.log\nenemies.txt" },
      { instruction: "Save sorted list", expectedCommand: "ls | sort > inventory.txt", hint: "'>' redirects to file", successMessage: "📝 Saved!", output: "" },
      { instruction: "Append timestamp", expectedCommand: "echo Updated >> inventory.txt", hint: "'>>' appends", successMessage: "⏰ Timestamped!", output: "" },
      { instruction: "Tee to both screen/file", expectedCommand: "ls | tee backup.txt", hint: "tee shows AND saves", successMessage: "✅ Dual output!", output: "sword shield ..." },
    ],
  },
  {
    id: "7",
    title: "Permissions & Defense", 
    description: "chmod, whoami - secure your camp",
    icon: "shield",
    category: "Permissions",
    xpReward: 90,
    statReward: { type: "DEF", amount: 4 },
    difficulty: "C",
    dungeonName: "Security Crypt",
    steps: [
      { instruction: "Check your identity", expectedCommand: "whoami", hint: "whoami shows current user", successMessage: "🆔 Hunter confirmed!", output: "hunter" },
      { instruction: "Make script executable", expectedCommand: "chmod +x hunt.sh", hint: "+x = executable", successMessage: "⚙️ Ready to run!", output: "" },
    ],
  },
  {
    id: "8",
    title: "Process Hunter",
    description: "ps, kill, top - hunt rogue processes",
    icon: "activity",
    category: "Processes",
    xpReward: 110,
    statReward: { type: "VIT", amount: 5 },
    difficulty: "C",
    dungeonName: "Process Dungeon",
    steps: [
      { instruction: "List all processes", expectedCommand: "ps aux", hint: "ps aux = all processes detailed", successMessage: "⚙️ Processes revealed!", output: "USER PID %CPU..." },
      { instruction: "Kill PID 1234", expectedCommand: "kill 1234", hint: "kill PID terminates process", successMessage: "💀 Process eliminated!", output: "" },
    ],
  },
  {
    id: "9",
    title: "Disk & Memory Scout",
    description: "df du free - analyze system resources",
    icon: "hard-drive",
    category: "System",
    xpReward: 95,
    statReward: { type: "VIT", amount: 4 },
    difficulty: "C",
    dungeonName: "Resource Vault",
    steps: [
      { instruction: "Check disk usage", expectedCommand: "df -h", hint: "-h = human readable", successMessage: "💾 75% disk used!", output: "Filesystem Size Used..." },
      { instruction: "Folder sizes", expectedCommand: "du -sh *", hint: "du -sh = summary sizes", successMessage: "📊 maps: 2.1M", output: "1.2M ./maps" },
    ],
  },
  {
    id: "10",
    title: "Git Hunter Academy",
    description: "Version control basics - track your quests",
    icon: "logo-github",
    category: "Git",
    xpReward: 130,
    statReward: { type: "INT", amount: 6 },
    difficulty: "B",
    dungeonName: "Repository Ruins",
    steps: [
      { instruction: "Check git status", expectedCommand: "git status", hint: "Shows changes/branch", successMessage: "📂 2 files modified", output: "On branch main\nmodified: quest.log" },
      { instruction: "Quick log view", expectedCommand: "git log --oneline", hint: "--oneline = compact history", successMessage: "📜 Commit history!", output: "abc1234 Quest update" },
    ],
  },
  // L11-19: Packages (apt), Network (ping/curl), Editors (nano/vim), Advanced Text (sed/awk), Services (systemctl), Monitoring (htop), Containers (docker), Final Boss Prep
  {
    id: "20",
    title: "Master Hacker Toolkit",
    description: "find xargs du mastery - ultimate Linux hunter",
    icon: "construct",
    category: "Advanced",
    xpReward: 250,
    statReward: { type: "AGI", amount: 18 },
    difficulty: "A",
    dungeonName: "Binary Citadel",
    steps: [
      { instruction: "Hunt Python scripts recursively", expectedCommand: "find . -name '*.py'", hint: "find . recursive from current", successMessage: "🐍 Python files found!", output: "./lib/utils.py\n./scripts/bot.py" },
      { instruction: "Delete temp files smart", expectedCommand: "find . -name '*.tmp' | xargs rm", hint: "xargs runs rm on each line", successMessage: "🧹 Temps purged!", output: "" },
      { instruction: "Analyze home disk usage", expectedCommand: "du -sh /home/*", hint: "-sh = human summary", successMessage: "📊 Resource map complete!", output: "1.2G /home/hunter\n500M /home/shared" },
    ],
  },
];

export const challenges: Challenge[] = [
  // Navigation E Rank
  { id: "c1", title: "Directory Demon", description: "Detailed file listing", icon: "list", xpReward: 40, statReward: { type: "AGI", amount: 2 }, difficulty: "E", task: "ls -la (detailed listing)", hints: ["-l long format", "-a all files"], acceptedCommands: ["ls -la", "ls -l -a"], output: "total 48\ndrwx...", bossName: "Dir Demon" },
  { id: "c2", title: "Path Master", description: "Advanced navigation", icon: "location", xpReward: 45, statReward: { type: "AGI", amount: 2 }, difficulty: "E", task: "find . -name '*.txt'", hints: ["find searches recursively"], acceptedCommands: ["find . -name '*.txt'"], output: "./quest.log\n./notes.txt", bossName: "Path Phantom" },
  
  // Files D Rank  
  { id: "c3", title: "Copy Cat", description: "Smart copying", icon: "copy", xpReward: 50, statReward: { type: "STR", amount: 2 }, difficulty: "D", task: "cp -r src backup/", hints: ["-r recursive dirs"], acceptedCommands: ["cp -r src backup"], output: "Files copied!", bossName: "Copy Curse" },
  { id: "c4", title: "Link Lord", description: "Symbolic links", icon: "link", xpReward: 55, statReward: { type: "STR", amount: 3 }, difficulty: "D", task: "ln -s original shortcut", hints: ["-s = symbolic link"], acceptedCommands: ["ln -s original shortcut"], output: "Link created!", bossName: "Link Lich" },
  
  // Pipes/Text C Rank
  { id: "c5", title: "Pipe Fiend", description: "grep + wc chain", icon: "git-merge", xpReward: 60, statReward: { type: "INT", amount: 3 }, difficulty: "C", task: "ls | grep txt | wc -l", hints: ["Count txt files via pipe"], acceptedCommands: ["ls | grep txt | wc -l"], output: "3", bossName: "Pipe Phantom" },
  { id: "c6", title: "Sort Sorcerer", description: "Multi-sort mastery", icon: "sort", xpReward: 65, statReward: { type: "INT", amount: 3 }, difficulty: "C", task: "sort -r names.txt | head -5", hints: ["-r reverse, head limits"], acceptedCommands: ["sort -r names.txt | head -5"], output: "Zoe\nYara\n...", bossName: "Sort Shade" },
  
  // Continue pattern to C50 System Overlord...
  { id: "c50", title: "System Overlord", description: "Full sys maintenance", icon: "settings", xpReward: 300, statReward: { type: "VIT", amount: 25 }, difficulty: "A", task: "apt update && apt upgrade -y && apt autoremove", hints: ["&& chains commands", "Full Ubuntu/Debian update"], acceptedCommands: ["apt update && apt upgrade -y && apt autoremove"], output: "System optimized! All packages updated.", bossName: "Admin Emperor" },
];

export const roadmapCategories: CategoryRoadmap[] = [
  { name: "Navigation", icon: "location", lessons: ["1"], challenges: ["c1", "c2"], statType: "AGI" },
  { name: "Files", icon: "document", lessons: ["2", "3"], challenges: ["c3", "c4"], statType: "STR" },
  { name: "Viewing", icon: "eye", lessons: ["4"], challenges: ["c7", "c8"], statType: "INT" },
  { name: "Pipes & Text", icon: "git-merge", lessons: ["5", "6"], challenges: ["c5", "c6"], statType: "INT" },
  { name: "Permissions", icon: "shield", lessons: ["7"], challenges: ["c9"], statType: "DEF" },
  { name: "Processes", icon: "activity", lessons: ["8"], challenges: ["c10", "c11"], statType: "VIT" },
  { name: "System", icon: "server", lessons: ["9"], challenges: ["c12"], statType: "VIT" },
  { name: "Git", icon: "logo-github", lessons: ["10"], challenges: ["c20"], statType: "INT" },
  { name: "Advanced", icon: "construct", lessons: ["20"], challenges: ["c50"], statType: "AGI" },
];

export function getCommandsByCategory(): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {};
  commands.forEach((cmd) => {
    if (!grouped[cmd.category]) grouped[cmd.category] = [];
    grouped[cmd.category].push(cmd);
  });
  return grouped;
}

export function getRoadmapProgress(completedLessons: string[], completedChallenges: string[]): Record<string, {completed: number, total: number, pct: number}> {
  const progress: Record<string, {completed: number, total: number, pct: number}> = {};
  
  roadmapCategories.forEach((cat) => {
    const lessonComplete = cat.lessons.filter(id => completedLessons.includes(id)).length;
    const challengeComplete = cat.challenges.filter(id => completedChallenges.includes(id)).length;
    const total = cat.lessons.length + cat.challenges.length;
    const completed = lessonComplete + challengeComplete;
    progress[cat.name] = { completed, total, pct: total > 0 ? (completed / total) : 0 };
  });
  
  return progress;
}

