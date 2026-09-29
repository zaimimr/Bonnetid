# Prayed-in-mosque tracker (automatic, geofenced)

Status: parked for the future. Designed 2026-09-29, not implemented.

## Goal

The app knows when the user is at a mosque during a prayer window and marks that prayer as
"Bedt i moské" in the prayer log, with no interaction.

## User flow

- Off by default. Background location must be an explicit user choice (store requirement).
- Enabled from a card in the tracker and a row in settings. Enabling requests when-in-use, then
  "Always" location permission.
- Advanced setting "Følg alle moskeer i nærheten", default on. Off = only the user's own mosque is
  watched.
- A logged prayer shows a mosque mark and the mosque name in the tracker. Tapping it again undoes it.
- Hidden in Expo Go (background tasks only run in a dev build).

## Detection

- `expo-location` geofencing + `expo-task-manager`. Region radius 100 m. Mosques without `lat`/`lon`
  are skipped.
- The Expo API only reports enter and exit, no dwell, on both platforms. The task records visits
  `{ orgNr, name, enteredAt, exitedAt }`.
- A visit counts when it lasts 10 minutes or more. This filters out driving past.
- A visit is matched to every prayer whose window it overlaps by 10 minutes or more. A window runs
  from the prayer time to the next prayer time; Fajr ends at sunrise. Maghrib into Isha logs both.
- Jamat times are ignored. They are too stale to rely on (only 9 of 60 mosques have current times).

## Where logging happens

- The headless task only appends raw visits to AsyncStorage. It has no prayer schedule, so it does
  not decide which prayer a visit belongs to.
- Visits are resolved into log entries on app foreground and in the existing iOS background refresh
  task (`no.irn.bonnetid.refresh`). Widgets and tracker reflect the visit from then on.
- Rejected alternative: bake 30 days of prayer windows into storage so the task logs directly. More
  moving parts for little gain.

## Which mosques are watched

- "Nearest" mode: re-pick the 20 nearest mosques with coordinates on app open and on background
  refresh.
- iOS allows 20 regions: 19 mosques plus one large "moved" region around the current position.
  Exiting it re-picks from the last known position.
- "Only my mosque" mode: one region, no re-picking.

## Data

- `PrayerLogEntry` (`src/lib/prayerLog.ts`) gets optional `mosque?: { orgNr, name }`. Additive, no
  key bump. The Swift and Kotlin log parsers must be checked to ignore the extra field.
- A manual "Bedt" tap keeps an existing `mosque` on the entry.
- Visits are pruned after 60 days, like the log.
- Location plus religious practice is GDPR Article 9 data. On device only: nothing to Supabase,
  Sentry gets event counts only, never coordinates or mosque ids.

## Platform and stores

- New dependency: `expo-task-manager`.
- iOS: `NSLocationAlwaysAndWhenInUseUsageDescription`. Verify that region monitoring works without
  the `location` background mode.
- Android: `ACCESS_BACKGROUND_LOCATION`. Play requires a background location declaration and a demo
  video before release.

## Testing

- Pure logic in `src/lib/mosqueVisits.ts`: visit-to-prayer matching and nearest-mosque selection.
  Tested with the scratchpad lib test harness.
- Device: Android emulator with a test GPS provider, iOS simulator with a custom location.

## Open questions

- Whether a 10 minute dwell is right for short prayers (Maghrib at a mosque can be under 10 minutes).
- Whether Jumuah should get its own mark distinct from Dhuhr.
