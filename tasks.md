# Companion Products — Implementation Tasks

Source of truth for scope: [`COMPANION_PRODUCTS.md`](./COMPANION_PRODUCTS.md). Read the relevant section there before starting any task below — this file is the task breakdown, not the spec.

**Stack decisions:** Next.js (TypeScript) for all three new products. Each product is its **own repo** (`bonnetid-admin`, `bonnetid-display`, `bonnetid-tv`), all reading/writing the **same Supabase project** this repo already uses (`gsutnlmtvsbwvaslcgfa`).

**⛔ No schema changes.** The Supabase schema is off-limits — no new tables, no new columns, no altered types, no RLS policy changes. Turns out this barely constrains anything: the schema **already implements almost this entire spec** (see Phase 0's table map) — it was clearly built for this exact feature set already, just never got a UI. Every task below is scoped to read/write the existing tables as they are. A handful of genuine gaps exist where the Figma mockup shows something the schema can't currently store — those are called out explicitly, not papered over, in **Phase 0 § Open gaps**.

Task IDs: `ADM-n` (Admin Panel), `DISP-n` (User Display), `TV-n` (TV signage), `X-n` (cross-product). Check off `- [ ]` → `- [x]` as completed. Each task should end with a working, buildable state.

---

## Phase 0 — Existing Supabase schema map (read first, build nothing)

Do this once, before touching any product repo: read this map, skim the actual tables in the Supabase dashboard, then start on Phase 1. There is no "backend build" phase — it already exists.

### Table map (admin feature → real table/columns)

| Admin feature (COMPANION_PRODUCTS.md §1) | Backing table(s) | Notes |
|---|---|---|
| Masjid Registration (registry, BRREG, sub-orgs) | `mosque_t` (pk `organisasjonsnummer`) | `reg_navn`/`reg_adresse`/`reg_postnummer`/`reg_poststed`/`reg_kommune`/`reg_kommunenummer`/`reg_landkode`/`reg_hjemmeside` are the BRREG-sourced fields (already populated for real masjids, e.g. AL-NOOR ISLAMIC CENTRE, MSiT). `org_name2`/`org_info` are the editable "Alternative Name"/"Masjid Information" fields. `logo` stores a Supabase Storage URL (bucket `mosques`, path `{org_no}/logo/...` — already in use). Sub-orgs are just regular `mosque_t` rows whose PK has a `_1` suffix appended to the parent org number (confirmed in production data, e.g. `956708923_1`) — **no separate sub-org table needed.** |
| Language & Masjid info | `mosque_t` (`language`, `asr_method`, `prayer_method`, `extremeperiod_start`/`_end`/`_startdate`/`_enddate`) | Per-masjid override of the same fields that also exist on `location_t` as location-level defaults — masjid row wins when set. |
| Jamaat time configuration | `mosque_jamatperiode` (period `start_date`/`end_date`, per-prayer time + `_offset` columns) + `mosque_jummah` (`jummah` time, `jamat_id` → `mosque_jamatperiode.id`) | **Multi-jamaat / "Jamaat 1/2/3" is just multiple `mosque_jummah` rows pointing at the same `jamat_id`** — no new columns needed for that feature. |
| Eid times | `mosque_t.eidprayer_time1`/`_time2`/`_time3` + `mosque_t.show_eid` (bool) | Fixed 3 slots — matches the "Jamaat 1/2/3" Eid columns seen in the TV/tablet mockups exactly. `show_eid` is the "Display in Masjid" toggle. |
| Display Layout configuration | `themes_master` (9 rows: Prayer hall 1/2/3, Lobby 1/2/3, User display 1/2/3 — full JSON component-tree layouts with `{{placeholder}}` tokens, background image paths, `display_image` thumbnail) + `layout` (one row per mosque: `prayerhall_theme_id`/`lobby_theme_id`/`ud_theme_id` FKs + `prayerhall_layout`/`lobby_layout`/`ud_layout` — a **per-mosque deep copy** of the chosen theme's JSON, with `textColor`/`extraInfoColor`/`prayerTimesColor` overridable) | This is a real templating engine, already built. "Customize" in the Admin Panel = picking a theme (sets the FK + seeds the copy) then editing the color fields inside the mosque's own `layout.*_layout` JSON blob. **Background images are static per-theme assets (paths like `/theme-background-images/Theme 1/Theme1_light.png`), not admin-uploaded per mosque** — see Open gaps. |
| Announcements and multimedia | `multimedia` (`mosque_id`, `path`, `order`, `type`, `enabled`) + `mosque_t.announcement` (ticker text) + `mosque_t.multimedia_duration` (single duration, applies to all media items for that mosque) | See Open gaps for the per-item-duration and "push message" mismatches vs. the Figma mockup. |
| Adhan Widget configuration | `adhan_audio` (`mosque_id`, `fajr`/`dhuhr`/`asr`/`maghrib`/`isha`/`jumuah` — URL strings) | 1:1 match with the mockup. |
| Admin Info (users + roles) | `users` (`mosque_id`, `email`, `name`, `phone`, `role_code`) + `users_roles` (`user_id`, `role_id`) + `roles_master` (6 rows: **Masjid Admin, Jamaat Time, Display Layout, Announcements, Adhan Widget, Read Only**) | `roles_master` is **per-mosque feature scoping**, not the "Super Admin"/"IRN Admin" global distinction shown in the Figma mockup — see Open gaps. `users.role_code` looks like a legacy/duplicate of the `users_roles` join; check which one the app actually reads before wiring writes to both. |
| Hijri Dates — Months tab | `hijri_month` (`hijri_date_month`, `name_short`, `name_long`, `no`/`en`/`ar`) | 12 rows already seeded. |
| Hijri Dates — Yearly Events tab | `hijri_yearly_events` (`hijri_date_month`, `hijri_date_day`, `no`/`en`/`ar`) | **This resolves the "fields unconfirmed" flag from COMPANION_PRODUCTS.md §1** — 8 rows already seeded (Aashura, Mawlid an-Nabi, etc.), schema is just month+day+3-language label, no per-year data (it recurs by definition). |
| Hijri Dates — Date Mapping tab | `hijri_date_mapping` (`hijri_date_year`, `_month`, `_day`, `gregorian_date`, `remark`) | 132 rows. |
| Hijri Dates — Generate Table tab | Likely writes `hijri_date_mapping` **and** regenerates `hijri_dates` (3,901 rows — a denormalized per-Gregorian-date cache with `special_date_no`/`_en`/`_ar` inlined, used for fast lookup by the consumer app). Confirm this two-table relationship with whoever owns the existing generation logic (if any exists server-side already) before building ADM-12's Generate flow from scratch. |
| Location Management | `location_t` (pk `location_iso`, `location_name`, `lat_n_s`, `long_e_w`, `location_info`, `fylke_name`, `kommune_name`, `kommune_no`, `country_name`, plus location-level `asr_method`/`prayer_method`/`extremeperiod_*` defaults) + `location_postnumber` (postal code → `location_iso` lookup) | `fylke_name` = "county" in the mockup's English labels. |
| Prayer Time Configuration | `prayertime` (pk `date`+`location_iso`+`prayer_method`, ~32 astronomical columns — already exact 1:1 match with COMPANION_PRODUCTS.md §1's row list: `istiwa_noon`, `duhr`, `asr`, `shadow_1x`/`_2x`, `wusta_noon_sunset`, `asr_endtime`, `ghrub_sunset`, `maghrib`, `isha`, `shafaqal_ahmar_end_redlight`, `shafaqal_abyadh_end_whitelight`, `muntasafallayl_midnight`, `fajr_sadiq`, `fajr`, `fajr_endtime`, `shuruq_sunrise`, `laylat_falakia_one3rd`/`_two3rd`, `laylatal_shariea_one3rd`/`_two3rd`, `prayer_after_sunrise`, `altitude_noon`/`_midnight`, `sun_shadow_noon`/`_wusta`, `elevation_noon`/`_midnight`/`_asrwusta`/`_shadow_1x`/`_shadow_2x`) | 219,731 rows already populated — this table is live and in production use by the consumer app already (`src/api/endpoints.ts` reads it). **There is no separate "north/south" pair of tables** — the mockup's NORTH/SOUTH columns must map to two different `prayer_method` values on the same table (check `location_t.prayer_method` / existing app code for what method-id maps to which). There's also a legacy-looking `public.prayer_times` table (singular columns, 0 rows, simpler shape) — appears unused, don't build against it. |

### Auth & RLS as they exist today (no changes)

- RLS is already **public-read on everything**, and **"any authenticated Supabase user can write anything"** (`auth.uid() IS NOT NULL`, no row-scoping by mosque). There is no per-mosque write boundary at the database level — an authenticated admin for Masjid A could technically write Masjid B's rows via a direct API call. The Admin Panel UI must enforce "only your own masjid, only your granted `roles_master` scopes" itself, since the DB won't. **Flagged in Open gaps below — this is a real security gap, not something to silently patch by changing RLS (that's schema/policy work, out of scope per the no-schema-changes instruction). Surface it to the user before Admin Panel goes live with real masjid data.**
- Login (username/password) → this is Supabase Auth. `users.email` is the natural username; confirm whether existing `auth.users` rows already exist 1:1 with `public.users` rows, or whether auth accounts need to be created for the 41 existing `public.users` rows as part of ADM-2.

### Open gaps — genuine mismatches between the Figma mockup and the existing schema (product decisions needed, not schema changes)

- [ ] **X-1** ~~Confirm Hijri "Yearly Events" fields~~ — **resolved**, see table map above (`hijri_yearly_events` already exists with exactly the fields needed).
- [ ] **X-2** Reconcile the two Home screen variants (event-cards version vs. Language/Asr-Method-switcher version) with the designer before DISP-8. Flagged in COMPANION_PRODUCTS.md §2. Unrelated to schema.
- [ ] **X-3** Decide how the Admin Panel's Preview buttons (ADM-4) link out to the live User Display and TV apps — plain links, iframe embed, or something using `mosque_t.access_token_id` (a column that exists but is `NULL` on every sampled row — its intended purpose, likely a per-mosque display pairing/access token for unauthenticated TV/kiosk devices to fetch only their own mosque's data, is unconfirmed. Worth asking whoever built the schema before inventing a new mechanism).
- [ ] **X-4** Decide the actual TV hardware/kiosk target (Chromecast, Fire TV, Raspberry Pi + Chromium kiosk, smart TV browser, etc.) — affects TV-1's kiosk-mode setup.
- [ ] **X-5** "Portal Registrations: N new request" (pending self-service masjid signups awaiting approval, per COMPANION_PRODUCTS.md §1) has no obvious backing table or status column. **Proposed no-new-table workaround:** treat a `mosque_t` row with no matching `users`/`users_roles` entry yet as "pending" — confirm this interpretation with the product owner before building ADM-11's portal-registrations list on top of it, since it's inferred, not confirmed.
- [ ] **X-6** The Figma mockup's Admin Panel shows a "Super Admin" / "IRN Admin" top-level role distinct from `roles_master`'s 6 per-mosque feature scopes. No existing column cleanly models this (`users.mosque_id` being `NULL` is the closest candidate — "global/IRN staff user, not tied to one masjid" — but that's inferred, not confirmed). Resolve before ADM-16's role-gating work.
- [ ] **X-7** Announcements and multimedia mismatches vs. the mockup:
  - Per-media-item **Duration** (e.g. "5s") shown in the Figma mockup has no matching column on `multimedia` — only a single mosque-wide `mosque_t.multimedia_duration` exists. Decide: apply that one duration to every item (matches existing schema, simplest) or drop the per-item duration control from the UI to match reality.
  - The mockup's separate **"Push Message"** field (distinct from the announcement ticker message) has no dedicated column — only `mosque_t.announcement` exists. Decide: reuse `announcement` for both, or drop the Push Message field.
  - The "IRN default ad can only be disabled if masjid has its own ad" business rule needs an `is_irn_default`-equivalent flag to identify the default item — no such column exists on `multimedia`. Likely workaround: treat a fixed, well-known `mosque_id` (an "IRN default" pseudo-mosque row) as the source of default ads, or hardcode the default ad path in the app rather than in this table. Confirm before building ADM-7.
- [ ] **X-8** Confirm whether the app should read `users.role_code` or the `users_roles`/`roles_master` join for permission checks — both exist and currently hold matching values for all sampled rows, but only one should be the source of truth going forward (ADM-10/ADM-16 depend on this).
- [ ] **X-9** Confirm the north/south split in Prayer Time Configuration maps to two `prayertime.prayer_method` values on the single existing table, and find out (from existing app code or whoever built this schema) what those two method IDs are, before building ADM-15.

---

## Phase 1 — Admin Panel (new repo `bonnetid-admin`)

### Scaffold
- [ ] **ADM-1** `npx create-next-app` (TypeScript, App Router), Supabase client setup (reuse the publishable-key pattern from this repo's `src/api/supabase.ts` as a reference; the Admin Panel additionally needs an authenticated-write path per the RLS model above — no service role needed since RLS already allows any authenticated user to write), env vars, deploy target (Vercel recommended for Next.js).
- [ ] **ADM-2** Auth: login page (Username, Password, `LOGIN` button) wired to Supabase Auth. Resolve the `auth.users` ↔ `public.users` mapping question from Phase 0 first. Protected-route middleware; redirect unauthenticated users to login.
- [ ] **ADM-3** Global shell: top bar (IRN logo, "Bonnetid Admin" wordmark, page title, account dropdown, role label), left sidebar nav with the 3 groups (General / Settings / IRN Administration). **Blocked on X-6** for the IRN Administration gating specifically — build the shell now, wire the actual gate once X-6 is resolved.
- [ ] **ADM-4** "Preview" buttons (top-right on config screens: `Prayer Hall Screen`, `Lobby Screen`, `User Display`) — stub as external links now; wire to real URLs once DISP-1/TV-1 are deployed and X-3 is resolved.

### General
- [ ] **ADM-5** Jamaat time configuration screen — CSV upload, `From`/`To` period, per-prayer adhan(read-only, sourced from `prayertime`)/jamaat(dropdown)/offset(stepper) rows writing to `mosque_jamatperiode`, jumuah multi-slot add/remove writing multiple `mosque_jummah` rows against one `jamat_id`, eid time×3 + "Display in Masjid" toggle writing `mosque_t.eidprayer_time1/2/3` + `show_eid`, saved-periods table (list `mosque_jamatperiode` rows) with edit/delete, `CONFIRM`.
- [ ] **ADM-6** Display Layout configuration — 3 theme pickers reading `themes_master` filtered/grouped by type, writing the chosen id to `layout.prayerhall_theme_id`/`lobby_theme_id`/`ud_theme_id`; `Customize` sub-screen edits the color fields (`textColor`, `extraInfoColor.bg`/`.text`, `prayerTimesColor.bg`/`.text`) inside the mosque's own `layout.*_layout` JSON (seed it as a deep copy of the theme's `layout` JSON the first time a theme is picked, per the pattern already visible in existing `layout` rows). **No background-image upload** — that's a static per-theme asset, not a per-mosque field (see X-7's sibling gap, though this one isn't blocking, just different from the mockup).
- [ ] **ADM-7** Announcements and multimedia — resolve **X-7** first (duration, push message, IRN-default-flag gaps), then build: announcement message field → `mosque_t.announcement`, file/video upload → `multimedia` rows (`path`, `type`, `enabled`, `order`), media list UI with toggle/delete/reorder.
- [ ] **ADM-8** Adhan Widget configuration — per-prayer (Fajr/Dhuhr/Asr/Maghrib/Isha/Jumuah) audio upload or source URL, writing `adhan_audio`.

### Settings
- [ ] **ADM-9** Language & Masjid info screen — Language/Asr Method/Prayer Method/Prayer Phase dropdowns writing `mosque_t.language`/`asr_method`/`prayer_method`/`extremeperiod_*` (Custom Dates reveals `extremeperiod_startdate`/`_enddate`), masjid info fields writing `mosque_t`'s `org_name2`/`org_info`/`reg_*` columns, `Auto-fill Masjid details` button calling the BRREG lookup (ADM-11a) to populate the `reg_*` fields, masjid logo upload to the existing `mosques` Storage bucket (validate .png, square, 1080×1080) writing the resulting URL to `mosque_t.logo`.
- [ ] **ADM-10** Admin Info screen — admin users table (Name/E-mail/Roles/Contact/Action) reading `users` + `users_roles`/`roles_master`, add/edit/delete, per-feature role assignment UI against the 6 `roles_master` rows. **Resolve X-8** (role_code vs. users_roles) before wiring writes.

### IRN Administration
- [ ] **ADM-11** Masjid Registration:
  - (a) BRREG lookup: a Supabase Edge Function (or Next.js API route — Edge Function is more reusable across products) that takes an org number, calls the Brønnøysundregistrene public API server-side (avoids CORS), and returns fields to prefill `mosque_t`'s `reg_*` columns. This is the one piece of real backend work in this whole doc — it's a function, not a schema change.
  - (b) All Masjids: search + list from `mosque_t`, detail/edit view, `+ New Masjid` modal with 3 paths — sub-organization (create a new `mosque_t` row with `_1`-suffixed org number per the confirmed convention), BRREG (via 11a), manual entry.
  - (c) Portal Registrations pending list — **blocked on X-5** (no confirmed backing data for "pending"), don't build against invented state.
- [ ] **ADM-12** Hijri Dates Configuration — Months tab (`hijri_month`, 3-language description), Yearly Events tab (`hijri_yearly_events` — unblocked now per X-1 resolution), Date Mapping tab (`hijri_date_mapping`, year dropdown, "already exists" edit guard), Generate Table tab (`Generate` + overwrite confirmation) — **confirm the `hijri_date_mapping` ↔ `hijri_dates` regeneration relationship** (Phase 0 table map) before building this tab, so Generate doesn't leave the two tables out of sync.
- [ ] **ADM-13** Location Management — search + list (`location_t` columns) + add/edit/delete, plus `location_postnumber` lookup if the add-form needs postal-code autofill.
- [ ] **ADM-14** Prayer Time Configuration — **resolve X-9 first** (which `prayer_method` values are north/south). Date+location picker, the ~32-row time table against `prayertime` filtered by `location_iso`+`date`+`prayer_method`, `EDIT`/`SAVE`. Zip upload (north/south) is a bulk-import UI on top of the same table — clarify the expected zip format with whoever generates these files today. This is the most detail-heavy screen — budget extra time.

### Polish / QA
- [ ] **ADM-15** Role-gating tests: confirm each `roles_master` scope (Jamaat Time / Display Layout / Announcements / Adhan Widget / Read Only / Masjid Admin) actually restricts what a given admin user can edit in the UI, given the DB itself won't stop them (see the RLS note in Phase 0).
- [ ] **ADM-16** Form validation pass across every screen with a `CONFIRM`/`SAVE` (required fields, file type/size limits — .png 1080×1080 logos, media types).
- [ ] **ADM-17** Smoke test: every `CONFIRM`/`SAVE` button actually persists to the real Supabase tables and reloads with the saved state.

---

## Phase 2 — User Display (new repo `bonnetid-display`)

Read-heavy, public-facing. No auth needed — RLS already allows public read on every relevant table.

### Scaffold
- [ ] **DISP-1** `npx create-next-app` (TypeScript, App Router), Supabase client (publishable key only), env vars, deploy target. Should work as an embeddable/kiosk page.

### Shared components
- [ ] **DISP-2** Masjid search/select component, backed by `mosque_t` search (by `org_name2`/`reg_navn`).
- [ ] **DISP-3** County/kommune selector + "Reselection county" display, backed by `location_t` (`fylke_name`/`kommune_name`) and/or `district_t`/`country_t`.
- [ ] **DISP-4** Date navigator (prev/next arrows, gregorian + hijri date, "Choose from Calendar" link) — hijri conversion from `hijri_dates`.
- [ ] **DISP-5** Per-prayer table row component with mute/unmute speaker icon toggle. This toggle is local UI state (a display preference), not tied to `adhan_audio` — confirm with product owner whether it needs to persist anywhere.
- [ ] **DISP-6** Clock widget — 24-hour analog dial with prayer-period arcs, computed from `prayertime` columns for the selected location. Shared conceptually with TV-6 — separate repos, so port/copy the component rather than sharing a package unless you set up a shared UI package later.

### Screens
- [ ] **DISP-7** Landing page — county/kommune dropdowns, tagline, "Proceed" link.
- [ ] **DISP-8** Home screen — **resolve X-2 first**. Prayer table reads `prayertime` for the resolved location; Language/Asr Method quick-switchers are display-only unless tied to a per-visitor preference (clarify — likely just changes rendering, doesn't write anywhere).
- [ ] **DISP-9** Home - on selected masjid — Home + Jamaat column (from `mosque_jamatperiode`/`mosque_jummah`), masjid contact card + banner from `mosque_t`.
- [ ] **DISP-10** Important events screen — month nav, Hijri Calendar, event card list from `hijri_yearly_events`/`hijri_dates`.
- [ ] **DISP-11** Timetable family (Daily/Weekly/Monthly/Custom) — date-range query against `prayertime`, masjid info card from `mosque_t`, Download (CSV/PDF) generated client-side from the queried rows. Include the "IF NO MASJID SELECTED" empty state and the "View Timetable" flow.
- [ ] **DISP-12** Tablet / Infotainment layout — clock + controls + prayer table + multi-jamaat sub-table (from `mosque_jummah` grouped by `jamat_id`, and `mosque_t.eidprayer_time1/2/3`) + CALENDAR/Create-Timetable cards.
- [ ] **DISP-13** Layout with masjid info (tablet, masjid selected) — adds the masjid header band from `mosque_t` above the tablet body.
- [ ] **DISP-14** Events tab layout (tablet) — masjid header, full month Hijri calendar grid, event list.

### Data layer
- [ ] **DISP-15** Read-only query hooks for `prayertime`, `mosque_jamatperiode`/`mosque_jummah`, `hijri_*`, `mosque_t`, `location_t`. Mirror the existing consumer app's pattern (`src/api/endpoints.ts` + react-query hooks in `src/api/queries.ts` in this repo) for consistency, adapted to Next.js.

### Polish / QA
- [ ] **DISP-16** Verify the multi-jamaat sub-table only renders when a masjid actually has >1 `mosque_jummah` row for a given `jamat_id` (don't show empty Jamaat 2/3 columns).
- [ ] **DISP-17** Cross-device check: mobile width and tablet/infotainment width both render correctly from the same codebase.

---

## Phase 3 — Prayer Hall & Lobby (new repo `bonnetid-tv`)

Unattended, landscape (1280×720), runs in a browser/webview on a TV box. No user interaction after boot.

### Scaffold
- [ ] **TV-1** `npx create-next-app` (TypeScript, App Router), Supabase client (publishable key, read-only). **Resolve X-4** (actual kiosk hardware) before finalizing kiosk-mode setup (fullscreen on load, no browser chrome, watchdog reload on stale data).
- [ ] **TV-2** Realtime/polling data layer against `prayertime`, `mosque_jamatperiode`/`mosque_jummah`, `multimedia`/`mosque_t.announcement` — Supabase Realtime subscription preferred over polling for a screen that must never go stale.
- [ ] **TV-3** Theme rendering driven by `layout.prayerhall_layout`/`lobby_layout` (already a full JSON component tree — this screen is closer to "interpret the existing theme JSON" than "build a UI from scratch," reusing the `{{placeholder}}` substitution pattern already present in `themes_master`/`layout` rows) — not a hardcoded light/dark toggle.

### Shared components
- [ ] **TV-4** Live clock (HH:MM:SS) + gregorian/hijri date line.
- [ ] **TV-5** Countdown-to-next-prayer component, computed client-side from `prayertime`.
- [ ] **TV-6** Clock dial widget — same spec as DISP-6.
- [ ] **TV-7** Scrolling announcement ticker fed by `mosque_t.announcement`, prefixed by the live countdown.
- [ ] **TV-8** Event/class announcement card fed by `multimedia` rows.

### Screens
- [ ] **TV-9** Prayer Hall layouts — driven by whichever `themes_master`/`layout` JSON is selected for `prayerhall_theme_id`; multi-jamaat variant reads `mosque_jummah` grouped by `jamat_id` same as DISP-12.
- [ ] **TV-10** Iqamah interrupt screen — full-screen takeover triggered by comparing current time to the active `mosque_jamatperiode` jamaat time for the current prayer; must suppress/replace the normal layout and return automatically. Not present as its own `themes_master` row — this is app logic, not a theme.
- [ ] **TV-11** Masjid Lobby layouts — same data as Prayer Hall plus the event/class card (TV-8) and ticker (TV-7), driven by `lobby_theme_id`/`lobby_layout`.

### Polish / QA
- [ ] **TV-12** Long-running stability test: leave a display open for 24h+ across a day/date rollover and at least one iqamah trigger, confirm no memory leak, stale countdown, or stuck interrupt screen.
- [ ] **TV-13** Verify the shared Quran-stand illustration and other `multimedia` assets are swappable via the Admin Panel (ADM-7), not hardcoded into the TV app.

---

## Cross-product follow-ups

See **Phase 0 § Open gaps (X-1 … X-9)** — all cross-product blockers now live there, next to the schema facts they depend on, instead of listed separately.
