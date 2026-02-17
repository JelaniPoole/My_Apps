# Terminal Quest - Solo Leveling Edition

## Overview
A gamified Linux learning mobile app inspired by Solo Leveling anime. Users level up a hunter character by learning and practicing real Linux commands through dungeons (lessons), boss raids (challenges), and training sessions.

## Architecture
- **Frontend**: Expo/React Native with expo-router file-based routing
- **Backend**: Express server on port 5000
- **State**: React Context (ProgressProvider) with AsyncStorage persistence
- **Data**: Static linux-data.ts with lessons, challenges, commands

## Key Features
- **Hunter Dashboard**: Character profile with rank (E-S), level, XP bar, stats, daily quests
- **Stat System**: STR (file ops), INT (text processing), AGI (navigation), VIT (system), DEF (permissions)
- **Rank System**: E-Rank (LV1) through S-Rank (LV40) progression
- **Daily Quests**: 3 quests per day rotated by date, with claimable XP rewards
- **Dungeons**: 8 interactive lessons with step-by-step terminal commands
- **Boss Raids**: 10 challenges where you defeat bosses with the right command
- **Training Ground**: Free-form terminal simulator
- **Stats Page**: Detailed stats, rank progression, command reference

## Tab Structure
1. **Hunter** (index.tsx) - Dashboard with stats, daily quests, rank info
2. **Dungeons** (dungeons.tsx) - Lesson list, in-screen dungeon clearing with terminal
3. **Training** (terminal.tsx) - Free practice terminal
4. **Raids** (challenges.tsx) - Boss fight list with modal battle system
5. **Stats** (progress.tsx) - Detailed stats, achievements, command reference

## Theme
- Dark background (#0A0A12) with purple primary (#7B2FFF)
- Rank colors: E=gray, D=blue, C=green, B=yellow, A=orange, S=red
- Stat colors: STR=red, INT=blue, AGI=green, VIT=yellow, DEF=purple

## Important Files
- `constants/colors.ts` - Theme colors
- `lib/linux-data.ts` - All lesson/challenge/command data
- `lib/progress-context.tsx` - XP, stats, progress state management
- `components/TerminalView.tsx` - Reusable terminal simulator
- `app/(tabs)/_layout.tsx` - Tab navigation layout
