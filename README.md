# Bønnetid

Prayer times app for Muslims in Norway. Built with Expo, React Native and TypeScript. Data read directly from Supabase Postgres, cached on device for offline and Ramadan-scale load.

## Features

- Next prayer countdown and today's prayer times for any Norwegian kommune
- Nearby mosques with jamat and jummah times, list and map view
- Hijri calendar with upcoming Islamic events
- Qibla compass with distance to Mekka
- Halal scanner that reads a product barcode and reports what the ingredient list says

## Getting started

```bash
cp .env.example .env
npm install
npm start
```

Optional `.env` overrides (code falls back to the public project URL and publishable key):

```
EXPO_PUBLIC_SUPABASE_URL=<supabase project url>
EXPO_PUBLIC_SUPABASE_KEY=<publishable key>
```

Run on device with Expo Go, or `npm run ios` / `npm run android`.

## Architecture

```
src/
  app/          expo-router routes (tabs, modals, detail screens)
  theme/        design tokens, semantic light/dark themes, ThemeProvider
  api/          supabase client, endpoint functions with row mapping, react-query hooks
  components/   ui/ primitives + feature components (prayer, mosque, calendar, qibla)
  hooks/        useNow, usePrayerDay, useUserCoords, useCompassHeading
  lib/          pure helpers: time, prayer schedule, geo/qibla, hijri formatting
  store/        zustand settings store persisted to AsyncStorage
```

### Design tokens

All colors, spacing, radii and type sizes live in `src/theme/tokens.ts`. Semantic roles (background, surface, textPrimary, ...) map tokens per scheme in `src/theme/theme.ts`. Components only read semantic roles via `useTheme()`, so restyling the app means editing two files.
