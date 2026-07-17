# Bønnetid

Expo SDK 57 + React Native + TypeScript prayer times app for Norwegian Muslims. Data source: https://api.bonnetid.no (auth header `Api-Token: <token>`, token in `.env` as `EXPO_PUBLIC_API_TOKEN`).

## Commands

- `npm start` - dev server
- `npx tsc --noEmit` - typecheck
- `npx expo lint` - lint (react-compiler rules enabled, refs during render are errors)

## Conventions

- All styling reads semantic theme roles via `useTheme()` from `src/theme`. Never hardcode colors in components; add roles to `src/theme/theme.ts` and primitives to `src/theme/tokens.ts`.
- UI text is Norwegian bokmål.
- API layer: raw fetch in `src/api/client.ts`, endpoint functions in `endpoints.ts`, react-query hooks in `queries.ts`. Screens only consume hooks.
- Pure logic (time parsing, qibla bearing, hijri formatting, schedule building) lives in `src/lib` and takes explicit arguments, no hooks.
- Prayer time API dates are `dd-mm-yyyy`, hijri dates from `/dates/` are `yyyy-m-d`, from `/prayertimes/` are `d-m-yyyy`.
- Path alias `@/*` maps to `src/*`.
