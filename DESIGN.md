# Bønnetid design system

## Principles

- Light-first, calm, high contrast. Readable for all ages in daylight glances.
- No gradients, no glass, no decorative motion. Color marks state and brand only.
- Emerald `#0C6B52` is the single tint. Gold `#8F7112` only for rare accents (selection ring, "Under arbeid" badge).
- All times render with tabular numerals.

## Tokens

- Primitives: `src/theme/tokens.ts` (palette, spacing 2–40, radius 6–24+full, fontSize 12–40, weights, durations, pressed/disabled opacity).
- Semantic roles: `src/theme/theme.ts` (`background`, `surface`, `surfaceSunken`, `primary`, `primarySoft`, `textPrimary/Secondary/Muted`, `border`, `danger`, `success`, tab bar roles, `skeleton`, `overlay`). Light and dark map the same roles.
- Components consume roles via `useTheme()`; never raw hex in components.

## Component vocabulary

- `Screen` (safe area + scroll + refresh), `Card` (surface, 1px border, radius lg/xl), `AppText` (size/weight/tone props), `Button` (primary/secondary/ghost/danger, pill, min 44pt), `Badge`, `ListRow` (44pt min, chevron), `Skeleton` (pulse), `SectionHeader`, `EmptyState`/`ErrorState`.
- Segmented controls: sunken track, raised active segment with 1px border.
- Icons: Ionicons only, one style per screen.

## Motion

- 150–250 ms, state changes only: compass rose `withTiming` 200 ms, skeleton pulse, pressed opacity 0.7.

## Copy

- Norwegian bokmål. Short task-focused labels ("Velg moské", "Bruk min posisjon").
