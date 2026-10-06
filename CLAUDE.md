# Bønnetid

Expo SDK 57 (matches the App Store Expo Go; keep the SDK on the version Expo Go supports) + React Native + TypeScript prayer times app for Norwegian Muslims. Data source: Supabase Postgres (project `gsutnlmtvsbwvaslcgfa`) read directly via `@supabase/supabase-js` with the publishable key and public-read RLS. URL/key in `.env` as `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_KEY`. Locations are keyed by `location_iso` strings like `NO0301` (Oslo).

## Native surfaces (widgets + Live Activity)

The iOS widgets, lock screen accessories and the Dynamic Island Live Activity are Swift, so they
only run in a dev build - Expo Go cannot load them. The JS app still runs in Expo Go; the widget
bridge is a `requireOptionalNativeModule`, so every call no-ops there.

- Widget/Live Activity UI: `targets/widget/` (generated into Xcode by `@bacons/apple-targets`).
- Snapshot bridge + ActivityKit control: `modules/prayer-widget/` (local Expo module, Swift + Kotlin).
- Shared payload: `src/lib/widgetSnapshot.ts` writes absolute ISO instants into the app group
  `group.no.irn.bonnetid` (iOS) / SharedPreferences `prayer_widget` (Android). Widgets never call
  Supabase; they build a WidgetKit timeline from the snapshot, so they work offline.
- `targets/_shared/Snapshot.swift` compiles into every target (main app, widget, watch app,
  complication); `targets/widget/_shared/Theme.swift` into the widget and the main app.
- Siri/Snarveier: `plugins/withSiriShortcuts.js` copies `plugins/siri/` into the main app target,
  so `Metadata.appintents` lands in `Bnnetid.app`. The app targets iOS 16.4, so phrases are
  localized with `nb.lproj/AppShortcuts.strings`, not an xcstrings catalog.
- CarPlay (Driving Task): `plugins/withCarPlay.js` copies `plugins/carplay/` into the main app
  target and adds the CarPlay scene to the manifest `withSceneLifecycle.js` writes. Both plugins
  merge the manifest, so order does not matter. The car only reads the app-group snapshot.
- Apple Watch: `targets/watch` (app) and `targets/watchcomplication` (complications). The
  directory names must sort watch app first or the complication gets embedded in the iPhone app.
  The phone pushes a trimmed, lzfse-compressed snapshot over WatchConnectivity
  (`modules/prayer-widget/ios/PrayerWatchSync.swift`).
- `PrayerActivityAttributes.swift` exists twice on purpose (target + module). ActivityKit needs the
  same type in both binaries; keep the copies identical.
- `ios/` and `android/` are generated (CNG) and gitignored: `npx expo prebuild -p ios --clean`,
  then `npx expo run:ios`. A device or EAS build additionally needs `ios.appleTeamId` in app.json.

## Commands

- `npm start` - dev server
- `npx tsc --noEmit` - typecheck
- `npm test` - unit tests (`node --test` over `src/**/*.test.ts`, pure modules only, relative imports with `.ts` extension)
- `npx expo lint` - lint (react-compiler rules enabled, refs during render are errors)
- `npx expo run:ios` - local dev build, required for widget and Live Activity work
- `npm run ios:sim` - same dev build on the booted simulator via xcodebuild. Use it on Xcode 27+, which has no Simulator.app, so `expo run:ios` fails there

## Conventions

- All styling reads semantic theme roles via `useTheme()` from `src/theme`. Never hardcode colors in components; add roles to `src/theme/theme.ts` and primitives to `src/theme/tokens.ts`.
- UI text is Norwegian bokmål first, plus en/ar/ur. Text lives in `src/i18n/locales/<lang>/<namespace>.json`; components call `t('namespace.key', params)` from `@/lib/i18n` (i18next, keys typed from the nb files). Add a key to all four languages. Counts use `tCount(key, n)` with `_one`/`_two`/`_few`/`_other` keys, since Hermes lacks `Intl.PluralRules`. New namespaces go in `src/i18n/resources.ts`.
- Prayer name spelling, everywhere a human reads it: **Jumuah** (never "jummah", "Jummah" or "jumma") and **Dhuhr** (never "duhr" or "Duhr"). This covers UI strings, comments, commit messages, PR text and docs. The lowercase `duhr` and `jummah` identifiers stay as they are - they are Supabase column names and the app-facing types built on them, so renaming them would break the data layer.
- API layer: Supabase client in `src/api/supabase.ts`, fetch + row-to-app-type mapping in `endpoints.ts`, react-query hooks in `queries.ts`. Screens only consume hooks. DB rows never leak past `endpoints.ts`.
- Pure logic (time parsing, qibla bearing, hijri formatting, schedule building) lives in `src/lib` and takes explicit arguments, no hooks.
- App-facing date formats (kept from the old REST API): `PrayerDay.date` is `dd-mm-yyyy`, `HijriDay.hijri_date` is `yyyy-m-d`, `PrayerDay.hijri_date` is `d-m-yyyy`, `HijriDay.gregorian_date` is ISO `yyyy-mm-dd`. DB dates are ISO; DB times are `HH:MM:SS` and get trimmed to `HH:MM` in `endpoints.ts`.
- Offline/Ramadan caching: react-query cache persists to AsyncStorage (`_layout.tsx`, buster `v2`, maxAge 60 days). Prayer times/hijri data are immutable, so hooks use multi-day `staleTime` - most opens hit zero network. Bump the buster when changing cached data shapes.
- Path alias `@/*` maps to `src/*`.
- Telemetry is PostHog EU through `src/lib/telemetry.ts` (`track`, `trackError`, `posthog`). Sentry is gone. Feature flags via `useFeature(flag)` / `FeatureGate`, default ON unless PostHog returns `false`.
- Interruptions (review prompt, survey, what's new) go through `useSession().claimInterruption`, so at most one shows per session. New release notes go in `src/lib/whatsNew.ts`.

## Release freeze

- Ramadan 1448 starts 8 Feb 2027. From 15 Jan 2027 until Eid al-Fitr, ship only bug fixes: no new features, no dependency or SDK upgrades, no notification or schedule refactors. Users drop prayer apps that break during Ramadan.
- Daylight saving changes are covered by `src/lib/dst.test.ts`. Run it under several zones before a release that touches time code: `TZ=Asia/Karachi npm test`.
