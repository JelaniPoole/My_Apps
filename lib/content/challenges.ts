import type { Challenge } from "./types";

export const challenges: Challenge[] = [
  { id: "c1", title: "Directory Demon", description: "Produce a detailed file listing.", icon: "list", xpReward: 40, statReward: { type: "AGI", amount: 2 }, difficulty: "E", task: "Run a detailed listing that includes hidden files.", hints: ["Use `ls` with both long and all flags.", "One valid answer is `ls -la`."], acceptedCommands: ["ls -la", "ls -al", "ls -l -a", "ls -a -l"], output: "total 48\ndrwxr-xr-x  4 hunter hunter  128 .", bossName: "Dir Demon" },
  { id: "c2", title: "Path Master", description: "Search recursively for text files.", icon: "location", xpReward: 45, statReward: { type: "AGI", amount: 2 }, difficulty: "E", task: "Find all `.txt` files from the current directory down.", hints: ["Start with `find .`.", "Use `-name '*.txt'` to filter by file name."], acceptedCommands: ["find . -name '*.txt'"], output: "./quest.log\n./notes.txt", bossName: "Path Phantom" },
  { id: "c3", title: "Copy Cat", description: "Create a recursive backup copy.", icon: "copy", xpReward: 50, statReward: { type: "STR", amount: 2 }, difficulty: "D", task: "Copy the `src` directory into `backup` recursively.", hints: ["Directories need the recursive flag.", "Source first, destination second."], acceptedCommands: ["cp -r src backup", "cp -r src backup/"], output: "Files copied!", bossName: "Copy Curse" },
  { id: "c4", title: "Link Lord", description: "Create a symbolic link.", icon: "link", xpReward: 55, statReward: { type: "STR", amount: 3 }, difficulty: "D", task: "Make a symbolic link named `shortcut` pointing to `original`.", hints: ["Use `ln` with the symbolic link flag.", "Source comes before target link name."], acceptedCommands: ["ln -s original shortcut"], output: "Link created!", bossName: "Link Lich" },
  { id: "c5", title: "Pipe Fiend", description: "Chain commands with a pipe.", icon: "git-merge", xpReward: 60, statReward: { type: "INT", amount: 3 }, difficulty: "C", task: "Count how many `txt` files appear in a directory listing.", hints: ["List first, then grep, then count lines.", "There should be two pipes in the answer."], acceptedCommands: ["ls | grep txt | wc -l"], output: "3", bossName: "Pipe Phantom" },
  { id: "c6", title: "Sort Sorcerer", description: "Sort data, then limit the output.", icon: "swap-vertical", xpReward: 65, statReward: { type: "INT", amount: 3 }, difficulty: "C", task: "Show the top 5 names from `names.txt` in reverse sort order.", hints: ["Use `sort -r` first.", "Pipe the sorted output into `head -5`."], acceptedCommands: ["sort -r names.txt | head -5"], output: "Zoe\nYara\nXimena\nWill\nVera", bossName: "Sort Shade" },
  { id: "c7", title: "Log Watcher", description: "Pull just the newest lines from a log.", icon: "reader", xpReward: 55, statReward: { type: "INT", amount: 2 }, difficulty: "D", task: "Show the last 10 lines of `server.log`.", hints: ["This is the opposite of `head`.", "Use a number flag with the last-lines command."], acceptedCommands: ["tail -10 server.log", "tail -n 10 server.log"], output: "...\nServer ready on port 5000", bossName: "Log Watcher" },
  { id: "c8", title: "Redirect Revenant", description: "Save filtered output into a file.", icon: "document-text", xpReward: 70, statReward: { type: "INT", amount: 3 }, difficulty: "C", task: "Find every `ERROR` line in `app.log` and write the results into `errors.txt`.", hints: ["Search first, then redirect the result.", "Use overwrite redirection, not append."], acceptedCommands: ["grep ERROR app.log > errors.txt"], output: "", bossName: "Redirect Revenant" },
  { id: "c9", title: "Signal Warden", description: "Terminate a process by PID.", icon: "pulse", xpReward: 75, statReward: { type: "VIT", amount: 4 }, difficulty: "C", task: "Stop the process whose PID is `2451`.", hints: ["Use the process ID after the command.", "This command sends a signal to end the process."], acceptedCommands: ["kill 2451"], output: "", bossName: "Signal Warden" },
  { id: "c10", title: "Packet Seer", description: "Fetch remote data with curl.", icon: "globe", xpReward: 80, statReward: { type: "VIT", amount: 4 }, difficulty: "C", task: "Request the page at `https://example.com`.", hints: ["Use the command-line transfer tool.", "Include the full URL."], acceptedCommands: ["curl https://example.com"], output: "<html>\n  <title>Example Domain</title>\n</html>", bossName: "Packet Seer" },
  { id: "c11", title: "Diff Dragon", description: "Inspect source changes before staging.", icon: "git-compare", xpReward: 90, statReward: { type: "INT", amount: 5 }, difficulty: "B", task: "Show the current unstaged Git changes.", hints: ["Use the compare command inside Git.", "You do not need any file path for this one."], acceptedCommands: ["git diff"], output: "diff --git a/app.js b/app.js\n+console.log('patched')", bossName: "Diff Dragon" },
  { id: "c12", title: "Manual Mimic", description: "The mimic only yields if you consult the right documentation instead of guessing.", icon: "book", xpReward: 58, statReward: { type: "INT", amount: 2 }, difficulty: "D", task: "Open the manual page for `grep`.", hints: ["Reach for the built-in Linux manual system.", "The answer starts with `man`, then the command you want to study."], acceptedCommands: ["man grep"], output: "GREP(1)\n\nNAME\n    grep - print lines that match patterns\n\nType 'q' to quit.", bossName: "Manual Mimic" },
  { id: "c13", title: "Package Phantom", description: "Before you install anything, prove you know the first safe package-management step.", icon: "cube", xpReward: 72, statReward: { type: "VIT", amount: 4 }, difficulty: "C", task: "Update the package list on a Debian-style system.", hints: ["Use `apt`, but not `install` yet.", "This command refreshes the package index before any upgrade or install."], acceptedCommands: ["apt update"], output: "Hit:1 main repository\nGet:2 security updates\nReading package lists... Done", bossName: "Package Phantom" },
  { id: "c14", title: "Journal Jailer", description: "The jailer hides clues in the system journal. Pull the right service logs to expose them.", icon: "reader", xpReward: 76, statReward: { type: "INT", amount: 4 }, difficulty: "C", task: "Show logs for the `nginx` service.", hints: ["Use the system journal reader, not `cat` or `tail`.", "Filter by service with the unit flag `-u`."], acceptedCommands: ["journalctl -u nginx"], output: "Mar 24 08:10 nginx[221]: Starting worker process\nMar 24 08:11 nginx[221]: Ready for connections", bossName: "Journal Jailer" },
  { id: "c15", title: "Branch Banshee", description: "The banshee shrieks across multiple lines of development. Reveal every local branch before you move.", icon: "git-branch", xpReward: 96, statReward: { type: "INT", amount: 5 }, difficulty: "B", task: "List the local Git branches.", hints: ["Use the Git command that reports branch names.", "No extra flags are needed for the basic local list."], acceptedCommands: ["git branch"], output: "* main\n  feature/ui-refresh\n  hotfix/login", bossName: "Branch Banshee" },
  { id: "c16", title: "Fetcher Wraith", description: "The wraith guards a remote artifact. Pull it down directly from the command line.", icon: "download", xpReward: 102, statReward: { type: "AGI", amount: 5 }, difficulty: "B", task: "Download `https://example.com/file.zip` with `wget`.", hints: ["Use the download-focused network tool, not `curl`.", "Pass the full URL directly after `wget`."], acceptedCommands: ["wget https://example.com/file.zip"], output: "--2026-03-26--  https://example.com/file.zip\nSaving to: 'file.zip'\nfile.zip saved", bossName: "Fetcher Wraith" },
  { id: "c50", title: "System Overlord", description: "Chain together a full maintenance command.", icon: "settings", xpReward: 300, statReward: { type: "VIT", amount: 25 }, difficulty: "A", task: "Run a full Debian-style update, upgrade, and cleanup sequence.", hints: ["This boss expects a three-command chain.", "Use `&&` to stop if one step fails."], acceptedCommands: ["apt update && apt upgrade -y && apt autoremove"], output: "System optimized! All packages updated.", bossName: "Admin Emperor" },
];

const challengeProgressionOrder = [
  "c1",
  "c2",
  "c3",
  "c4",
  "c7",
  "c12",
  "c5",
  "c6",
  "c8",
  "c9",
  "c10",
  "c13",
  "c14",
  "c11",
  "c15",
  "c16",
  "c50",
] as const;

const challengeOrderLookup = new Map(
  challengeProgressionOrder.map((id, index) => [id, index]),
);

export const orderedChallenges = [...challenges].sort((left, right) => {
  const leftOrder = challengeOrderLookup.get(left.id) ?? Number.MAX_SAFE_INTEGER;
  const rightOrder =
    challengeOrderLookup.get(right.id) ?? Number.MAX_SAFE_INTEGER;

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder;
  }

  return left.title.localeCompare(right.title);
});
