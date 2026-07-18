# Bønnetid — Companion Products Requirements

Feature/data scope for the three companion products designed alongside the consumer app: **Admin Panel** (web), **User Display** (mobile + tablet/infotainment), and **Prayer Hall & Lobby** (TV signage). The Figma design (`Bonnetid (Copy)`, 3 pages) is final and validated by a designer — this document captures **what** each screen needs (tabs, fields, data, flows), not how it looks. Implementation should follow the existing Figma visuals as-is.

All three products share one backend: the same Supabase tables that back the consumer app (`location_iso` keys like `NO0301` for Oslo, prayer time rows, hijri calendar rows), plus new tables/config the Admin Panel introduces (jamaat overrides, masjid registry, display themes, announcements, admin users).

---

## 1. Admin Panel

Web console for IRN staff and mosque admins to configure everything the consumer app, prayer-hall TV, lobby signage, and user-display show. Two roles observed: **Super Admin** and **IRN Admin** — the "IRN Administration" nav group is role-gated to these.

### Global shell (present on every screen)
- Top bar: IRN logo + "Bonnetid Admin" wordmark, page title, account (`Username` dropdown) + **Role** label (e.g. "Super Admin", "IRN Admin").
- Preview buttons (top-right, on config screens): `Prayer Hall Screen`, `Lobby Screen`, `User Display` — open live previews of the three display products.
- Left sidebar nav, grouped:
  - **General:** Jamaat time configuration · Display Layout configuration · Announcements and multimedia · Adhan Widget configuration
  - **Settings:** Language & Masjid info · Admin Info
  - **IRN Administration** (role-gated): Masjid Registration · Hijri Dates Configuration · Location Management · Prayer Time Configuration
- Most editor screens end with a `CONFIRM` or `SAVE` button (bottom-right).

### Auth

**Login** — Username (text), Password (text), `LOGIN` button.

### General — content/config screens

**Jamaat time configuration** — set jamaat (congregation) times per date period.
- Upload CSV file: `Upload` button + filename (e.g. `June.csv`).
- Period: `From` (date picker) `to` (date picker).
- Per-prayer rows (Fajr, Dhuhr, Asr, Maghrib, Isha): **Adhan** (read-only computed time), **Jamaat** (time dropdown), **Offset** (± stepper in minutes, e.g. `:05`).
- **Jumuah:** two time inputs (e.g. 13:00, 14:00) + `+` to add more jumuah slots.
- **Eid:** time input + toggle "Display in Masjid".
- Right panel: saved-periods table — columns **From, To, Prayer, Adhan, Jamaat, Offset**; per-row `Edit` / `Delete`.
- `CONFIRM`.

This is where the multi-jamaat slots shown on the TV/lobby screens and the User Display "Jamaat 1/2/3" columns get configured (see §3 and §2).

**Display Layout configuration** — pick + customize display themes.
- Three theme choosers, each with 3 thumbnail options (`Theme 1/2/3`): **Prayer Hall**, **Masjid Lobby**, **User Display**.
- Selecting a theme highlights it and reveals a `Customize` button.
- `CONFIRM`.
- **Customize sub-screen** (e.g. "Theme 1 - Prayer Hall"): live preview + controls — **Background:** `Upload image` OR color hex picker; **Font color:** hex picker; **Prayer Table color:** hex picker. `CONFIRM`.

**Announcements and multimedia** — messages + media rotation for lobby/hall.
- Enter Announcement Message (text; placeholder "IRN DEFAULT MESSAGE") — this is the scrolling ticker seen on the lobby TV screens.
- Enter Push Message (text).
- Upload File for Lobby Display: `Upload` (.ppt, .jpeg, .png, .mp4, .gif only) OR Video source URL (text).
- Media list items, each with: thumbnail preview, enable/disable toggle, delete (trash), **Order** (number), **Duration** (e.g. `5s`).
- Business rule (modal): "IRN ad can be disabled only if Masjid ad uploaded for display" — the default IRN ad can't be turned off until the masjid has uploaded its own ad.
- `CONFIRM`.

**Adhan Widget configuration** — adhan audio per prayer.
- Rows for Fajr, Dhuhr, Asr, Maghrib, Isha, Jumuah — each: `Upload` audio OR Source URL (text).
- `CONFIRM`.

### Settings

**Language & Masjid info** (frames labelled "LM default").
- Top dropdowns: **Language** (English / Norsk / Arabic / IRN Default) · **Asr Method** (1x / 2x / Wusta) · **Prayer Method** (North method / South method) · **Prayer Phase** (IRN default / Custom Dates — reveals a date-range input when set to Custom).
- **Masjid Info:** Masjid org no. (text) + `Auto-fill Masjid details` button (BRREG lookup) + `Edit` link. Fields: Masjid Name, Alternative Name, Street Address, Kommune, Kommune no., Post name, Post no., Country, E-mail, Mobile no., Website URL, Masjid Information (textarea).
- **Masjid Logo:** upload (must be .png, square, 1080×1080).
- `CONFIRM`.

**Admin Info** — manage admin users.
- `Add new admin` button.
- Table: **Name, E-mail, Roles, Contact, Action**. Roles are per-feature scopes (e.g. "Prayer time", "Display Layout", "Messages", "Jamaat time & Adhan widget", "Masjid Info"). Per-row `Edit` / `Delete`.
- `CONFIRM`.

### IRN Administration

**Masjid Registration** — directory + registration of masjids as org entities.
- **Portal Registrations: N new request** — pending self-service signups, each with `View`.
- **All Masjids:** search + `+ New Masjid`.
- Masjid detail/edit view: name, `EDIT`, `New sub-organization` button. Fields: Masjid org no., Masjid Name, Alternative Name, Street Address, Post no., Post name, Kommune no., Kommune, County code, County, E-mail, Mobile no., Website URL, Masjid Info (textarea), Masjid Logo upload.
- **New Masjid modal**, 3 paths:
  1. *Sub-organization* — enter main org number → `Proceed`
  2. *From The Brønnøysund Register Centre (BRREG)* — enter registered org number → `Proceed` (Norwegian company registry lookup, auto-fills the field set above)
  3. Manual entry → `Create`
- Sub-org numbers append `_1` to the parent org number (e.g. `956781235_1`).

**Hijri Dates Configuration** — sub-nav: **Months · Yearly Events · Date Mapping · Generate Table**.
- **Months:** table of 12 Hijri months — No., Month (short, text), Month (long, text), Description (3 localized inputs: `no`/`en`/`ar`, with edit). `SAVE`.
- **Yearly Events:** recurring Islamic events (Aashura, Mawlid an-Nabi, Shab-e-Miraj, Laylat-ul-Barat, etc.), each with no/en/ar labels — **exact field layout for this tab wasn't in the export; worth a direct look in Figma before building its data model.**
- **Date Mapping:** Year dropdown; table of Hijri Month · Hijri Date · Gregorian Date · month length (29/30 days). Guards against re-editing a year that already has data ("already exists, click EDIT"). `SAVE`.
- **Generate Table:** pick a year → `Generate` produces the full Hijri↔Gregorian calendar with event labels (no/en/ar). Overwrite confirmation dialog if the year already has data.

**Location Management** — geo/location directory (feeds `location_iso`; `NO0301` = Oslo).
- Search + `Add New Location info`.
- Table: Location iso, Location Name, Latitude, Longitude, Location Info, County, Municipality (+ edit/delete actions).
- Add-new form: same fields, `Cancel` / `Add`.

**Prayer Time Configuration** — core per-location prayer time table.
- Upload zip file (North) + Upload zip file (South), each with filename display (e.g. `2026_north.zip`).
- `Date:` picker · `Location:` dropdown.
- Two time columns, **NORTH** and **SOUTH**, one dropdown per row; `EDIT` toggles editability, `SAVE`.
- ~32 astronomical/prayer event rows: Istiwa Noon, Duhr, Asr, Shadow 1x, Shadow 2x, Wusta Noon Sunset, Asr End, Ghrub Sunset, Maghrib, Isha, Shafaqal ahmar (end redlight), Shafaqal abyadh (end whitelight), Muntasafallayl Midnight, Fajr sadiq, Fajr, Fajr end, Shuruq Sunrise, Laylat falakia one3rd/two3rd, Laylat shariea one3rd/two3rd, Prayer after sunrise, Altitude noon/midnight, Sun shadow noon/wusta, Elevation noon/asr wusta/shadow 1x/shadow 2x/midnight.

### Shared dropdown/option components
- **Asr Method:** 1x / 2x / Wusta
- **Prayer Method:** North method / South method
- **Prayer Phase:** IRN default / Local / Transition / Extremeperiod
- **Language:** English / Norsk / Arabic / IRN Default
- **Extremeperiod start:** IRN default / End dawn-dusk / Date
- **Extremeperiod end:** IRN default / Start dawn-dusk / Custom dates

### Notes / flagged gaps
- The 7 "Masjid Reg" Figma frames are states of one feature (list, detail/edit, new-masjid modal, BRREG-prefilled form, sub-org form) — not separate features. A couple were duplicate design iterations, already collapsed above.
- The several "hijri Date" frame copies are the Months/Date Mapping tabs at different scroll/edit states — collapsed above. **Yearly Events** wasn't directly exported; confirm its fields in Figma directly before implementing.
- The repeated small table-row components are Date Mapping / Generate Table rows (Hijri date + 3-language event label) — no new fields beyond what's listed.

---

## 2. User Display (mobile, tablet/infotainment)

Consumer-facing display screens — distinct from the existing Bønnetid RN app, this is a lighter public-facing view (e.g. embeddable/kiosk) built from the same data.

### Shared elements across most screens
- County/kommune selector (top-left), IRN logo (top-right).
- Masjid search/select ("Select Masjid" / "Search Masjid" with search icon).
- Date navigator: prev/next arrows, gregorian + hijri date, "Choose from Calendar" link.
- Per-prayer table with a mute/unmute speaker icon per prayer row (adhan-sound toggle), independent of the CMS-side Adhan Widget config in the Admin Panel.

### Landing page
Dark green background, "Find the ease of Praying in Norway!" tagline, County dropdown, Kommune dropdown, "Proceed" link.

### Home
- Masjid icon, date header (gregorian + hijri, prev/next day arrows), county/kommune reselector, "Select Masjid" search.
- Large digital clock (current wall-clock time) at top.
- Two inline quick-switchers: **"Language : English ▾"** and **"Asr Method : 1x ▾"**.
- Prayer table, columns **Adhan** / **Tomorrow** (next-day preview), rows FAJR, SUNRISE (no mute toggle — not an adhan prayer), DHUHR, ASR, MAGHRIB, ISHA. A hijri-day-rollover marker (e.g. "27 Shawwal 1446") appears mid-list where Isha crosses into the next hijri day.
- "CALENDAR — Look out for important dates and events" card.
- "Create your Prayer Timetable — View and download your custom prayer timetable" CTA card, with a "View Full Calendar" button (present in some theme variants).
- Some earlier iterations of this screen instead show a fuller "EVENTS & CALENDAR" section with 2 upcoming event cards (date + title) and a "See all" link — worth confirming with the designer which variant is final, since both appear in the file.

### Home - on selected masjid
Same as Home, but the prayer table gains a **Jamaat** column (Adhan / Jamaat / Tmrw), plus a masjid contact card (call icon, location icon) and a masjid name/description banner.

### Important events
County reselector, "EVENTS & CALENDAR" title, prev/next month arrows, a "HIJRI CALENDAR" card, and a list of event cards (date + title: Ramadan Begins, Eid-ul-Fitr, Day of Arafat, Eid-ul-Adha — all marked "(tentative)").

### Timetable (Daily / Weekly / Monthly / Custom)
One screen family switched via a Daily/Weekly/Monthly/Custom dropdown tab:
- Masjid search bar, county selector.
- Date navigator: single day w/ arrows (Daily), a week range e.g. "20-26 April" (Weekly), a month e.g. "April 2025" (Monthly), explicit `From`/`To` date pickers (Custom).
- Masjid info card (mosque icon, name, address + contact, "irn.no" watermark) containing the actual timetable grid — expected to be a table of dates × 5 prayers × adhan/iqamah times.
- "Download (CSV/PDF)" button.
- **Timetable -IF NO MASJID SELECTED**: same shell, "Select Masjid" placeholder and placeholder "Address / Contact info" text — the empty state before a masjid is chosen.
- **View Timetable -IF NO MASJID SELECTED**: a related step-by-step flow — starts at a masjid-search empty state and ends at a picked-masjid state ("Masjid A") with From/To range fields, a "Prayer Timetable" heading, and a "Download timetable" button.

### Tablet / Infotainment layout
Wide landscape variant (dark maroon theme) combining several mobile screens' info side by side:
- Left ~45%: the Clock dial widget (see below).
- Right, top: masjid search, Language + Asr Method switchers, date navigator, "Choose from Calendar".
- Right, middle: prayer table (Adhan/Tomorrow columns, Fajr/Sunrise/Dhuhr/Asr/Maghrib/[hijri rollover]/Isha), per-prayer mute icons.
- Below the standard prayers, a **multi-jamaat sub-table** with columns **Jamaat 1 / Jamaat 2 / Jamaat 3**:
  - Jumaah — up to 3 Friday congregation time slots
  - Eid — up to 2 Eid time slots
- Right, bottom: "CALENDAR" and "Create your Prayer Timetable" cards side by side.
- County selector + IRN logo span the full width at top.

**Layout with masjid info** is the same tablet layout with a masjid selected: adds a full-width masjid header band (mosque icon + selected masjid name in the search field, masjid name in large caps, description paragraph, contact/action icon row — phone, location pin, mosque/prayer-hall icons) above the clock + table body, separated by a divider. (In this variant the Jumaah/Eid sub-table isn't shown — likely conditional on data being configured.)

**Events tab layout** is another tab within Tablet/Infotainment: masjid header (name/address/contact), "EVENTS & CALENDAR" title, a full month Hijri calendar grid (day-of-week headers, numbered cells, month/year nav), and a list of event cards.

### Clock widget
A functional 24-hour analog dial (0 at bottom, 6 left, 12 top, 18 right) with an hour hand showing current time. The rim is divided into colored arcs marking prayer periods: Fajr, Fajr end, Sunrise, Dhuha, Dhuha end, Dhuhr, Asr (subdivided **Asr 1x / Asr 50% / Asr 2x**, matching the Asr Method setting), Asr end, Maghrib, Dusk, Isha, Thahajjud start/end. Radial labels for FAJR/DHUHR/ASR/MAGHRIB/ISHA/Istiwa point inward. Functions as both a live clock and a visual map of where "now" sits within the day's prayer windows — not decorative.

### UI components (reusable)
County dropdown, Reselection county (selected county as text + chevron), masjid search/select button, per-prayer mute/unmute toggle, Daily/Weekly/Monthly/Custom tab switcher.

---

## 3. Prayer Hall & Lobby (TV signage)

Large unattended landscape screens (1280×720) mounted in mosques. Every screen ships in **light and dark** theme pairs with identical fields — treat theme as a display setting, not a separate feature.

### Prayer Hall screens (1-4)
Numbered variants are alternate layout options for the same data (admin likely picks one per screen via the Display Layout config in §1), not a step flow:
- Masjid name (+ logo in dark variant), live clock (HH:MM:SS), gregorian + hijri date line.
- Countdown to next prayer (e.g. "Dhuhr in 00:31:13" or "Maghrib in 01:58:12").
- Per-prayer table: FAJR/DHUHR/ASR/MAGHRIB/ISHA, each with **Adhan** time, **Iqamah** time, and a **Tomorrow** preview column. Arabic prayer names shown alongside Latin.
- Extra rows: Sunrise, Fajr end, Jumuah, Eid.
- **Multi-jamaat support**: at least one layout variant (Prayer Hall - 3/4, Lobby - 4) replaces the single Dhuhr/Jumuah time with **Jamaat 1 / Jamaat 2 / Jamaat 3** columns — same feature configured in the Admin Panel's Jamaat time configuration screen.
- Placeholder lorem-ipsum text block present in some variants — reserved space for an announcement/info line (configured via Announcements and multimedia, §1).

### Iqamah screen
Full-screen interrupt/alert overlay (solid near-black background) shown right at iqamah time, replacing the normal board: "IQAMAH" heading, Arabic "قد قامت الصلاة" ("the prayer has begun"), the current prayer name large and bold (e.g. "MAGHRIB"), and a "Please keep your phones OFF or in silent mode" notice with a no-phones icon. No countdown or table — this is a full takeover, not an overlay banner.

### Masjid Lobby screens (1-3) and Lobby (4)
Same prayer-time data as the Prayer Hall screens, plus lobby-specific content:
- **Event/class announcement card**: title (e.g. "BEGINNER'S WEEKLY"), category tag (e.g. "TAJWEED"), date range (e.g. "Rajab to Ramadan"), schedule text (e.g. "Saturdays and Sundays 15:00 to 16:00"), registration URL (e.g. "Register at: www.masjid.domain"), an illustration/photo (a Quran-stand/Mushaf scene — reused across Prayer Hall 4/Lobby 4/Masjid Lobby 2), and a multi-dot carousel indicator (suggesting the card rotates through multiple announcements).
- **Scrolling announcement ticker** across the bottom, prefixed by the live next-prayer countdown (e.g. "Dhuhr in 00:31:12 | Announcement from admin | ..."). Ticker text is admin-configured (Announcements and multimedia, §1).
- Masjid Lobby - 2 lays the 5 prayers out as individual cards in a 2×3 grid (Fajr/Dhuhr/Asr on row 1; Maghrib/Isha + a "summary" card — Jumuah/Sunrise/Fajr End — on row 2) rather than a single table.

### Clock widget (standalone)
Same solar-position dial as the User Display Clock widget (§2) — Istiwa, Sunrise, Asr 1x/2x/50%, Dhuhr, Fajr, Maghrib, Isha, Dhuha, Thahajjud start marked around the rim.

### Notes
- The illustration used on Prayer Hall 4 / Lobby 4 / Masjid Lobby 2 (a wooden Quran stand holding an open Mushaf, framed Islamic relief-carving panel behind it) is one shared asset, not a unique graphic per screen — likely configurable as the default "class announcement" image, replaceable via the media upload in Announcements and multimedia (§1).
