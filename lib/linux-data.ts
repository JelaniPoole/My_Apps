export interface Command {
  name: string;
  syntax: string;
  description: string;
  examples: string[];
  category: string;
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
  steps: LessonStep[];
  difficulty: "beginner" | "intermediate" | "advanced";
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  task: string;
  hints: string[];
  acceptedCommands: string[];
  output: string;
}

export const commands: Command[] = [
  { name: "pwd", syntax: "pwd", description: "Print working directory - shows where you are", examples: ["pwd"], category: "Navigation" },
  { name: "ls", syntax: "ls [options] [path]", description: "List directory contents", examples: ["ls", "ls -la", "ls /home"], category: "Navigation" },
  { name: "cd", syntax: "cd [directory]", description: "Change directory - move around the filesystem", examples: ["cd /home", "cd ..", "cd ~"], category: "Navigation" },
  { name: "mkdir", syntax: "mkdir [directory]", description: "Create a new directory", examples: ["mkdir projects", "mkdir -p a/b/c"], category: "Files" },
  { name: "touch", syntax: "touch [file]", description: "Create an empty file or update timestamp", examples: ["touch notes.txt", "touch index.html"], category: "Files" },
  { name: "rm", syntax: "rm [options] [file]", description: "Remove files or directories", examples: ["rm file.txt", "rm -r folder", "rm -rf old_stuff"], category: "Files" },
  { name: "cp", syntax: "cp [source] [dest]", description: "Copy files or directories", examples: ["cp file.txt backup.txt", "cp -r src dest"], category: "Files" },
  { name: "mv", syntax: "mv [source] [dest]", description: "Move or rename files", examples: ["mv old.txt new.txt", "mv file.txt /tmp/"], category: "Files" },
  { name: "cat", syntax: "cat [file]", description: "Display file contents", examples: ["cat readme.txt", "cat /etc/hostname"], category: "Viewing" },
  { name: "echo", syntax: "echo [text]", description: "Print text to the terminal", examples: ["echo Hello", "echo $HOME"], category: "Basics" },
  { name: "grep", syntax: "grep [pattern] [file]", description: "Search for patterns in files", examples: ["grep error log.txt", "grep -i hello file.txt"], category: "Text" },
  { name: "chmod", syntax: "chmod [mode] [file]", description: "Change file permissions", examples: ["chmod 755 script.sh", "chmod +x run.sh"], category: "Permissions" },
  { name: "whoami", syntax: "whoami", description: "Display current username", examples: ["whoami"], category: "System" },
  { name: "man", syntax: "man [command]", description: "Display manual page for a command", examples: ["man ls", "man grep"], category: "Basics" },
  { name: "head", syntax: "head [options] [file]", description: "Display first lines of a file", examples: ["head file.txt", "head -n 5 log.txt"], category: "Viewing" },
  { name: "tail", syntax: "tail [options] [file]", description: "Display last lines of a file", examples: ["tail file.txt", "tail -n 5 log.txt"], category: "Viewing" },
  { name: "wc", syntax: "wc [options] [file]", description: "Count lines, words, and characters", examples: ["wc file.txt", "wc -l log.txt"], category: "Text" },
  { name: "sort", syntax: "sort [options] [file]", description: "Sort lines of text", examples: ["sort names.txt", "sort -n numbers.txt"], category: "Text" },
  { name: "find", syntax: "find [path] [expression]", description: "Search for files in a directory hierarchy", examples: ["find . -name '*.txt'", "find /home -type d"], category: "Navigation" },
  { name: "clear", syntax: "clear", description: "Clear the terminal screen", examples: ["clear"], category: "Basics" },
];

export const lessons: Lesson[] = [
  {
    id: "1",
    title: "Where Am I?",
    description: "Learn to navigate the filesystem with pwd, ls, and cd",
    icon: "compass",
    category: "Navigation",
    xpReward: 50,
    difficulty: "beginner",
    steps: [
      {
        instruction: "First, let's find out where we are. Type 'pwd' to print your current directory.",
        expectedCommand: "pwd",
        hint: "pwd stands for 'print working directory'",
        successMessage: "You're in /home/user. This is your home directory!",
        output: "/home/user",
      },
      {
        instruction: "Now let's see what files are here. Type 'ls' to list the contents.",
        expectedCommand: "ls",
        hint: "ls stands for 'list'",
        successMessage: "You can see the files and folders in your current directory!",
        output: "Desktop  Documents  Downloads  Music  Pictures  projects",
      },
      {
        instruction: "Let's move into the Documents folder. Type 'cd Documents'.",
        expectedCommand: "cd Documents",
        hint: "cd stands for 'change directory'",
        successMessage: "You've moved into Documents! Notice how the path changed.",
        output: "",
      },
      {
        instruction: "Check where you are now with 'pwd'.",
        expectedCommand: "pwd",
        hint: "Use pwd again to confirm your location",
        successMessage: "You're now in /home/user/Documents. You've mastered basic navigation!",
        output: "/home/user/Documents",
      },
    ],
  },
  {
    id: "2",
    title: "Creating Things",
    description: "Learn to create files and directories with touch and mkdir",
    icon: "add-circle",
    category: "Files",
    xpReward: 60,
    difficulty: "beginner",
    steps: [
      {
        instruction: "Let's create a new folder called 'projects'. Type 'mkdir projects'.",
        expectedCommand: "mkdir projects",
        hint: "mkdir stands for 'make directory'",
        successMessage: "You created a new directory called 'projects'!",
        output: "",
      },
      {
        instruction: "Now move into it with 'cd projects'.",
        expectedCommand: "cd projects",
        hint: "Use cd to change into the new directory",
        successMessage: "You're now inside the projects folder!",
        output: "",
      },
      {
        instruction: "Create an empty file called 'readme.txt' using 'touch readme.txt'.",
        expectedCommand: "touch readme.txt",
        hint: "touch creates a new empty file",
        successMessage: "You created readme.txt! The touch command creates empty files.",
        output: "",
      },
      {
        instruction: "Verify the file exists with 'ls'.",
        expectedCommand: "ls",
        hint: "List the directory to see your new file",
        successMessage: "There it is! You can now create files and folders like a pro.",
        output: "readme.txt",
      },
    ],
  },
  {
    id: "3",
    title: "Reading Files",
    description: "Learn to view file contents with cat, head, and tail",
    icon: "document-text",
    category: "Viewing",
    xpReward: 60,
    difficulty: "beginner",
    steps: [
      {
        instruction: "Let's read a file. Type 'cat notes.txt' to see its contents.",
        expectedCommand: "cat notes.txt",
        hint: "cat displays the entire file content",
        successMessage: "cat shows the whole file at once!",
        output: "Welcome to Linux!\nThis is a text file.\nYou're doing great!\nKeep learning commands.\nPractice makes perfect.",
      },
      {
        instruction: "For long files, use 'head notes.txt' to see just the first few lines.",
        expectedCommand: "head notes.txt",
        hint: "head shows the beginning of a file",
        successMessage: "head shows the first 10 lines by default!",
        output: "Welcome to Linux!\nThis is a text file.\nYou're doing great!",
      },
      {
        instruction: "Now try 'tail notes.txt' to see the last few lines.",
        expectedCommand: "tail notes.txt",
        hint: "tail shows the end of a file",
        successMessage: "tail is perfect for checking log files!",
        output: "Keep learning commands.\nPractice makes perfect.",
      },
    ],
  },
  {
    id: "4",
    title: "Copy & Move",
    description: "Learn to copy, move, and rename files with cp and mv",
    icon: "copy",
    category: "Files",
    xpReward: 70,
    difficulty: "intermediate",
    steps: [
      {
        instruction: "Make a copy of a file. Type 'cp report.txt backup.txt'.",
        expectedCommand: "cp report.txt backup.txt",
        hint: "cp copies the first file to create the second",
        successMessage: "You made a backup copy of your file!",
        output: "",
      },
      {
        instruction: "Verify both files exist with 'ls'.",
        expectedCommand: "ls",
        hint: "List to confirm the copy worked",
        successMessage: "Both files are there!",
        output: "backup.txt  report.txt",
      },
      {
        instruction: "Rename backup.txt to archive.txt using 'mv backup.txt archive.txt'.",
        expectedCommand: "mv backup.txt archive.txt",
        hint: "mv can rename files when the destination is in the same directory",
        successMessage: "mv is used for both moving AND renaming files!",
        output: "",
      },
      {
        instruction: "Confirm the rename with 'ls'.",
        expectedCommand: "ls",
        hint: "Check the directory listing",
        successMessage: "File renamed successfully! cp copies, mv moves or renames.",
        output: "archive.txt  report.txt",
      },
    ],
  },
  {
    id: "5",
    title: "Deleting Stuff",
    description: "Learn to safely remove files and directories with rm",
    icon: "trash",
    category: "Files",
    xpReward: 70,
    difficulty: "intermediate",
    steps: [
      {
        instruction: "Remove a file with 'rm old_file.txt'.",
        expectedCommand: "rm old_file.txt",
        hint: "rm removes files permanently - be careful!",
        successMessage: "File deleted! Remember: rm is permanent, there's no trash can!",
        output: "",
      },
      {
        instruction: "Check it's gone with 'ls'.",
        expectedCommand: "ls",
        hint: "List the directory",
        successMessage: "The file is gone forever! Always double-check before using rm.",
        output: "important.txt  projects",
      },
      {
        instruction: "To remove a directory, you need 'rm -r'. Type 'rm -r old_folder'.",
        expectedCommand: "rm -r old_folder",
        hint: "-r means recursive - it deletes the folder and everything inside it",
        successMessage: "The -r flag removes directories and all their contents!",
        output: "",
      },
    ],
  },
  {
    id: "6",
    title: "Finding Text",
    description: "Search inside files with grep",
    icon: "search",
    category: "Text",
    xpReward: 80,
    difficulty: "intermediate",
    steps: [
      {
        instruction: "Search for the word 'error' in a log file. Type 'grep error server.log'.",
        expectedCommand: "grep error server.log",
        hint: "grep searches for text patterns in files",
        successMessage: "grep found all lines containing 'error'!",
        output: "[ERROR] Connection timeout at 14:32\n[ERROR] Database unreachable at 15:01\n[ERROR] Auth failed for user admin",
      },
      {
        instruction: "Now do a case-insensitive search with 'grep -i warning server.log'.",
        expectedCommand: "grep -i warning server.log",
        hint: "-i makes the search case-insensitive",
        successMessage: "The -i flag finds Warning, WARNING, warning - all variations!",
        output: "[WARNING] Disk usage at 85%\n[Warning] Memory low\n[warning] Slow query detected",
      },
      {
        instruction: "Count how many lines match with 'grep -c error server.log'.",
        expectedCommand: "grep -c error server.log",
        hint: "-c counts the matching lines instead of showing them",
        successMessage: "grep -c gives you just the count. Super useful for log analysis!",
        output: "3",
      },
    ],
  },
  {
    id: "7",
    title: "Permissions",
    description: "Understand and change file permissions with chmod",
    icon: "lock-closed",
    category: "Permissions",
    xpReward: 90,
    difficulty: "advanced",
    steps: [
      {
        instruction: "Check file permissions with 'ls -la'.",
        expectedCommand: "ls -la",
        hint: "-la shows detailed listing with permissions",
        successMessage: "The first column shows permissions: r(read) w(write) x(execute)!",
        output: "total 16\ndrwxr-xr-x  2 user user 4096 Jan 15 10:00 .\n-rw-r--r--  1 user user  256 Jan 15 09:30 config.txt\n-rw-r--r--  1 user user  512 Jan 15 09:45 script.sh",
      },
      {
        instruction: "Make script.sh executable with 'chmod +x script.sh'.",
        expectedCommand: "chmod +x script.sh",
        hint: "+x adds execute permission",
        successMessage: "The script is now executable! You could run it with ./script.sh",
        output: "",
      },
      {
        instruction: "Verify the change with 'ls -la'.",
        expectedCommand: "ls -la",
        hint: "Check the permissions again",
        successMessage: "See the 'x' in the permissions? That means executable!",
        output: "total 16\ndrwxr-xr-x  2 user user 4096 Jan 15 10:00 .\n-rw-r--r--  1 user user  256 Jan 15 09:30 config.txt\n-rwxr-xr-x  1 user user  512 Jan 15 09:45 script.sh",
      },
    ],
  },
  {
    id: "8",
    title: "Who Am I?",
    description: "Learn about system info commands",
    icon: "person",
    category: "System",
    xpReward: 50,
    difficulty: "beginner",
    steps: [
      {
        instruction: "Find out your username with 'whoami'.",
        expectedCommand: "whoami",
        hint: "whoami displays the current user",
        successMessage: "You are 'user'! This is your Linux username.",
        output: "user",
      },
      {
        instruction: "See your home directory with 'echo $HOME'.",
        expectedCommand: "echo $HOME",
        hint: "$HOME is an environment variable for your home directory",
        successMessage: "Environment variables store system info. $HOME points to your home!",
        output: "/home/user",
      },
      {
        instruction: "Print a message with 'echo Hello Linux'.",
        expectedCommand: "echo Hello Linux",
        hint: "echo prints whatever text you give it",
        successMessage: "echo is one of the most basic but useful commands!",
        output: "Hello Linux",
      },
    ],
  },
];

export const challenges: Challenge[] = [
  {
    id: "c1",
    title: "Lost in the Filesystem",
    description: "Find your way to the home directory",
    icon: "navigate",
    xpReward: 30,
    difficulty: "beginner",
    task: "You're lost! Navigate to your home directory using a single command.",
    hints: ["There's a shortcut to go home...", "Try cd with a special character"],
    acceptedCommands: ["cd ~", "cd", "cd $HOME", "cd /home/user"],
    output: "",
  },
  {
    id: "c2",
    title: "Create a Project",
    description: "Set up a project structure",
    icon: "folder-open",
    xpReward: 40,
    difficulty: "beginner",
    task: "Create a new directory called 'my-app' for your project.",
    hints: ["Use the make directory command", "The command starts with 'mk'"],
    acceptedCommands: ["mkdir my-app"],
    output: "",
  },
  {
    id: "c3",
    title: "Find the Bug",
    description: "Search through a log file for errors",
    icon: "bug",
    xpReward: 50,
    difficulty: "intermediate",
    task: "Search for lines containing 'error' in the file 'app.log'.",
    hints: ["Which command searches text inside files?", "Think g-r-e-p"],
    acceptedCommands: ["grep error app.log", "grep 'error' app.log", "grep \"error\" app.log"],
    output: "[2024-01-15] error: null pointer exception\n[2024-01-15] error: connection refused",
  },
  {
    id: "c4",
    title: "Backup Mission",
    description: "Make a backup of an important file",
    icon: "shield-checkmark",
    xpReward: 40,
    difficulty: "beginner",
    task: "Copy 'database.sql' to a backup called 'database_backup.sql'.",
    hints: ["Which command copies files?", "cp [source] [destination]"],
    acceptedCommands: ["cp database.sql database_backup.sql"],
    output: "",
  },
  {
    id: "c5",
    title: "Clean Up",
    description: "Remove unnecessary files",
    icon: "trash-bin",
    xpReward: 50,
    difficulty: "intermediate",
    task: "Remove the file called 'temp.log' from the current directory.",
    hints: ["Which command removes files?", "Be careful with this command!"],
    acceptedCommands: ["rm temp.log"],
    output: "",
  },
  {
    id: "c6",
    title: "Make It Run",
    description: "Give a script execute permissions",
    icon: "flash",
    xpReward: 60,
    difficulty: "intermediate",
    task: "Make 'deploy.sh' executable so you can run it.",
    hints: ["You need to change permissions", "Add the execute permission"],
    acceptedCommands: ["chmod +x deploy.sh", "chmod 755 deploy.sh", "chmod 777 deploy.sh"],
    output: "",
  },
  {
    id: "c7",
    title: "Rename the File",
    description: "Rename a file without copying it",
    icon: "create",
    xpReward: 40,
    difficulty: "beginner",
    task: "Rename 'draft.txt' to 'final.txt'.",
    hints: ["Which command moves or renames?", "mv can rename files"],
    acceptedCommands: ["mv draft.txt final.txt"],
    output: "",
  },
  {
    id: "c8",
    title: "Word Count",
    description: "Count the lines in a file",
    icon: "calculator",
    xpReward: 50,
    difficulty: "intermediate",
    task: "Count the number of lines in 'data.csv'.",
    hints: ["There's a command for counting", "wc with a flag for lines only"],
    acceptedCommands: ["wc -l data.csv", "wc data.csv"],
    output: "42 data.csv",
  },
  {
    id: "c9",
    title: "Sort It Out",
    description: "Sort the contents of a file",
    icon: "swap-vertical",
    xpReward: 50,
    difficulty: "intermediate",
    task: "Sort the names in 'users.txt' alphabetically.",
    hints: ["There's a command specifically for sorting", "It's called... sort"],
    acceptedCommands: ["sort users.txt"],
    output: "alice\nbob\ncharlie\ndave\neve",
  },
  {
    id: "c10",
    title: "Secret Identity",
    description: "Find out who you are",
    icon: "finger-print",
    xpReward: 20,
    difficulty: "beginner",
    task: "Display your current username.",
    hints: ["There's a command that tells you who you are", "who... am... I?"],
    acceptedCommands: ["whoami"],
    output: "user",
  },
];

export function getCommandsByCategory(): Record<string, Command[]> {
  const grouped: Record<string, Command[]> = {};
  commands.forEach((cmd) => {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = [];
    }
    grouped[cmd.category].push(cmd);
  });
  return grouped;
}

export function getLessonsByDifficulty(): Record<string, Lesson[]> {
  const grouped: Record<string, Lesson[]> = {};
  lessons.forEach((lesson) => {
    if (!grouped[lesson.difficulty]) {
      grouped[lesson.difficulty] = [];
    }
    grouped[lesson.difficulty].push(lesson);
  });
  return grouped;
}
