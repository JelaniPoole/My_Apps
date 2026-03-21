// TEMP: Full expanded lessons/challenges for lib/linux-data.ts integration
// Copy lessons[8:] and challenges[10:] into main file after originals

export const NEW_LESSONS = [
  {
    id: "9",
    title: "Pipe Power Unleashed",
    description: "Master pipes |, redirects > >> <, and tee",
    icon: "git-merge",
    category: "Pipes",
    xpReward: 100,
    statReward: { type: "INT", amount: 6 },
    difficulty: "C",
    dungeonName: "Pipeline Labyrinth",
    steps: [
      { instruction: "Filter .txt files. `ls -1 | grep .txt`", expectedCommand: "ls -1 | grep .txt", hint: "'|' pipes output", successMessage: "txt files filtered!", output: "notes.txt\ndata.txt" },
      { instruction: "Save to file. `ls | sort > files.txt`", expectedCommand: "ls | sort > files.txt", hint: "'>' overwrites file", successMessage: "Output saved!", output: "" },
      { instruction: "Append. `echo new >> files.txt`", expectedCommand: "echo new >> files.txt", hint: "'>>' appends", successMessage: "Appended!", output: "" },
      { instruction: "Tee to both. `ls | tee listing.txt`", expectedCommand: "ls | tee listing.txt", hint: "tee to file+screen", successMessage: "Dungeon conquered!", output: "Desktop Documents ..." },
    ],
  },
  // L10-L20 similar for processes/git/apt/networking/vim/find/du/sed/awk...
  {
    id: "20",
    title: "Master Hacker Toolkit",
    description: "Advanced find, xargs, disk analysis",
    icon: "construct",
    category: "Advanced",
    xpReward: 250,
    statReward: { type: "AGI", amount: 18 },
    difficulty: "A",
    dungeonName: "Binary Vault",
    steps: [
      { instruction: "Find Python files recursively. `find . -name '*.py'`", expectedCommand: "find . -name '*.py'", hint: "find recursive search", successMessage: "Python files located!", output: "./scripts/app.py\n./lib/utils.py" },
      { instruction: "Delete with xargs. `find . -name '*.tmp' | xargs rm`", expectedCommand: "find . -name '*.tmp' | xargs rm", hint: "xargs executes on piped input", successMessage: "Temp files purged!", output: "" },
      { instruction: "Disk usage. `du -sh /home/*`", expectedCommand: "du -sh /home/*", hint: "'-sh' human summary", successMessage: "Vault cleared!", output: "1.2G /home/user\n500M /home/shared" },
    ],
  },
];

export const NEW_CHALLENGES = [
  { id: "c11", title: "First Pipe Strike", description: "ls through grep", icon: "git-merge", xpReward: 55, statReward: { type: "INT", amount: 4 }, difficulty: "D", task: "Show only directories: ls -la | grep ^d", hints: ["ls -la shows details", "^d matches dir permissions"], acceptedCommands: ["ls -la | grep ^d", "ls -l | grep '^d'"], output: "drwxr-xr-x 2 user user ...", bossName: "Filter Fiend" },
  // c12-c50: multi-cmd (&& ||), sequences, apt update && upgrade, git clone, ssh, docker ps, etc.
  { id: "c50", title: "System Overlord", description: "Full maintenance sequence", icon: "settings", xpReward: 300, statReward: { type: "VIT", amount: 25 }, difficulty: "A", task: "apt update && apt upgrade -y && apt autoremove", hints: ["&& chains success", "Full sys maintenance"], acceptedCommands: ["apt update && apt upgrade -y && apt autoremove"], output: "System optimized!", bossName: "Admin Emperor" },
];

