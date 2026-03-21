# Linux Terminal Quest - Fix Errors & Complete TODO

## Current Issues from `npx expo start`
✅ Metro bundler starts successfully
⚠️  Icon warnings: "cpu", "package" invalid ionicons → fix icons in lib/linux-data.ts
❌ Player fetch error: localhost:5000 not accessible in Expo Go → start backend server

## Approved Plan Steps (Updated Tracker)
✅ 1. Create detailed TODO.md with steps ✓

✅ **Step 2: Fix invalid icons in lib/linux-data.ts**
- lesson id="10" icon: "cpu" → "cpu-outline"
- challenge id="c50" icon: "package" → "cube"

✅ **Step 3: Start backend server**
- Run `npx tsx server/index.ts` (Express server on :5000)

**Step 4: Complete data merge**
- Append full NEW_LESSONS/NEW_CHALLENGES from lib/new-lessons-challenges.ts to lib/linux-data.ts arrays

**Step 5: Extend TerminalView.tsx processCommand()**
- Add handlers for new commands (pipes, apt, git, etc.)

**Step 6: Handle player fetch fallback**
- Update app/(tabs)/index.tsx useEffect to use local progress if fetch fails

**Step 7: Balance XP/stats**
- Review rewards in lib/linux-data.ts

**Step 8: Test & Complete**
- Reload Metro (r), check no errors/warns
- Test tabs, terminal, QR scan
- Mark complete

## Progress
Data expanded! Backend ready. Fixing warnings/errors for clean production run.

**Next**: Fix icons (Step 2)
