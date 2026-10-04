# Eid mode

## Decisions (owner, 2026-10-04)

- Window: from Maghrib the evening before Eid until the Eid day ends (Norwegian midnight). Both Eid al-Fitr (1 Shawwal) and Eid al-Adha (10 Dhul Hijjah).
- Contents: Eid prayer in the hero with a countdown, Eid prayers at nearby mosques, whole-app re-skin like travel mode, Takbir card.

## Data reality

- Eid times come from `mosque_t.show_eid` + `eidprayer_time1/2/3` (freeform varchar), already mapped to `Mosque.show_eid` / `Mosque.eid_prayers` in `endpoints.ts`.
- Measured 2026-10-04: **0 of 250 mosques have Eid times** (columns seem to be cleared after each Eid). Every part of Eid mode must work with no Eid times at all. IRN should ask mosques to fill the times in before Eid.
- Eid dates come from the IRN hijri calendar (`hijri-year` query), so the eve is known in advance and needs no moon sighting logic. Eid al-Fitr 1448 = 2027-03-09.

## Pieces

1. **`src/lib/eidMode.ts`** (pure, unit tested): `eidModeAt(rows, now, eveMaghrib)` returns `{ eid, phase: 'eve' | 'day', eidIso } | null`. Eve starts at the Maghrib instant of the day before Eid; day ends at Oslo midnight after Eid.
2. **`useEidMode()`** hook: hijri lookahead (`useHijriLookahead`) + yesterday/today schedule for the Maghrib instant.
3. **Re-skin**: `eidTheme(base)` in `src/theme/theme.ts`, applied in `ThemeProvider` the same way as `travelTheme`. `EidBanner` in `Screen` next to `TravelBanner`: "Eid Mubarak" on the day, "Eid i morgen" on the eve.
4. **Hero**: `EidPrayerHero` replaces `NextPrayerHero` on Oversikt from the eve until 30 min after the last Eid prayer. Source order: my mosque if it has times, otherwise the nearest mosque with times, otherwise the normal hero. Multiple times are listed, the countdown targets the next one.
5. **Nearby Eid prayers**: section on Oversikt listing up to 5 mosques with Eid times, sorted by distance (shared position, else location centroid). Tap opens the mosque page. Hidden when no mosque has times.
6. **Takbir card**: shown for the whole window. Reuses the existing `takbir-dhul-hijjah` dua text through a general `takbir-eid` entry, with the Fitr/Adha note.
7. Telemetry: `eid_mode_viewed { eid, phase }`.

## Out of scope for v1

- Widgets, Live Activity and Android Live Update (JS only, so it can be tested in Expo Go).
- Push notifications for Eid prayer.

## Timing

- Eid al-Fitr 1448 (9 Mar 2027) is inside the Ramadan release freeze (from 15 Jan 2027). Eid mode has to ship before 15 Jan 2027.
- Test with the fake-clock recipe (memory `bonnetid-data-horizon`), eve = 2027-03-08 after Maghrib.

## Open questions

- Accent colour for the re-skin (proposal: the existing `seasonHighlight` gold).
- Abroad on Eid: travel mode keeps its skin and local times, and only the banner + Takbir card show? (proposal: yes, travel wins).
