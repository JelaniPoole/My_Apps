# BLACKBOXAI Fix Plan: Hunter Tab Loading Issue

## Analysis Summary
Hunter tab (`app/(tabs)/index.tsx`) stuck on mobile because player fetch is `Platform.OS === 'web'` only. 
Server `/api/me` works (player.json has data). ProgressContext already syncs. 
**Fix**: Use `useProgress()` data (local+synced) everywhere, remove web-only fetch.

## Implementation Steps

### [ ] 1. Start Server (TODO orig #3)
```
cd server && npm install && node index.ts
```
- Verifies `/api/me` at localhost:5000/api/me

### [ ] 2. Clear Expo Cache (TODO orig #4)
```
npx expo start --clear
```
- Fresh start for testing

### [ ] 3. Fix Hunter Tab Code
**Edit `app/(tabs)/index.tsx`**:
- Remove web-only `fetch`/`player` state
- Use `const { ..., isLoaded } = useProgress();`
- Loading: `if (!isLoaded)`
- Display data from progress (level, xp, stats already computed)

### [ ] 4. Test All Tabs (TODO orig #5)
- [ ] Hunter loads instantly on mobile/web
- [ ] Dungeons/ Raids/ Stats work
- [ ] Local → server sync (check player.json)

### [ ] 5. Verify Progress Flow (TODO orig #6)
- Complete lesson/challenge → XP updates local + server

### [ ] 6. Completion
attempt_completion when all pass.

**Next**: Confirm this plan, then execute step 1 (server start).
