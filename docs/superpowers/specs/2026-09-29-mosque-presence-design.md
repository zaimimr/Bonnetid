# "I moské" presence card

Status: approved design 2026-09-29, not implemented.

## Goal

When the user opens the app while standing in a mosque, Oversikt shows "Du er i moskeen" with the
mosque's name. The card is the entry point for mosque-specific features. Donation is the first
planned one and gets its own design (part 2).

## Scope

- Foreground only. Presence is checked on app open and on return to foreground. No background
  location, no geofencing, no new permission, no store declarations. Works in Expo Go.
- All mosques in the database count, not only the user's own mosque. 243 of 250 have `lat`/`lon`.
- Out of scope for this part: donation, switching Oversikt jamat times to the visited mosque, a
  dismiss button, a settings toggle, and logging the visit in the prayer tracker. The parked
  background tracker lives in `2026-09-29-mosque-attendance-design.md`.

## Detection

- Reuse the shared position store in `src/hooks/useTravelDetection.ts`. It already reads GPS on
  app open and on `AppState` `active`, throttled to once per 60 s, at `Accuracy.Balanced`.
- The position snapshot gains `accuracy` (metres, from `position.coords.accuracy`). Travel mode
  ignores it; nothing else about the store changes.
- New pure function in `src/lib/mosquePresence.ts`:
  `findMosquePresence(mosques, coords, accuracyM): { mosque, distanceM } | null`.
  - Skips mosques with `lat` or `lon` null.
  - Picks the nearest remaining mosque using `distanceKm` from `src/lib/geo.ts`.
  - Returns it only when `distanceM <= 100` and `accuracyM <= 75`. Both thresholds are named
    constants in the file.
  - Returns null when `coords` or `accuracyM` is null.
- When two mosques are close together, the nearest one wins. A wrong pick is accepted for now.
- No hysteresis. Position only updates on open and foreground, so the card cannot flicker.
- If `Balanced` proves too coarse inside mosques on a real device, switch the shared read to
  `Accuracy.High`. That is a one-line change and is not part of this design.

## Hook

- New `useMosquePresence()` in `src/hooks/`. It combines the shared position snapshot with
  `useMosques()` (static key, 3 day `staleTime`, so no new network requests) and calls
  `findMosquePresence`.
- Returns null on denied permission, coarse fix, missing coordinates, or mosques not loaded.

## UI

- New component `MosquePresenceCard` at the top of Oversikt (`src/app/(tabs)/index.tsx`), below
  the travel banner when one is shown.
- Content: mosque logo when present, the line "Du er i moskeen", and the mosque's display name.
- The whole card is pressable and opens `mosque/[orgNr]`.
- Uses the existing `Card` language and `useTheme()` roles. No new colours. Respects font scaling
  caps from `AppText`.
- Later features (donation first) attach to this card.
- Test donation: `src/lib/mosqueDonations.ts` hardcodes Al-Noor Islamic Centre (971258470) to
  Vipps Donasjoner 101598. The card and the mosque page show "Doner med Vipps", which opens
  `https://qr.vipps.no/donations/<number>?reference=bonnetid`. A real data source replaces the map later.

## Privacy and telemetry

- Location combined with religious practice is GDPR Article 9 data. Everything stays on device.
  Nothing goes to Supabase.
- Sentry gets `track('mosque_presence_shown')` once per mosque per app process (an in-memory set of shown ids), with no mosque id, name,
  distance or coordinates.

## Testing

- Pure logic in `src/lib/mosquePresence.ts` through the scratchpad lib test harness:
  - inside 100 m with good accuracy returns the mosque
  - just outside 100 m returns null
  - accuracy worse than 75 m returns null
  - two mosques within range returns the nearest
  - mosques without coordinates are skipped
  - null coords returns null
- Device: iOS simulator with a custom location set to a mosque's coordinates. The card appears on
  Oversikt and a tap opens the mosque page. Moving the location away and returning to foreground
  after 60 s hides it.
- Gates: `npx tsc --noEmit`, `npx expo lint`.
