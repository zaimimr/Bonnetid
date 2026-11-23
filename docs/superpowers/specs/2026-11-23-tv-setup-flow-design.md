# TV setup flow

Flow with mockups: https://claude.ai/artifact/K7N4HsAynUKo9KxUtx95nk

## Why

A volunteer in the mosque, often older, sets up the TV with a remote. Today they pick a single screen type. They need to choose which screens rotate, how long each shows and what each screen shows, without guessing.

## Decisions (user)

- Setup works with the remote alone, plus optional phone setup via QR code.
- The mosque picks the screens in the rotation and seconds per screen. Iqamah, Jumuah, Ramadan, taraweeh/dua, night and Eid still take over automatically and cannot be turned off.
- Per screen content: show/hide elements, own text slides, own image slides.

## Rules

1. One question per page on first run.
2. The live screen with the mosque's own times is always visible next to the question.
3. A good default is always selected. "Where is the screen?" fills in the rest.
4. Phone is a shortcut, never required.
5. Nothing can break: auto screens always come, Back undoes one step, everything saves instantly.

## First run (7 steps, "Steg n av 7")

1. Welcome: "Med mobilen" (QR) or "Med fjernkontrollen".
2. Mosque: kommune first, then mosque with address. Preview shows today's times.
3. "Hvor henger skjermen?": Bønnesal (main only), Inngang (lobby + plakat, 20 s), Kvinneavdeling (rad, hall "Kvinneavdelingen"), Kafé eller annet (plakat + lobby + posters, 20 s).
4. Screens in rotation: OK toggles, preview of the focused one, auto screens listed as fixed. At least one must stay on.
5. Seconds per screen: 10 / 20 / 30 / 60, preview plays the rotation with a progress bar. Skipped with one screen.
6. Color.
7. Summary in sentences, "Hold inne OK når du vil endre noe".

## Settings (hold OK or play/pause)

Menu: Skjermrunden (toggle, seconds, reorder), Tilpass en skjerm, Plakater, Utseende, Moské, Bruk mobilen (QR, "Lag ny kode"), Start oppsettet på nytt. Each page keeps today's layout: choices left, live screen right.

## Per screen toggles

| Screen | Options |
| --- | --- |
| Bønnesal | Fajr slutter, tidslinje, kunngjøring, Vipps, Hijri-dato, mønster |
| Inngang | kunngjøring, Vipps-kode, dagens tider |
| Reklameskjerm | kunngjøring, Vipps-QR |
| Sal 2 | tegning, romnavn |
| Iqamah | countdown start 5/10/15 min before |
| Jumuah | Friday Vipps collection |
| Taraweeh-dua | font, translation |
| Natt | dim screen (off by default) |

## Phone

QR opens a plain web page (no install). Drag to reorder, toggles, seconds, text posters, image posters, end date. TV shows "Oppdatert fra mobilen".

## Data

One config document per TV: mosque, rotation, seconds, per-screen options, posters. Stored locally on the TV, works offline. Phone edits go to our own Supabase (not IRN, read-only): `tv_screens(id uuid, secret, config jsonb, updated_at)`, security-definer RPC `tv_save(id, secret, config)`, storage bucket for images resized to 1920x1080 and cached on the TV. TV polls about every 30 s. Last write wins. "Lag ny kode" rotates the secret.

## Phases

1. TV only: wizard, rotation engine, per-screen toggles, settings menu, text posters via TV keyboard.
2. Phone: table + RPC, QR web page, reorder, text posters, new code.
3. Images: upload, resize, offline cache, end dates.

## Open

- Where the phone page is hosted (proposal: small separate site).
- OK to use our own Supabase project for TV config and images.
- Whether IRN needs to see what mosques upload.
