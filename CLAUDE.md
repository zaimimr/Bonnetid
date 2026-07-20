# Bønnetid

Expo SDK 54 (max Expo Go supports; do not upgrade past 54 while Expo Go is the test client) + React Native + TypeScript prayer times app for Norwegian Muslims. Data source: Supabase Postgres (project `gsutnlmtvsbwvaslcgfa`) read directly via `@supabase/supabase-js` with the publishable key and public-read RLS. URL/key in `.env` as `EXPO_PUBLIC_SUPABASE_URL`/`EXPO_PUBLIC_SUPABASE_KEY`. Locations are keyed by `location_iso` strings like `NO0301` (Oslo).

## Commands

- `npm start` - dev server
- `npx tsc --noEmit` - typecheck
- `npx expo lint` - lint (react-compiler rules enabled, refs during render are errors)

## Conventions

- All styling reads semantic theme roles via `useTheme()` from `src/theme`. Never hardcode colors in components; add roles to `src/theme/theme.ts` and primitives to `src/theme/tokens.ts`.
- UI text is Norwegian bokmål.
- API layer: Supabase client in `src/api/supabase.ts`, fetch + row-to-app-type mapping in `endpoints.ts`, react-query hooks in `queries.ts`. Screens only consume hooks. DB rows never leak past `endpoints.ts`.
- Pure logic (time parsing, qibla bearing, hijri formatting, schedule building) lives in `src/lib` and takes explicit arguments, no hooks.
- App-facing date formats (kept from the old REST API): `PrayerDay.date` is `dd-mm-yyyy`, `HijriDay.hijri_date` is `yyyy-m-d`, `PrayerDay.hijri_date` is `d-m-yyyy`, `HijriDay.gregorian_date` is ISO `yyyy-mm-dd`. DB dates are ISO; DB times are `HH:MM:SS` and get trimmed to `HH:MM` in `endpoints.ts`.
- Offline/Ramadan caching: react-query cache persists to AsyncStorage (`_layout.tsx`, buster `v2`, maxAge 60 days). Prayer times/hijri data are immutable, so hooks use multi-day `staleTime` - most opens hit zero network. Bump the buster when changing cached data shapes.
- Path alias `@/*` maps to `src/*`.
