# Duas in Bønnetid

Date: 2026-09-25
Status: design approved in chat, spec awaiting review

## Goal

Give users a small, trustworthy set of well-known duas, both as a library they can browse and as
links in the places where a dua is actually said (after salah, at iftar, on Laylat-ul-Qadr).

The app's strength is that it is fast and focused. Content bloat is what users complain about in
Muslim Pro and Athan, so the feature stays small and has no audio, favourites or search in v1.

## Decisions made with the user

- Scope: both a library and links in context.
- Text: drafted by us from classical sources, reviewed and approved by IRN before release.
- Release gate: work happens on the `feat/duas` branch. Nothing is merged or pushed to `main`
  until the user approves, because the next release is cut from `main`.

## Content

About 40 duas in v1. Only duas with a sahih or hasan narration that are widely agreed on are
included. Every dua names its source so IRN can check it quickly.

Categories, in display order:

1. **Etter adhan** - the dua after the adhan and the testimony said with the muezzin.
2. **Etter bønnen** - the adhkar after salah (istighfar, Allahumma anta as-salam, tasbih 33/33/34,
   Ayat al-Kursi, the last three surahs), with repeat counts.
3. **Morgen og kveld** - a short core set of the morning and evening adhkar.
4. **Ramadan** - the iftar dua and the Laylat-ul-Qadr dua. The commonly shared "suhoor intention"
   dua is left out because it has no authentic narration.
5. **Hverdag** - before and after eating, sleeping and waking, leaving and entering the home,
   entering and leaving the mosque, wudu, travel.

Each dua has:

| Field | Example |
|---|---|
| `id` | `after-adhan` (stable, used in links) |
| `category` | `after-adhan` |
| `title` | Norwegian title, e.g. "Etter adhan" |
| `arabic` | Full Arabic text with harakat |
| `transliteration` | Latin transliteration |
| `meaning` | Norwegian meaning, written by us |
| `source` | e.g. "Sahih al-Bukhari 614" |
| `repeat` | optional count, e.g. 33 |

Existing English and Norwegian translations are copyrighted, so the Norwegian meanings are our own.
The Arabic text and the narrations themselves are classical and free to use.

## Where the content lives

A typed data file bundled with the app: `src/lib/duas.ts`. It exports the categories and the duas
plus two small lookups (`duasIn(category)`, `duaById(id)`). Pure data and pure functions, no hooks,
matching the `src/lib` convention.

Why bundled and not the database: the prayer-time database belongs to IRN and is read-only for the
app, the text changes rarely, and bundling means it works offline with no new network requests.
The cost is that a text correction needs an app update, which is acceptable.

## Screens

- **Mer** gets a "Duaer" feature card, next to Bønnesporing, Moskeer and Innstillinger.
- **`src/app/duas/index.tsx`** - the library. Categories as sections, each dua as a row with its
  title and, when present, its repeat count.
- **`src/app/duas/[id].tsx`** - one dua. Large Arabic text, right to left, then the
  transliteration, the Norwegian meaning, the repeat count and the source in muted text.
- Unknown `id` shows the existing empty state view instead of crashing.

Styling uses the existing primitives (`Screen`, `Card`, `ListRow`, `AppText`, `SectionHeader`) and
theme roles only. Arabic uses the system font, which covers Arabic on both platforms. Font scaling
follows the existing `AppText` caps; the Arabic line gets its own larger size and a relaxed line
height. No new tab: the four-tab bar stays as it is.

## Links in context

- **Oversikt**: one row "Duaer etter bønnen" under "Dagens bønnetider", linking to the library
  scrolled to that category.
- **RamadanCard**: a "Dua ved iftar" link to the iftar dua.
- **NightCard**: when the night is Laylat-ul-Qadr, a link to its dua.

All three link by `id` or category, so renaming a title never breaks a link.

## Out of scope for v1

Audio, favourites, search, sharing, a tasbih counter, notifications with duas, English text.
Each can be added later if users ask for it.

## Review and release

1. Build on `feat/duas`.
2. Produce a review document for IRN listing every dua with Arabic, transliteration, Norwegian
   meaning and source.
3. Apply IRN's corrections.
4. The user approves, then the branch is merged to `main`.

## Verification

- `npx tsc --noEmit` and `npx expo lint` pass.
- A data check (run with the lib test harness): unique ids, every category has at least one dua,
  every dua has non-empty `arabic`, `transliteration`, `meaning` and `source`, and every id used by
  a link exists.
- Simulator screenshots of the library, a dua page, the Oversikt row and the Ramadan card link, in
  light and dark mode and at a large font size.
