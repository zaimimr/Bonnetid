# PostHog, Feedback, Surveys, What's New and Store Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Sentry with PostHog EU (analytics, errors, replay, flags, surveys, support) and add an in-app feedback thread, themed surveys, a what's-new sheet and moment-based store review prompts.

**Architecture:** Pure decision logic lives in `src/lib` with `node --test` unit tests (`reviewTrigger`, `whatsNew`, `featureFlags`, `surveyFlow`, `supportApi` payload helpers). One PostHog client is created in `src/lib/telemetry.ts` (same file name and `track`/`trackError` signatures, so the ~30 existing call sites are untouched). A non-persisted session store (`src/store/session.ts`) coordinates the three interruptions (review prompt, survey, what's new) so at most one appears per session.

**Tech Stack:** Expo SDK 57, expo-router, zustand, `posthog-react-native` 4.78+, `posthog-react-native-session-replay`, `@posthog/react-native-plugin`, Node 26 built-in test runner with type stripping.

**Spec:** `docs/superpowers/specs/2026-10-03-posthog-feedback-whatsnew-design.md`

## Global Constraints

- No code comments of any kind (user rule).
- Never use the em dash character anywhere (code, copy, commits).
- UI text is Norwegian bokmål. Prayer spellings: Jumuah, Dhuhr.
- All colors via `useTheme()`; no hardcoded colors in components.
- Screens consume hooks; pure logic in `src/lib` takes explicit arguments, no hooks.
- PostHog host `https://eu.i.posthog.com`. Key from `EXPO_PUBLIC_POSTHOG_KEY` (value `phc_mHT42fy8tgfizNdnsmfTLqs3HkCCBiws8Z8ske2NAiBg`, public by design). Project id `292238`.
- With no key, every telemetry export is a no-op and every feature flag reads as enabled.
- Feature flags default ON: a flag is off only when PostHog explicitly returns `false`.
- Flags: `duas`, `tasbih`, `mosque-donation`, `qibla-ar`, `prayer-tracker`.
- No sentiment question before the native review prompt.
- Commit messages: conventional prefix, no AI attribution lines of any kind.
- Hobby project: commit and push to `main` directly.
- Do not run prettier (repo has no prettier config).

## Review Focus

- Offline first launch: PostHog unreachable. Expect every flagged feature visible, no survey, no crash, support form shows the error with the mailto fallback. Pinned by `featureFlags.test.ts` (undefined means enabled) and `supportApi.test.ts` (non-2xx and thrown fetch both map to a failure result).
- Upgrading user with old persisted settings (version 4, `reviewRequested: true`, no new fields). Expect migration to fill defaults, no what's-new for a fresh install, what's-new for an upgrader. Pinned in Task 3 migration test via `migrateSettings`.
- Two interruptions competing in one session (what's new pending and review trigger met). Expect only the first to show. Pinned by `reviewTrigger.test.ts` (`suppressed: true` returns null) plus the session store gate in Task 9 and Task 11.
- Survey with branching that points past the last question or to `end`. Expect the survey to finish, not crash. Pinned by `surveyFlow.test.ts`.
- Support thread whose stored ticket was deleted in PostHog (404). Expect the stored ticket id cleared and the form shown again. Pinned by `supportApi.test.ts` (404 maps to `missing`).

---

### Task 1: Test runner and feature flag logic

**Files:**
- Modify: `tsconfig.json`
- Modify: `package.json` (scripts)
- Create: `src/lib/featureFlags.ts`
- Test: `src/lib/featureFlags.test.ts`

**Interfaces:**
- Produces: `FEATURE_FLAGS`, `type FeatureFlag`, `flagEnabled(value: boolean | string | undefined): boolean`. Test command `npm test`.

- [ ] **Step 1: Enable `.ts` extension imports for tests**

In `tsconfig.json` add to `compilerOptions`:

```json
"allowImportingTsExtensions": true
```

In `package.json` `scripts` add:

```json
"test": "node --test --no-warnings \"src/**/*.test.ts\""
```

- [ ] **Step 2: Write the failing test**

`src/lib/featureFlags.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FEATURE_FLAGS, flagEnabled } from './featureFlags.ts';

test('unknown flag value means enabled', () => {
  assert.equal(flagEnabled(undefined), true);
});

test('explicit false disables', () => {
  assert.equal(flagEnabled(false), false);
});

test('true and variant strings enable', () => {
  assert.equal(flagEnabled(true), true);
  assert.equal(flagEnabled('control'), true);
});

test('flag list matches PostHog keys', () => {
  assert.deepEqual([...FEATURE_FLAGS], ['duas', 'tasbih', 'mosque-donation', 'qibla-ar', 'prayer-tracker']);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `./featureFlags.ts`.

- [ ] **Step 4: Implement**

`src/lib/featureFlags.ts`:

```ts
export const FEATURE_FLAGS = ['duas', 'tasbih', 'mosque-donation', 'qibla-ar', 'prayer-tracker'] as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[number];

export function flagEnabled(value: boolean | string | undefined): boolean {
  return value !== false;
}
```

- [ ] **Step 5: Run tests and typecheck**

Run: `npm test && npx tsc --noEmit`
Expected: 4 passing, tsc clean.

- [ ] **Step 6: Commit**

```bash
git add tsconfig.json package.json src/lib/featureFlags.ts src/lib/featureFlags.test.ts
git commit -m "chore: node test runner and feature flag defaults"
```

---

### Task 2: Review trigger logic

**Files:**
- Create: `src/lib/reviewTrigger.ts`
- Test: `src/lib/reviewTrigger.test.ts`

**Interfaces:**
- Produces:
  - `type ReviewTrigger = 'prayers_logged' | 'active_days' | 'mosque_return'`
  - `type ReviewHistory = { activeDays: string[]; mosqueSelectedOn: string | null; lastRequestedAt: number | null; lastRequestedVersion: string | null }`
  - `type ReviewContext = { today: string; now: number; appVersion: string; prayersLogged: number; suppressed: boolean }`
  - `reviewTrigger(history: ReviewHistory, context: ReviewContext): ReviewTrigger | null`
  - `localDayKey(date: Date): string` (device-local `yyyy-mm-dd`)
  - `addActiveDay(days: string[], today: string): string[]` (unique, sorted, last 30 kept)
  - Constants `PRAYERS_FOR_REVIEW = 5`, `DAYS_FOR_REVIEW = 7`, `REASK_AFTER_MS = 120 * 24 * 60 * 60 * 1000`

- [ ] **Step 1: Write the failing test**

`src/lib/reviewTrigger.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addActiveDay,
  localDayKey,
  REASK_AFTER_MS,
  reviewTrigger,
  type ReviewContext,
  type ReviewHistory,
} from './reviewTrigger.ts';

const fresh: ReviewHistory = {
  activeDays: [],
  mosqueSelectedOn: null,
  lastRequestedAt: null,
  lastRequestedVersion: null,
};

const ctx: ReviewContext = {
  today: '2026-10-10',
  now: Date.UTC(2026, 9, 10),
  appVersion: '1.9.0',
  prayersLogged: 0,
  suppressed: false,
};

test('nothing met returns null', () => {
  assert.equal(reviewTrigger(fresh, ctx), null);
});

test('five prayers logged triggers', () => {
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 5 }), 'prayers_logged');
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 4 }), null);
});

test('seven active days triggers', () => {
  const days = ['01', '02', '03', '04', '05', '06', '07'].map((d) => `2026-10-${d}`);
  assert.equal(reviewTrigger({ ...fresh, activeDays: days }, ctx), 'active_days');
  assert.equal(reviewTrigger({ ...fresh, activeDays: days.slice(1) }, ctx), null);
});

test('mosque return triggers only on a later day', () => {
  assert.equal(reviewTrigger({ ...fresh, mosqueSelectedOn: '2026-10-09' }, ctx), 'mosque_return');
  assert.equal(reviewTrigger({ ...fresh, mosqueSelectedOn: '2026-10-10' }, ctx), null);
});

test('suppressed session never triggers', () => {
  assert.equal(reviewTrigger(fresh, { ...ctx, prayersLogged: 9, suppressed: true }), null);
});

test('re-ask needs 120 days and a new version', () => {
  const asked: ReviewHistory = { ...fresh, lastRequestedAt: ctx.now - REASK_AFTER_MS, lastRequestedVersion: '1.8.0' };
  assert.equal(reviewTrigger(asked, { ...ctx, prayersLogged: 5 }), 'prayers_logged');
  assert.equal(reviewTrigger({ ...asked, lastRequestedVersion: '1.9.0' }, { ...ctx, prayersLogged: 5 }), null);
  assert.equal(reviewTrigger({ ...asked, lastRequestedAt: ctx.now - REASK_AFTER_MS + 1 }, { ...ctx, prayersLogged: 5 }), null);
});

test('addActiveDay dedupes, sorts and caps at 30', () => {
  assert.deepEqual(addActiveDay(['2026-10-02', '2026-10-01'], '2026-10-02'), ['2026-10-01', '2026-10-02']);
  const many = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);
  const next = addActiveDay(many, '2026-10-01');
  assert.equal(next.length, 30);
  assert.equal(next[0], '2026-09-02');
  assert.equal(next[29], '2026-10-01');
});

test('localDayKey uses local calendar date', () => {
  assert.equal(localDayKey(new Date(2026, 0, 5, 23, 30)), '2026-01-05');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `./reviewTrigger.ts`.

- [ ] **Step 3: Implement**

`src/lib/reviewTrigger.ts`:

```ts
export type ReviewTrigger = 'prayers_logged' | 'active_days' | 'mosque_return';

export type ReviewHistory = {
  activeDays: string[];
  mosqueSelectedOn: string | null;
  lastRequestedAt: number | null;
  lastRequestedVersion: string | null;
};

export type ReviewContext = {
  today: string;
  now: number;
  appVersion: string;
  prayersLogged: number;
  suppressed: boolean;
};

export const PRAYERS_FOR_REVIEW = 5;
export const DAYS_FOR_REVIEW = 7;
export const REASK_AFTER_MS = 120 * 24 * 60 * 60 * 1000;
const MAX_ACTIVE_DAYS = 30;

export function localDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function addActiveDay(days: string[], today: string): string[] {
  return [...new Set([...days, today])].sort().slice(-MAX_ACTIVE_DAYS);
}

function mayAsk(history: ReviewHistory, context: ReviewContext): boolean {
  if (history.lastRequestedAt == null) return true;
  return (
    context.now - history.lastRequestedAt >= REASK_AFTER_MS &&
    history.lastRequestedVersion !== context.appVersion
  );
}

export function reviewTrigger(history: ReviewHistory, context: ReviewContext): ReviewTrigger | null {
  if (context.suppressed || !mayAsk(history, context)) return null;
  if (context.prayersLogged >= PRAYERS_FOR_REVIEW) return 'prayers_logged';
  if (history.activeDays.length >= DAYS_FOR_REVIEW) return 'active_days';
  if (history.mosqueSelectedOn != null && history.mosqueSelectedOn < context.today) return 'mosque_return';
  return null;
}
```

Note: `activeDays` only counts days since this version shipped (it starts empty), which is intended.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/reviewTrigger.ts src/lib/reviewTrigger.test.ts
git commit -m "feat: review prompt trigger rules"
```

---

### Task 3: Settings store fields, migration and session store

**Files:**
- Modify: `src/store/settings.ts`
- Create: `src/store/session.ts`
- Create: `src/store/settingsMigration.ts`
- Test: `src/store/settingsMigration.test.ts`

**Interfaces:**
- Consumes: `addActiveDay`, `localDayKey` (Task 2).
- Produces in `useSettings` state:
  - `activeDays: string[]`, `mosqueSelectedOn: string | null`, `reviewRequestedAt: number | null`, `reviewRequestedVersion: string | null`
  - `analyticsEnabled: boolean` (default `true`), `setAnalyticsEnabled(enabled: boolean)`
  - `lastSeenWhatsNew: string | null`, `setLastSeenWhatsNew(version: string)`
  - `seenSurveys: string[]`, `markSurveySeen(id: string)`
  - `supportTicketId: string | null`, `supportSessionId: string | null`, `setSupportTicket(ticketId: string | null, sessionId: string | null)`
  - `markReviewRequested(version: string)` (signature changes, takes app version)
  - `registerLaunch()` also adds today to `activeDays`
  - `setMosque` sets `mosqueSelectedOn` to today when a mosque is chosen and it was null or a different mosque
  - `completeOnboarding(version: string)` also sets `lastSeenWhatsNew = version`
- Produces `migrateSettings(state: Record<string, unknown>, previousVersion: string): Record<string, unknown>` in `settingsMigration.ts` (pure; no imports besides types).
- Produces `useSession` (zustand, not persisted): `{ interruption: 'review' | 'survey' | 'whats_new' | null; openedFromNotification: boolean; errorTracked: boolean; claimInterruption(kind): boolean; setOpenedFromNotification(): void; setErrorTracked(): void }`. `claimInterruption` returns `false` if one is already set, else sets it and returns `true`.
- Persist `version` goes 4 to 5.

- [ ] **Step 1: Write the failing migration test**

`src/store/settingsMigration.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateSettings } from './settingsMigration.ts';

test('fills new fields for an upgrading user', () => {
  const out = migrateSettings({ onboardingDone: true, reviewRequested: false }, '1.8.0');
  assert.deepEqual(out.activeDays, []);
  assert.equal(out.mosqueSelectedOn, null);
  assert.equal(out.reviewRequestedAt, null);
  assert.equal(out.analyticsEnabled, true);
  assert.equal(out.lastSeenWhatsNew, '1.8.0');
  assert.deepEqual(out.seenSurveys, []);
  assert.equal(out.supportTicketId, null);
});

test('earlier review request becomes a dated request with unknown version', () => {
  const before = Date.now();
  const out = migrateSettings({ onboardingDone: true, reviewRequested: true }, '1.8.0');
  assert.ok((out.reviewRequestedAt as number) >= before);
  assert.equal(out.reviewRequestedVersion, null);
});

test('keeps values that already exist', () => {
  const out = migrateSettings({ analyticsEnabled: false, lastSeenWhatsNew: '1.9.0', activeDays: ['2026-10-01'] }, '1.8.0');
  assert.equal(out.analyticsEnabled, false);
  assert.equal(out.lastSeenWhatsNew, '1.9.0');
  assert.deepEqual(out.activeDays, ['2026-10-01']);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, cannot find module `./settingsMigration.ts`.

- [ ] **Step 3: Implement `settingsMigration.ts`**

```ts
export function migrateSettings(
  state: Record<string, unknown>,
  previousVersion: string,
): Record<string, unknown> {
  return {
    ...state,
    activeDays: state.activeDays ?? [],
    mosqueSelectedOn: state.mosqueSelectedOn ?? null,
    reviewRequestedAt: state.reviewRequestedAt ?? (state.reviewRequested ? Date.now() : null),
    reviewRequestedVersion: state.reviewRequestedVersion ?? null,
    analyticsEnabled: state.analyticsEnabled ?? true,
    lastSeenWhatsNew: state.lastSeenWhatsNew ?? previousVersion,
    seenSurveys: state.seenSurveys ?? [],
    supportTicketId: state.supportTicketId ?? null,
    supportSessionId: state.supportSessionId ?? null,
  };
}
```

`previousVersion` is `'1.8.0'`, the last version shipped before this feature, passed as a literal from `settings.ts`.

- [ ] **Step 4: Wire into `settings.ts`**

1. Add the fields and setters listed under Interfaces to `SettingsState`, with defaults: `activeDays: []`, `mosqueSelectedOn: null`, `reviewRequestedAt: null`, `reviewRequestedVersion: null`, `analyticsEnabled: true`, `lastSeenWhatsNew: null`, `seenSurveys: []`, `supportTicketId: null`, `supportSessionId: null`.
2. Remove `reviewRequested` from the type and defaults (migration reads the legacy value).
3. Replace actions:

```ts
registerLaunch: () =>
  set((state) => ({
    launchCount: state.launchCount + 1,
    activeDays: addActiveDay(state.activeDays, localDayKey(new Date())),
  })),
markReviewRequested: (version) =>
  set({ reviewRequestedAt: Date.now(), reviewRequestedVersion: version }),
completeOnboarding: (version) => set({ onboardingDone: true, lastSeenWhatsNew: version }),
setMosque: (mosque) =>
  set((state) => ({
    mosque,
    mosqueSelectedOn:
      mosque && mosque.orgNr !== state.mosque?.orgNr ? localDayKey(new Date()) : state.mosqueSelectedOn,
  })),
setAnalyticsEnabled: (analyticsEnabled) => set({ analyticsEnabled }),
setLastSeenWhatsNew: (lastSeenWhatsNew) => set({ lastSeenWhatsNew }),
markSurveySeen: (id) =>
  set((state) => ({ seenSurveys: state.seenSurveys.includes(id) ? state.seenSurveys : [...state.seenSurveys, id] })),
setSupportTicket: (supportTicketId, supportSessionId) => set({ supportTicketId, supportSessionId }),
```

4. Set `version: 5`. At the end of the existing `migrate` body, before `return`, replace `return state as SettingsState;` with:

```ts
return migrateSettings(state as Record<string, unknown>, '1.8.0') as unknown as SettingsState;
```

5. Update callers of changed signatures: `completeOnboarding()` in `src/components/onboarding/OnboardingFlow.tsx` passes `Constants.expoConfig?.version ?? '0.0.0'` (`import Constants from 'expo-constants'`); Task 5 switches it to `appVersion()`. The old `markReviewRequested()` call in `useReviewPrompt.ts` passes `Constants.expoConfig?.version ?? '0.0.0'` until Task 9 rewrites the hook.

- [ ] **Step 5: Create `src/store/session.ts`**

```ts
import { create } from 'zustand';

export type Interruption = 'review' | 'survey' | 'whats_new';

type SessionState = {
  interruption: Interruption | null;
  openedFromNotification: boolean;
  errorTracked: boolean;
  claimInterruption: (kind: Interruption) => boolean;
  setOpenedFromNotification: () => void;
  setErrorTracked: () => void;
};

export const useSession = create<SessionState>()((set, get) => ({
  interruption: null,
  openedFromNotification: false,
  errorTracked: false,
  claimInterruption: (kind) => {
    if (get().interruption != null) return false;
    set({ interruption: kind });
    return true;
  },
  setOpenedFromNotification: () => set({ openedFromNotification: true }),
  setErrorTracked: () => set({ errorTracked: true }),
}));
```

- [ ] **Step 6: Run tests, typecheck, lint**

Run: `npm test && npx tsc --noEmit && npx expo lint`
Expected: all clean.

- [ ] **Step 7: Commit**

```bash
git add src/store src/components/onboarding/OnboardingFlow.tsx
git commit -m "feat: settings fields for reviews, surveys, support and what's new"
```

---

### Task 4: What's new content and selection logic

**Files:**
- Create: `src/lib/whatsNew.ts`
- Test: `src/lib/whatsNew.test.ts`

**Interfaces:**
- Consumes: `type FeatureFlag` (Task 1).
- Produces:
  - `type WhatsNewItem = { title: string; body: string; icon: string; route?: string; flag?: FeatureFlag }`
  - `type WhatsNewEntry = { version: string; items: WhatsNewItem[] }`
  - `WHATS_NEW: WhatsNewEntry[]` (newest first)
  - `compareVersions(a: string, b: string): number`
  - `pendingWhatsNew(entries: WhatsNewEntry[], lastSeen: string | null, current: string): WhatsNewEntry[]`
  - `visibleItems(items: WhatsNewItem[], isEnabled: (flag: FeatureFlag) => boolean): WhatsNewItem[]`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareVersions, pendingWhatsNew, visibleItems, WHATS_NEW, type WhatsNewEntry } from './whatsNew.ts';

const entries: WhatsNewEntry[] = [
  { version: '1.10.0', items: [{ title: 'C', body: 'c', icon: 'star-outline' }] },
  { version: '1.9.0', items: [{ title: 'B', body: 'b', icon: 'star-outline' }] },
  { version: '1.8.0', items: [{ title: 'A', body: 'a', icon: 'star-outline' }] },
];

test('compareVersions is numeric per segment', () => {
  assert.ok(compareVersions('1.10.0', '1.9.0') > 0);
  assert.equal(compareVersions('1.9.0', '1.9.0'), 0);
  assert.ok(compareVersions('1.8.1', '1.9') < 0);
});

test('pending shows entries after lastSeen up to current', () => {
  assert.deepEqual(pendingWhatsNew(entries, '1.8.0', '1.9.0').map((e) => e.version), ['1.9.0']);
  assert.deepEqual(pendingWhatsNew(entries, '1.8.0', '1.10.0').map((e) => e.version), ['1.10.0', '1.9.0']);
});

test('nothing pending when lastSeen is null or current', () => {
  assert.deepEqual(pendingWhatsNew(entries, null, '1.10.0'), []);
  assert.deepEqual(pendingWhatsNew(entries, '1.10.0', '1.10.0'), []);
});

test('items behind a disabled flag are hidden', () => {
  const items = [
    { title: 'x', body: 'x', icon: 'a', flag: 'duas' as const },
    { title: 'y', body: 'y', icon: 'b' },
  ];
  assert.deepEqual(visibleItems(items, (flag) => flag !== 'duas').map((i) => i.title), ['y']);
});

test('shipped content is sorted newest first', () => {
  const versions = WHATS_NEW.map((e) => e.version);
  assert.deepEqual([...versions].sort((a, b) => compareVersions(b, a)), versions);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
import type { FeatureFlag } from './featureFlags.ts';

export type WhatsNewItem = {
  title: string;
  body: string;
  icon: string;
  route?: string;
  flag?: FeatureFlag;
};

export type WhatsNewEntry = {
  version: string;
  items: WhatsNewItem[];
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    version: '1.9.0',
    items: [
      {
        title: 'Gi oss tilbakemelding',
        body: 'Skriv til oss rett fra appen under Mer. Vi svarer i appen.',
        icon: 'chatbubble-ellipses-outline',
        route: '/feedback',
      },
      {
        title: 'Dua og dhikr',
        body: 'Duaer til bønnen og Ramadan, med tasbih-teller.',
        icon: 'book-outline',
        route: '/duas',
        flag: 'duas',
      },
    ],
  },
];

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function pendingWhatsNew(
  entries: WhatsNewEntry[],
  lastSeen: string | null,
  current: string,
): WhatsNewEntry[] {
  if (lastSeen == null) return [];
  return entries.filter(
    (entry) => compareVersions(entry.version, lastSeen) > 0 && compareVersions(entry.version, current) <= 0,
  );
}

export function visibleItems(
  items: WhatsNewItem[],
  isEnabled: (flag: FeatureFlag) => boolean,
): WhatsNewItem[] {
  return items.filter((item) => item.flag == null || isEnabled(item.flag));
}
```

`import type` is stripped by Node, so no `.ts` resolution issue at runtime. If tsc complains about the `.ts` extension in a type import, Task 1's `allowImportingTsExtensions` covers it.

- [ ] **Step 4: Run tests**

Run: `npm test && npx tsc --noEmit`
Expected: passing, clean.

- [ ] **Step 5: Commit**

```bash
git add src/lib/whatsNew.ts src/lib/whatsNew.test.ts
git commit -m "feat: what's new content and version selection"
```

---

### Task 5: PostHog client replaces Sentry

**Files:**
- Modify: `package.json`, `package-lock.json` (deps)
- Rewrite: `src/lib/telemetry.ts`
- Modify: `src/app/_layout.tsx`
- Modify: `metro.config.js`
- Modify: `app.json` (plugins)
- Modify: `.env` (gitignored; local only)
- Create: `src/hooks/useScreenTracking.ts`
- Create: `src/hooks/useAnalyticsContext.ts`

**Interfaces:**
- Produces from `src/lib/telemetry.ts`:
  - `posthog: PostHog` (always constructed; disabled when no key)
  - `analyticsActive: boolean` (key present)
  - `track(event: string, props?: TrackProps): void` (unchanged signature)
  - `trackError(error: unknown, source: string, extra?: TrackProps): void` (unchanged signature; also calls `useSession.getState().setErrorTracked()`)
  - `appVersion(): string`
  - `type TrackProps`
- Removes exports `initTelemetry`, `navigationIntegration`, `Sentry`.

- [ ] **Step 1: Install and remove packages**

```bash
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization posthog-react-native-session-replay @posthog/react-native-plugin
npm uninstall @sentry/react-native
```

Exact-pin nothing extra; these are stable releases. Confirm `posthog-react-native` resolved to 4.78.0 or newer (`npm ls posthog-react-native`); native NDK crash capture needs it.

- [ ] **Step 2: Rewrite `src/lib/telemetry.ts`**

```ts
import * as Application from 'expo-application';
import { isRunningInExpoGo } from 'expo';
import PostHog from 'posthog-react-native';
import { useSession } from '@/store/session';

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? '';
const POSTHOG_HOST = 'https://eu.i.posthog.com';

export const analyticsActive = POSTHOG_KEY.length > 0;

export const posthog = new PostHog(analyticsActive ? POSTHOG_KEY : 'phc_disabled', {
  host: POSTHOG_HOST,
  disabled: !analyticsActive,
  captureAppLifecycleEvents: true,
  enableSessionReplay: analyticsActive && !isRunningInExpoGo(),
  sessionReplayConfig: {
    maskAllTextInputs: true,
    maskAllImages: false,
    captureLog: false,
  },
  errorTracking: {
    autocapture: {
      uncaughtExceptions: true,
      unhandledRejections: true,
      nativeCrashes: !isRunningInExpoGo(),
      androidNdkCrashes: !isRunningInExpoGo(),
    },
  },
});

export type TrackProps = Record<string, string | number | boolean>;

export function appVersion(): string {
  return Application.nativeApplicationVersion ?? '0.0.0';
}

export function track(event: string, props?: TrackProps) {
  posthog.capture(event, props);
}

export function trackError(error: unknown, source: string, extra?: TrackProps) {
  useSession.getState().setErrorTracked();
  posthog.captureException(error, { source, ...extra });
}
```

Before writing, open `node_modules/posthog-react-native/dist/posthog-rn.d.ts` and `node_modules/@posthog/core/dist/*.d.ts` and confirm the exact names of `disabled`, `errorTracking.autocapture.*` and `sessionReplayConfig.*`. If `disabled` does not exist, use `defaultOptIn: analyticsActive` and skip `posthog.optIn()` when inactive. Adjust names to match the installed types; tsc is the check.

`Application.nativeApplicationVersion` returns the Expo Go version inside Expo Go. That is acceptable for dev; the store build reports the real version.

- [ ] **Step 3: Screen tracking hook**

`src/hooks/useScreenTracking.ts`:

```ts
import { useEffect } from 'react';
import { useSegments } from 'expo-router';
import { posthog } from '@/lib/telemetry';

export function useScreenTracking() {
  const segments = useSegments();
  const screen = segments.filter((segment) => !segment.startsWith('(')).join('/') || 'index';

  useEffect(() => {
    posthog.screen(screen);
  }, [screen]);
}
```

`useSegments` returns the route pattern (`mosque/[orgNr]`), not the org number, so screens group cleanly.

- [ ] **Step 4: Super properties and opt-out hook**

`src/hooks/useAnalyticsContext.ts`:

```ts
import { useEffect } from 'react';
import { posthog } from '@/lib/telemetry';
import { useActiveLocation, useIsCalculatedMode, useSettings } from '@/store/settings';

export function useAnalyticsContext(travelMode: boolean) {
  const location = useActiveLocation();
  const calculated = useIsCalculatedMode();
  const enabled = useSettings((state) => state.analyticsEnabled);

  useEffect(() => {
    if (enabled) void posthog.optIn();
    else void posthog.optOut();
  }, [enabled]);

  useEffect(() => {
    void posthog.register({
      kommune: location.name,
      times_mode: calculated ? 'calculated' : 'mosque',
      travel_mode: travelMode,
    });
  }, [location.name, calculated, travelMode]);
}
```

Read `src/hooks/useTravelMode.ts` to find how the current travel-mode boolean is exposed (it is called in `RootNavigator`). If `useTravelMode()` returns nothing, read the travel state from where `ThemeProvider` reads it (grep `travel` in `src/theme`) and pass that boolean in. Do not add a new store for it.

- [ ] **Step 5: Root layout**

In `src/app/_layout.tsx`:
1. Replace the telemetry import with `import { posthog, trackError } from '@/lib/telemetry';` and `import { PostHogProvider } from 'posthog-react-native';`.
2. Delete `initTelemetry();`, the `useNavigationContainerRef` import and every `navigationIntegration` / `Sentry` usage (including any `Sentry.wrap(...)` around the default export; export the plain component instead).
3. Inside `RootNavigator`, call `useScreenTracking();` and `useAnalyticsContext(<travel boolean>);`.
4. Wrap the tree returned by the default export in `<PostHogProvider client={posthog} autocapture={false}>...</PostHogProvider>` as the outermost element inside `GestureHandlerRootView`.

- [ ] **Step 6: Metro and app.json**

`metro.config.js`:

```js
const { getPostHogExpoConfig } = require('posthog-react-native/metro');

module.exports = getPostHogExpoConfig(__dirname);
```

`app.json` plugins: remove the `["@sentry/react-native/expo", {...}]` entry and the bare `"@sentry/react-native"` entry. Add:

```json
["posthog-react-native/expo", { "dotenvFile": ".env", "skipOnConflict": true }]
```

- [ ] **Step 7: Env**

In `.env`: delete `EXPO_PUBLIC_SENTRY_DSN=...`, add:

```
EXPO_PUBLIC_POSTHOG_KEY=phc_mHT42fy8tgfizNdnsmfTLqs3HkCCBiws8Z8ske2NAiBg
POSTHOG_CLI_PROJECT_ID=292238
POSTHOG_CLI_HOST=https://eu.posthog.com
```

`POSTHOG_CLI_API_KEY` is added by the user (personal API key); symbol upload logs a warning without it and the build still succeeds.

EAS env (cloud builds): run `eas env:create --name EXPO_PUBLIC_POSTHOG_KEY --value phc_mHT42fy8tgfizNdnsmfTLqs3HkCCBiws8Z8ske2NAiBg --environment production --environment preview --environment development --visibility plaintext` and `eas env:delete --variable-name EXPO_PUBLIC_SENTRY_DSN` (use the pnpm-global `eas`, not `npx eas-cli@latest`). If the command prompts interactively, stop and ask the user to run it with `!`.

- [ ] **Step 8: Switch temporary version reads**

In `OnboardingFlow.tsx` and `useReviewPrompt.ts`, replace the Task 3 `Constants.expoConfig?.version ?? '0.0.0'` reads with `appVersion()` from `@/lib/telemetry` and drop the `expo-constants` import if unused.

- [ ] **Step 9: Verify no Sentry remains**

Run: `grep -rn "sentry" src app.json metro.config.js package.json eas.json`
Expected: no matches.

- [ ] **Step 10: Typecheck, lint, export, tests**

Run: `npx tsc --noEmit && npx expo lint && npm test && npx expo export --platform ios --output-dir /tmp/bonnetid-export-check`
Expected: all clean, export succeeds. Delete the export dir afterwards.

If tsc reports bogus route errors, delete `.expo/types/router.d.ts` and rerun (known stale-file issue).

- [ ] **Step 11: Commit**

```bash
git add -A src package.json package-lock.json metro.config.js app.json
git commit -m "feat: PostHog replaces Sentry for analytics, errors and replay"
```

---

### Task 6: Analytics toggle in settings

**Files:**
- Modify: `src/app/settings.tsx` ("Om appen" section)

**Interfaces:**
- Consumes: `analyticsEnabled`, `setAnalyticsEnabled` (Task 3), `Toggle` from `@/components/ui`.

- [ ] **Step 1: Add the row**

Read how existing toggle rows are built in `settings.tsx` (for example "Marker bønner" around line 224) and copy that exact pattern. In the "Om appen" card, after "Vurder Bønnetid", add a `Divider` and a row:
- title `Del anonym bruksdata`
- leading `<Ionicons name="analytics-outline" size={20} color={theme.colors.primary} />`
- trailing toggle bound to `analyticsEnabled` / `setAnalyticsEnabled`
- on change call `track('analytics_toggled', { enabled: next })` **before** disabling, so the opt-out itself is recorded.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npx expo lint`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/settings.tsx
git commit -m "feat: anonymous usage data toggle in settings"
```

---

### Task 7: Feature flags in the app

**Files:**
- Create: `src/hooks/useFeature.ts`
- Modify: `src/app/(tabs)/more.tsx`
- Modify: `src/app/duas/index.tsx`
- Modify: `src/components/duas/DuaLink.tsx`
- Modify: `src/app/(tabs)/qibla.tsx`
- Modify: `src/app/mosque/[orgNr].tsx`
- Modify: `src/components/mosque/MosquePresenceCard.tsx`
- Modify: `src/store/settings.ts` (`usePrayerTrackerEnabled`)
- Modify: `src/app/settings.tsx` (hide the Bønnesporing and Dua og dhikr sections when flagged off)
- Create: `src/components/FeatureGate.tsx`
- Modify: `src/app/tasbih.tsx`, `src/app/duas/index.tsx`, `src/app/duas/[id].tsx`, `src/app/tracker.tsx`

**Interfaces:**
- Consumes: `flagEnabled`, `type FeatureFlag` (Task 1), `posthog` (Task 5).
- Produces: `useFeature(flag: FeatureFlag): boolean`; `<FeatureGate flag={...}>{children}</FeatureGate>` which renders children when enabled and otherwise calls `router.back()` (or `router.replace('/')` if it cannot go back) in an effect and renders nothing.

- [ ] **Step 1: Hook**

```ts
import { useFeatureFlag } from 'posthog-react-native';
import { flagEnabled, type FeatureFlag } from '@/lib/featureFlags';
import { posthog } from '@/lib/telemetry';

export function useFeature(flag: FeatureFlag): boolean {
  return flagEnabled(useFeatureFlag(flag, posthog));
}
```

- [ ] **Step 2: FeatureGate**

```tsx
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { useFeature } from '@/hooks/useFeature';
import type { FeatureFlag } from '@/lib/featureFlags';

export function FeatureGate({ flag, children }: { flag: FeatureFlag; children: ReactNode }) {
  const enabled = useFeature(flag);
  const router = useRouter();

  useEffect(() => {
    if (enabled) return;
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [enabled, router]);

  return enabled ? children : null;
}
```

Wrap the screen body of `tasbih.tsx` (`tasbih`), `duas/index.tsx` and `duas/[id].tsx` (`duas`), `tracker.tsx` (`prayer-tracker`).

- [ ] **Step 3: Entry points**

- `more.tsx`: `DUAS_FEATURE` only when `useFeature('duas')`. When `duas` is off and `tasbih` is on, show a `TASBIH_FEATURE` card (`href: '/tasbih'`, title `Tasbih`, description `Tell dhikr etter bønnen`, icon via `TasbihIcon` like `duas/index.tsx` does; extend the `Feature` type with an optional `renderIcon` or render the tasbih card separately below the list, whichever is smaller).
- `duas/index.tsx`: the Tasbih `FeatureCard` and the "Tell med tasbih" link only when `useFeature('tasbih')`.
- `DuaLink.tsx`: return `null` when `useFeature('duas')` is false (covers Ramadan, Dhul-Hijjah and night cards).
- `qibla.tsx`: in `ViewSwitcher`, drop the `'3d'` option when `useFeature('qibla-ar')` is false; in the screen, if the flag turns off while `view === '3d'`, render the compass (derive `const effectiveView = arEnabled || view !== '3d' ? view : 'compass'` and use it everywhere `view` is read for rendering; do not call setState during render).
- `mosque/[orgNr].tsx`: the "Støtt moskeen" block also requires `useFeature('mosque-donation')`.
- `MosquePresenceCard.tsx`: the Vipps `Button` only when `useFeature('mosque-donation')`.
- `settings.ts`: `usePrayerTrackerEnabled` returns `setting && useFeature('prayer-tracker')`. Import `useFeature` from `@/hooks/useFeature`; check this does not create an import cycle into `telemetry.ts` -> `session.ts` (it does not; `session.ts` does not import settings).
- `settings.tsx`: hide the "Bønnesporing" section when `useFeature('prayer-tracker')` is false, and the "Dua og dhikr" section when `useFeature('duas')` is false.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx expo lint && npm test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat: feature flags gate duas, tasbih, Vipps, AR qibla and prayer tracking"
```

---

### Task 8: Shared bottom sheet

**Files:**
- Create: `src/components/ui/Sheet.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Produces: `Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode })`.

- [ ] **Step 1: Implement**

```tsx
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { IconButton } from './IconButton';
import { useTheme } from '@/theme';
import { radius, spacing } from '@/theme/tokens';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          accessibilityLabel="Lukk"
          onPress={onClose}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colors.overlay }}
        />
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: spacing.lg,
            paddingHorizontal: spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            maxHeight: '85%',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md }}>
            <AppText size="xl" weight="bold" heading style={{ flexGrow: 1, flexShrink: 1, flexBasis: 0 }}>
              {title}
            </AppText>
            <IconButton icon="close" accessibilityLabel="Lukk" onPress={onClose} />
          </View>
          <ScrollView bounces={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
```

Check `IconButton`'s actual prop names in `src/components/ui/IconButton.tsx` and adapt. Check `theme.colors.overlay` exists (it does in `ThemeColors`). The title uses the grow/shrink/basis triplet per the repo's flex gotcha.

- [ ] **Step 2: Export and verify**

Add `export * from './Sheet';` to `src/components/ui/index.ts`.

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Sheet.tsx src/components/ui/index.ts
git commit -m "feat: shared bottom sheet component"
```

---

### Task 9: Moment-based store review prompt

**Files:**
- Rewrite: `src/hooks/useReviewPrompt.ts`
- Modify: `src/app/_layout.tsx` (move the hook call)
- Modify: `src/app/(tabs)/index.tsx` (call the hook here)
- Modify: `src/lib/notifications.ts` (open-from-notification detection)
- Create: `src/hooks/useNotificationOpenFlag.ts`

**Interfaces:**
- Consumes: `reviewTrigger`, `localDayKey` (Task 2); settings fields (Task 3); `useSession` (Task 3); `appVersion`, `track` (Task 5); `usePrayerLog` store; `requestInAppReview` (`src/lib/review.ts`); `useOnboardingDone`.
- Produces: `useReviewPrompt()` (now called from the Oversikt tab), `addNotificationOpenListener(onOpen: () => void): Promise<() => void>` and `wasOpenedFromNotification(): Promise<boolean>` in `notifications.ts`.

- [ ] **Step 1: Notification open detection**

In `src/lib/notifications.ts`, next to `addPrayerActionListener`, add:

```ts
export async function addNotificationOpenListener(onOpen: () => void): Promise<() => void> {
  if (!notificationsSupported) return () => {};
  const Notifications = await getNotifications();
  const subscription = Notifications.addNotificationResponseReceivedListener(() => onOpen());
  return () => subscription.remove();
}

export async function wasOpenedFromNotification(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const Notifications = await getNotifications();
  const response = await Notifications.getLastNotificationResponseAsync();
  return response != null && shownRecently(response);
}
```

`src/hooks/useNotificationOpenFlag.ts`:

```ts
import { useEffect } from 'react';
import { addNotificationOpenListener, wasOpenedFromNotification } from '@/lib/notifications';
import { useSession } from '@/store/session';

export function useNotificationOpenFlag() {
  useEffect(() => {
    const mark = useSession.getState().setOpenedFromNotification;
    let remove: (() => void) | null = null;
    let cancelled = false;
    wasOpenedFromNotification().then((opened) => {
      if (opened && !cancelled) mark();
    }).catch(() => {});
    addNotificationOpenListener(mark)
      .then((unsubscribe) => {
        if (cancelled) unsubscribe();
        else remove = unsubscribe;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      remove?.();
    };
  }, []);
}
```

Call `useNotificationOpenFlag()` in `RootNavigator` in `_layout.tsx`.

- [ ] **Step 2: Rewrite the hook**

`src/hooks/useReviewPrompt.ts`:

```ts
import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { localDayKey, reviewTrigger } from '@/lib/reviewTrigger';
import { requestInAppReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { usePrayerLog } from '@/store/prayerLog';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';

const PROMPT_DELAY_MS = 2500;

export function useReviewPrompt() {
  const focused = useIsFocused();
  const onboardingDone = useOnboardingDone();
  const activeDays = useSettings((state) => state.activeDays);
  const mosqueSelectedOn = useSettings((state) => state.mosqueSelectedOn);
  const lastRequestedAt = useSettings((state) => state.reviewRequestedAt);
  const lastRequestedVersion = useSettings((state) => state.reviewRequestedVersion);
  const markReviewRequested = useSettings((state) => state.markReviewRequested);
  const prayersLogged = usePrayerLog(
    (state) => Object.values(state.log).filter((entry) => entry.status === 'prayed').length,
  );
  const interruption = useSession((state) => state.interruption);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const errorTracked = useSession((state) => state.errorTracked);

  useEffect(() => {
    if (!focused || !onboardingDone) return;
    const now = Date.now();
    const trigger = reviewTrigger(
      { activeDays, mosqueSelectedOn, lastRequestedAt, lastRequestedVersion },
      {
        today: localDayKey(new Date(now)),
        now,
        appVersion: appVersion(),
        prayersLogged,
        suppressed: interruption != null || openedFromNotification || errorTracked,
      },
    );
    if (!trigger) return;
    const timer = setTimeout(async () => {
      if (!useSession.getState().claimInterruption('review')) return;
      const shown = await requestInAppReview();
      if (!shown) return;
      markReviewRequested(appVersion());
      track('review_prompt_requested', { trigger });
    }, PROMPT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [
    focused,
    onboardingDone,
    activeDays,
    mosqueSelectedOn,
    lastRequestedAt,
    lastRequestedVersion,
    prayersLogged,
    interruption,
    openedFromNotification,
    errorTracked,
    markReviewRequested,
  ]);
}
```

Check the `PrayerLog` entry shape in `src/lib/prayerLog.ts` (`{ status, at }`); entries with `status: null` are cleared marks and must not count. If the zustand selector returning a new number each render causes lint complaints, it will not: it returns a primitive.

- [ ] **Step 3: Move the call site**

Remove `useReviewPrompt()` from `RootNavigator` in `_layout.tsx`. `registerLaunch` was inside the old hook; keep launch registration in `RootNavigator` with:

```ts
const registerLaunch = useSettings((state) => state.registerLaunch);
useEffect(() => {
  registerLaunch();
}, [registerLaunch]);
```

Call `useReviewPrompt()` at the top of the Oversikt screen component in `src/app/(tabs)/index.tsx`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit && npx expo lint && npm test`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add -A src
git commit -m "feat: store review prompt at good moments instead of at launch"
```

---

### Task 10: What's new sheet and archive

**Files:**
- Create: `src/components/whatsNew/WhatsNewList.tsx`
- Create: `src/components/whatsNew/WhatsNewHost.tsx`
- Create: `src/app/whats-new.tsx`
- Modify: `src/app/_layout.tsx` (register screen, mount host)
- Modify: `src/app/(tabs)/more.tsx` (archive card)

**Interfaces:**
- Consumes: `WHATS_NEW`, `pendingWhatsNew`, `visibleItems` (Task 4); `useFeature` (Task 7); `Sheet` (Task 8); `useSession` (Task 3); `appVersion`, `track` (Task 5); `openStoreReview` (`src/lib/review.ts`); `lastSeenWhatsNew`, `setLastSeenWhatsNew`, `useOnboardingDone`.
- Produces: `WhatsNewList({ entries, onNavigate }: { entries: WhatsNewEntry[]; onNavigate?: () => void })`.

- [ ] **Step 1: Flag lookup without conditional hooks**

`visibleItems` needs a `(flag) => boolean`. Hooks cannot be called inside it, so in `WhatsNewList` read all flags once:

```ts
const flags = {
  duas: useFeature('duas'),
  tasbih: useFeature('tasbih'),
  'mosque-donation': useFeature('mosque-donation'),
  'qibla-ar': useFeature('qibla-ar'),
  'prayer-tracker': useFeature('prayer-tracker'),
} satisfies Record<FeatureFlag, boolean>;
const isEnabled = (flag: FeatureFlag) => flags[flag];
```

- [ ] **Step 2: `WhatsNewList`**

For each entry: a small muted heading `Versjon {version}`, then for each visible item a row with a `primarySoft` 40x40 icon tile (`Ionicons name={item.icon as keyof typeof Ionicons.glyphMap}`), title (semibold), body (sm, textMuted), and when `item.route` is set a `Button` `label="Prøv nå"` `variant="secondary"` `size="sm"` that calls `onNavigate?.()`, `track('whats_new_opened_item', { title: item.title })`, then `router.push(item.route as Href)`. Skip entries whose visible items are empty. Use `gap: spacing.lg` between items, `spacing.xl` between entries.

- [ ] **Step 3: `WhatsNewHost`**

```tsx
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Sheet } from '@/components/ui';
import { WhatsNewList } from './WhatsNewList';
import { openStoreReview } from '@/lib/review';
import { appVersion, track } from '@/lib/telemetry';
import { pendingWhatsNew, WHATS_NEW } from '@/lib/whatsNew';
import { useSession } from '@/store/session';
import { useOnboardingDone, useSettings } from '@/store/settings';
import { spacing } from '@/theme/tokens';

export function WhatsNewHost() {
  const onboardingDone = useOnboardingDone();
  const lastSeen = useSettings((state) => state.lastSeenWhatsNew);
  const setLastSeen = useSettings((state) => state.setLastSeenWhatsNew);
  const openedFromNotification = useSession((state) => state.openedFromNotification);
  const [visible, setVisible] = useState(false);
  const current = appVersion();
  const pending = pendingWhatsNew(WHATS_NEW, lastSeen, current);

  useEffect(() => {
    if (!onboardingDone || openedFromNotification || pending.length === 0) return;
    if (!useSession.getState().claimInterruption('whats_new')) return;
    setVisible(true);
    track('whats_new_shown', { version: current });
  }, [onboardingDone, openedFromNotification, pending.length, current]);

  const close = () => {
    setVisible(false);
    setLastSeen(current);
  };

  return (
    <Sheet visible={visible} onClose={close} title="Hva er nytt">
      <WhatsNewList entries={pending} onNavigate={close} />
      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        <Button
          label="Gi Bønnetid en vurdering"
          variant="secondary"
          fullWidth
          onPress={() => {
            track('whats_new_review_tapped');
            openStoreReview();
          }}
        />
        <Button label="Fortsett" fullWidth onPress={close} />
      </View>
    </Sheet>
  );
}
```

If `npx expo lint` flags `setVisible` inside the effect (react-compiler set-state-in-effect rule), switch to the derived form: the effect only calls `claimInterruption('whats_new')` (a store action), read `interruption` from `useSession`, keep `const [dismissed, setDismissed] = useState(false)`, and compute `visible = interruption === 'whats_new' && !dismissed`; `close` sets `dismissed`.

Mount `<WhatsNewHost />` in `RootNavigator` after `<Stack>`.

- [ ] **Step 4: Archive screen and Mer card**

`src/app/whats-new.tsx`:

```tsx
import { Screen } from '@/components/ui';
import { WhatsNewList } from '@/components/whatsNew/WhatsNewList';
import { WHATS_NEW } from '@/lib/whatsNew';
import { spacing } from '@/theme/tokens';
import { View } from 'react-native';

export default function WhatsNewScreen() {
  return (
    <Screen scroll edges={[]}>
      <View style={{ marginTop: spacing.lg }}>
        <WhatsNewList entries={WHATS_NEW} />
      </View>
    </Screen>
  );
}
```

Register in `_layout.tsx` with the same header options block as `settings` and `title: 'Hva er nytt'`.

In `more.tsx` add a card before Innstillinger: `href: '/whats-new'`, icon `sparkles-outline`, title `Hva er nytt`, description `Nyheter i siste versjon`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx expo lint && npm test`

- [ ] **Step 6: Commit**

```bash
git add -A src
git commit -m "feat: what's new sheet after updates and archive in Mer"
```

---

### Task 11: Surveys

**Files:**
- Create: `src/lib/surveyFlow.ts`
- Test: `src/lib/surveyFlow.test.ts`
- Create: `src/components/survey/SurveyQuestionView.tsx`
- Create: `src/components/survey/SurveyHost.tsx`
- Modify: `src/app/_layout.tsx` (mount host)

**Interfaces:**
- Consumes: `posthog`, `track` (Task 5); `Sheet` (Task 8); `useSession` (Task 3); `seenSurveys`, `markSurveySeen` (Task 3); `flagEnabled` (Task 1).
- Produces in `surveyFlow.ts`:
  - `type SurveyAnswer = string | string[] | number | null`
  - `type FlowQuestion = { id?: string; type: string; question: string; description?: string | null; optional?: boolean; choices?: string[]; scale?: number; lowerBoundLabel?: string; upperBoundLabel?: string; buttonText?: string; branching?: { type: string; index?: number; responseValues?: Record<string, string | number> } }`
  - `type FlowSurvey = { id: string; name: string; type: string; questions: FlowQuestion[]; start_date?: string | null; end_date?: string | null; linked_flag_key?: string | null }`
  - `pickSurvey(surveys: FlowSurvey[], seen: string[], isFlagOn: (key: string) => boolean): FlowSurvey | null`
  - `nextQuestionIndex(survey: FlowSurvey, current: number, answer: SurveyAnswer): number | 'end'`
  - `responseProperties(survey: FlowSurvey, answers: Record<number, SurveyAnswer>): Record<string, unknown>`

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextQuestionIndex, pickSurvey, responseProperties, type FlowSurvey } from './surveyFlow.ts';

const base: FlowSurvey = {
  id: 's1',
  name: 'Test',
  type: 'api',
  start_date: '2026-10-01T00:00:00Z',
  end_date: null,
  questions: [
    { id: 'q1', type: 'rating', question: 'Hvor fornøyd?', scale: 5 },
    { id: 'q2', type: 'open', question: 'Hvorfor?' },
    { id: 'q3', type: 'single_choice', question: 'Hva?', choices: ['A', 'B'] },
  ],
};

test('pickSurvey skips seen, drafts, ended, non-api and flag-gated surveys', () => {
  assert.equal(pickSurvey([base], [], () => true)?.id, 's1');
  assert.equal(pickSurvey([base], ['s1'], () => true), null);
  assert.equal(pickSurvey([{ ...base, start_date: null }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, end_date: '2026-10-02T00:00:00Z' }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, type: 'popover' }], [], () => true), null);
  assert.equal(pickSurvey([{ ...base, linked_flag_key: 'x' }], [], () => false), null);
});

test('default branching goes to next question then end', () => {
  assert.equal(nextQuestionIndex(base, 0, 4), 1);
  assert.equal(nextQuestionIndex(base, 2, 'A'), 'end');
});

test('end and specific_question branching', () => {
  const s: FlowSurvey = {
    ...base,
    questions: [
      { ...base.questions[0], branching: { type: 'end' } },
      base.questions[1],
      base.questions[2],
    ],
  };
  assert.equal(nextQuestionIndex(s, 0, 3), 'end');
  const jump: FlowSurvey = { ...base, questions: [{ ...base.questions[0], branching: { type: 'specific_question', index: 2 } }, base.questions[1], base.questions[2]] };
  assert.equal(nextQuestionIndex(jump, 0, 3), 2);
});

test('response_based branching on rating and choice, out of range ends', () => {
  const s: FlowSurvey = {
    ...base,
    questions: [
      { ...base.questions[0], branching: { type: 'response_based', responseValues: { negative: 1, positive: 'end' } } },
      base.questions[1],
      { ...base.questions[2], branching: { type: 'response_based', responseValues: { '0': 9 } } },
    ],
  };
  assert.equal(nextQuestionIndex(s, 0, 1), 1);
  assert.equal(nextQuestionIndex(s, 0, 5), 'end');
  assert.equal(nextQuestionIndex(s, 2, 'A'), 'end');
});

test('responseProperties uses id keyed and legacy index keys', () => {
  const props = responseProperties(base, { 0: 4, 1: 'Bra app' });
  assert.equal(props.$survey_id, 's1');
  assert.equal(props.$survey_name, 'Test');
  assert.equal(props.$survey_response, 4);
  assert.equal(props.$survey_response_1, 'Bra app');
  assert.equal(props.$survey_response_q1, 4);
  assert.equal(props.$survey_response_q2, 'Bra app');
  assert.deepEqual(props.$survey_questions, [
    { id: 'q1', question: 'Hvor fornøyd?', response: 4 },
    { id: 'q2', question: 'Hvorfor?', response: 'Bra app' },
    { id: 'q3', question: 'Hva?', response: null },
  ]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `surveyFlow.ts`**

```ts
export type SurveyAnswer = string | string[] | number | null;

export type FlowQuestion = {
  id?: string;
  type: string;
  question: string;
  description?: string | null;
  optional?: boolean;
  choices?: string[];
  scale?: number;
  lowerBoundLabel?: string;
  upperBoundLabel?: string;
  buttonText?: string;
  branching?: { type: string; index?: number; responseValues?: Record<string, string | number> };
};

export type FlowSurvey = {
  id: string;
  name: string;
  type: string;
  questions: FlowQuestion[];
  start_date?: string | null;
  end_date?: string | null;
  linked_flag_key?: string | null;
};

export function pickSurvey(
  surveys: FlowSurvey[],
  seen: string[],
  isFlagOn: (key: string) => boolean,
): FlowSurvey | null {
  return (
    surveys.find(
      (survey) =>
        survey.type === 'api' &&
        survey.start_date != null &&
        survey.end_date == null &&
        !seen.includes(survey.id) &&
        survey.questions.length > 0 &&
        (survey.linked_flag_key == null || isFlagOn(survey.linked_flag_key)),
    ) ?? null
  );
}

function ratingBucket(question: FlowQuestion, value: number): string {
  const scale = question.scale ?? 5;
  if (scale === 10) return value <= 6 ? 'detractors' : value <= 8 ? 'passives' : 'promoters';
  if (scale === 3) return value === 1 ? 'negative' : value === 2 ? 'neutral' : 'positive';
  return value <= 2 ? 'negative' : value === 3 ? 'neutral' : 'positive';
}

function responseKey(question: FlowQuestion, answer: SurveyAnswer): string | null {
  if (question.type === 'rating' && typeof answer === 'number') return ratingBucket(question, answer);
  if (question.type === 'single_choice' && typeof answer === 'string') {
    const index = question.choices?.indexOf(answer) ?? -1;
    return index >= 0 ? String(index) : null;
  }
  return null;
}

function resolve(target: string | number | undefined, current: number, count: number): number | 'end' {
  if (target === 'end') return 'end';
  const index = typeof target === 'number' ? target : current + 1;
  return index > current && index < count ? index : 'end';
}

export function nextQuestionIndex(survey: FlowSurvey, current: number, answer: SurveyAnswer): number | 'end' {
  const question = survey.questions[current];
  const count = survey.questions.length;
  const branching = question?.branching;
  if (!branching || branching.type === 'next_question') return resolve(undefined, current, count);
  if (branching.type === 'end') return 'end';
  if (branching.type === 'specific_question') return resolve(branching.index, current, count);
  if (branching.type === 'response_based') {
    const key = responseKey(question, answer);
    const target = key != null ? branching.responseValues?.[key] : undefined;
    return resolve(target, current, count);
  }
  return resolve(undefined, current, count);
}

export function responseProperties(
  survey: FlowSurvey,
  answers: Record<number, SurveyAnswer>,
): Record<string, unknown> {
  const props: Record<string, unknown> = {
    $survey_id: survey.id,
    $survey_name: survey.name,
    $survey_questions: survey.questions.map((question, index) => ({
      id: question.id,
      question: question.question,
      response: answers[index] ?? null,
    })),
  };
  survey.questions.forEach((question, index) => {
    if (!(index in answers)) return;
    props[index === 0 ? '$survey_response' : `$survey_response_${index}`] = answers[index];
    if (question.id) props[`$survey_response_${question.id}`] = answers[index];
  });
  return props;
}
```

The `resolve` rule `index > current` blocks loops back to earlier questions and treats any out-of-range target as end, matching the Review Focus item.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: `SurveyQuestionView`**

Props: `{ question: FlowQuestion; value: SurveyAnswer; onChange: (value: SurveyAnswer) => void }`. Render by `question.type`:
- `open`: multiline `TextInput` styled like `place-picker.tsx`'s input (read it and reuse its style tokens), `maxLength={2000}`, placeholder `Skriv her`.
- `rating`: a row of `scale` (5 or 10; 10 means 0 to 10, so 11 cells) equal-width `Pressable` cells showing the number; selected cell uses `primary` background with `onPrimary` text, others `surfaceSunken`; below, `lowerBoundLabel` left and `upperBoundLabel` right in `xs textMuted`. 11 cells wrap into two rows on narrow phones (`flexWrap: 'wrap'`, cell `minWidth: 44`).
- `single_choice`: one `ListRow`-like `Pressable` per choice with a radio icon (`radio-button-on` / `radio-button-off`, `primary` color).
- `multiple_choice`: same with `checkbox` / `square-outline`; value is `string[]`.
- `link`: render description text only (no input); value stays `null`.
- Any other type: render the question text only and treat as answerable with `null`.
Question text (`lg semibold`) and optional `description` (`sm textMuted`) on top.

- [ ] **Step 6: `SurveyHost`**

Behavior:
1. On mount and on `AppState` change to `active`, when `onboardingDone`, `analyticsActive`, `!openedFromNotification`, `interruption == null`, and the session has not already loaded: `const surveys = await posthog.getSurveys()`; `pickSurvey(surveys as FlowSurvey[], seenSurveys, (key) => flagEnabled(posthog.getFeatureFlag(key)))`. Wait 4000 ms after app start before fetching so it never lands on top of launch.
2. If a survey is picked and `claimInterruption('survey')` returns true: `posthog.capture('survey shown', { $survey_id, $survey_name })`, show `Sheet` titled with `survey.name`.
3. Sheet body: `SurveyQuestionView` for the current index, then a primary `Button` with `question.buttonText ?? (isLast ? 'Send' : 'Neste')`, disabled while the answer is empty and the question is not `optional` (rating/choice null, open blank after trim, multiple empty array). On press: store the answer, compute `nextQuestionIndex`; on `'end'` capture `posthog.capture('survey sent', responseProperties(survey, answers))`, `markSurveySeen(survey.id)`, then show a short thank-you state (`Takk for svaret!` and a `Lukk` button) inside the same sheet.
4. Closing before sending: `posthog.capture('survey dismissed', { $survey_id, $survey_name })` and `markSurveySeen(survey.id)`.

Mount `<SurveyHost />` in `RootNavigator` next to `<WhatsNewHost />`. Follow the derived-visibility pattern from Task 10 if the set-state-in-effect lint rule fires.

Check `posthog.getSurveys()`'s return type in `posthog-rn.d.ts` and cast through `unknown` to `FlowSurvey[]`. If `getSurveys` needs surveys enabled in the client options, enable it (look for a `disableSurveys` option and leave it false).

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit && npx expo lint && npm test`

- [ ] **Step 8: Commit**

```bash
git add -A src
git commit -m "feat: themed in-app PostHog surveys"
```

---

### Task 12: Support feedback thread

**Files:**
- Create: `src/lib/supportApi.ts`
- Test: `src/lib/supportApi.test.ts`
- Create: `src/hooks/useSupportThread.ts`
- Create: `src/app/feedback.tsx`
- Modify: `src/app/_layout.tsx` (register screen)
- Modify: `src/app/(tabs)/more.tsx` (card with unread badge)

**Interfaces:**
- Consumes: `track`, `appVersion` (Task 5); `supportTicketId`, `supportSessionId`, `setSupportTicket` (Task 3); `useRefresh` convention (`src/hooks/useRefresh.ts`).
- Produces in `supportApi.ts` (pure; `fetch` injected):
  - `type SupportMessage = { id: string; content: string; authorType: 'customer' | 'team'; createdAt: string }`
  - `type SendResult = { ok: true; ticketId: string } | { ok: false }`
  - `type ThreadResult = { ok: true; messages: SupportMessage[]; unread: number } | { ok: false; missing: boolean }`
  - `type FetchLike = (url: string, init?: { method?: string; headers?: Record<string, string>; body?: string }) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>`
  - `fetchConversationsToken(fetcher: FetchLike, projectKey: string): Promise<string | null>`
  - `sendSupportMessage(fetcher: FetchLike, args: { token: string; sessionId: string; distinctId: string; ticketId: string | null; message: string; email: string | null }): Promise<SendResult>`
  - `fetchSupportThread(fetcher: FetchLike, args: { token: string; sessionId: string; ticketId: string }): Promise<ThreadResult>`
  - `formatFeedback(kind: FeedbackKind, message: string, context: Record<string, string>): string`
  - `type FeedbackKind = 'Feil' | 'Forslag' | 'Ros' | 'Annet'`
  - `mailtoUrl(message: string): string` (opens a mail to `SUPPORT_EMAIL`)
  - `SUPPORT_EMAIL` (address confirmed by the user in Step 0)

- [ ] **Step 0: Confirm the fallback e-mail address with the user**

Ask: "Which e-mail address should 'Send på e-post' use?" Put the answer in `export const SUPPORT_EMAIL = '...'` in `supportApi.ts`. Do not guess.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  fetchConversationsToken,
  fetchSupportThread,
  formatFeedback,
  sendSupportMessage,
  type FetchLike,
} from './supportApi.ts';

function fake(status: number, body: unknown, seen: { url?: string; init?: unknown } = {}): FetchLike {
  return async (url, init) => {
    seen.url = url;
    seen.init = init;
    return { ok: status >= 200 && status < 300, status, json: async () => body };
  };
}

test('token comes from remote config', async () => {
  assert.equal(await fetchConversationsToken(fake(200, { conversations: { enabled: true, token: 't1' } }), 'phc_x'), 't1');
  assert.equal(await fetchConversationsToken(fake(200, { conversations: { enabled: false, token: 't1' } }), 'phc_x'), null);
  assert.equal(await fetchConversationsToken(fake(500, {}), 'phc_x'), null);
});

test('send posts the widget payload and returns the ticket', async () => {
  const seen: { url?: string; init?: { headers?: Record<string, string>; body?: string } } = {};
  const result = await sendSupportMessage(fake(200, { ticket_id: 'k1' }, seen as never), {
    token: 't1', sessionId: 's1', distinctId: 'd1', ticketId: null, message: '  hei  ', email: null,
  });
  assert.deepEqual(result, { ok: true, ticketId: 'k1' });
  assert.equal(seen.url, 'https://eu.i.posthog.com/api/conversations/v1/widget/message');
  assert.equal(seen.init?.headers?.['X-Conversations-Token'], 't1');
  const body = JSON.parse(seen.init?.body ?? '{}');
  assert.equal(body.message, 'hei');
  assert.equal(body.widget_session_id, 's1');
  assert.equal(body.ticket_id, null);
});

test('send failure and thrown fetch both fail cleanly', async () => {
  const args = { token: 't', sessionId: 's', distinctId: 'd', ticketId: null, message: 'x', email: null };
  assert.deepEqual(await sendSupportMessage(fake(500, {}), args), { ok: false });
  assert.deepEqual(await sendSupportMessage(async () => { throw new Error('offline'); }, args), { ok: false });
});

test('thread maps messages and flags a deleted ticket', async () => {
  const thread = await fetchSupportThread(
    fake(200, { unread_count: 1, messages: [{ id: 'm1', content: 'svar', author_type: 'team', created_at: '2026-10-03T10:00:00Z' }] }),
    { token: 't', sessionId: 's', ticketId: 'k1' },
  );
  assert.deepEqual(thread, { ok: true, unread: 1, messages: [{ id: 'm1', content: 'svar', authorType: 'team', createdAt: '2026-10-03T10:00:00Z' }] });
  assert.deepEqual(await fetchSupportThread(fake(404, {}), { token: 't', sessionId: 's', ticketId: 'k1' }), { ok: false, missing: true });
  assert.deepEqual(await fetchSupportThread(fake(500, {}), { token: 't', sessionId: 's', ticketId: 'k1' }), { ok: false, missing: false });
});

test('formatFeedback prefixes kind and appends context', () => {
  assert.equal(formatFeedback('Feil', 'Krasjer', { versjon: '1.9.0', enhet: 'iPhone' }), '[Feil] Krasjer\n\nversjon: 1.9.0\nenhet: iPhone');
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `supportApi.ts`**

```ts
export const SUPPORT_EMAIL = '<confirmed in Step 0>';
const API_HOST = 'https://eu.i.posthog.com';
const CONFIG_HOST = 'https://eu-assets.i.posthog.com';

export type FeedbackKind = 'Feil' | 'Forslag' | 'Ros' | 'Annet';

export type SupportMessage = {
  id: string;
  content: string;
  authorType: 'customer' | 'team';
  createdAt: string;
};

export type SendResult = { ok: true; ticketId: string } | { ok: false };

export type ThreadResult =
  | { ok: true; messages: SupportMessage[]; unread: number }
  | { ok: false; missing: boolean };

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; body?: string },
) => Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>;

type RawMessage = { id: string; content: string; author_type: string; created_at: string };

export async function fetchConversationsToken(fetcher: FetchLike, projectKey: string): Promise<string | null> {
  try {
    const response = await fetcher(`${CONFIG_HOST}/array/${projectKey}/config`);
    if (!response.ok) return null;
    const body = (await response.json()) as { conversations?: { enabled?: boolean; token?: string } };
    return body.conversations?.enabled && body.conversations.token ? body.conversations.token : null;
  } catch {
    return null;
  }
}

export async function sendSupportMessage(
  fetcher: FetchLike,
  args: { token: string; sessionId: string; distinctId: string; ticketId: string | null; message: string; email: string | null },
): Promise<SendResult> {
  try {
    const response = await fetcher(`${API_HOST}/api/conversations/v1/widget/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Conversations-Token': args.token },
      body: JSON.stringify({
        message: args.message.trim(),
        traits: { name: null, email: args.email },
        ticket_id: args.ticketId,
        widget_session_id: args.sessionId,
        distinct_id: args.distinctId,
      }),
    });
    if (!response.ok) return { ok: false };
    const body = (await response.json()) as { ticket_id?: string };
    return body.ticket_id ? { ok: true, ticketId: body.ticket_id } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function fetchSupportThread(
  fetcher: FetchLike,
  args: { token: string; sessionId: string; ticketId: string },
): Promise<ThreadResult> {
  try {
    const query = `widget_session_id=${encodeURIComponent(args.sessionId)}&limit=50`;
    const response = await fetcher(`${API_HOST}/api/conversations/v1/widget/messages/${args.ticketId}?${query}`, {
      headers: { 'X-Conversations-Token': args.token },
    });
    if (response.status === 404) return { ok: false, missing: true };
    if (!response.ok) return { ok: false, missing: false };
    const body = (await response.json()) as { unread_count?: number; messages?: RawMessage[] };
    return {
      ok: true,
      unread: body.unread_count ?? 0,
      messages: (body.messages ?? []).map((message) => ({
        id: message.id,
        content: message.content,
        authorType: message.author_type === 'customer' ? 'customer' : 'team',
        createdAt: message.created_at,
      })),
    };
  } catch {
    return { ok: false, missing: false };
  }
}

export function formatFeedback(kind: FeedbackKind, message: string, context: Record<string, string>): string {
  const lines = Object.entries(context).map(([key, value]) => `${key}: ${value}`);
  return `[${kind}] ${message.trim()}\n\n${lines.join('\n')}`;
}

export function mailtoUrl(message: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Tilbakemelding Bønnetid')}&body=${encodeURIComponent(message)}`;
}
```

Remove the angle-bracket placeholder by Step 0's answer before running tests; the tests do not read `SUPPORT_EMAIL`.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all passing.

- [ ] **Step 5: `useSupportThread` hook**

Uses `fetch` (global) as the `FetchLike`, `process.env.EXPO_PUBLIC_POSTHOG_KEY`, `posthog.getDistinctId()`, and react-query (`useQuery` key `['support-thread', ticketId]`, `staleTime: 0`, enabled only with a ticket) for the thread; token via `useQuery(['support-token'], ..., { staleTime: 24h })`. Session id: if `supportSessionId` is null, generate with `Crypto.randomUUID()` from `expo-crypto` (check it is installed; if not, `npx expo install expo-crypto`) and persist via `setSupportTicket(ticketId, sessionId)` on first send. Exposes:

```ts
{
  messages: SupportMessage[];
  unread: number;
  hasTicket: boolean;
  send: (text: string, email: string | null) => Promise<boolean>;
  refresh: () => Promise<void>;
}
```

On thread result `missing: true`, call `setSupportTicket(null, sessionId)`. The react-query cache persists to AsyncStorage; exclude the support keys from persistence by checking how `_layout.tsx`'s persister decides what to dehydrate (if there is a `shouldDehydrateQuery` predicate, add `queryKey[0] !== 'support-thread'`; if not, add one). Read `bonnetid-request-load` memory notes on the refresh predicate before editing.

- [ ] **Step 6: `feedback.tsx` screen**

Layout (inside `Screen scroll edges={[]}`):
- If `hasTicket`: a `Card` listing messages oldest first; customer messages right-aligned on `primarySoft`, team messages left-aligned on `surfaceSunken`, each with time `HH:MM, d. MMM` in `xs textMuted`. Pull-to-refresh via the repo's `useRefresh` convention.
- Form card: `SegmentedControl` (read its props in `src/components/ui/SegmentedControl.tsx`) with `Feil`, `Forslag`, `Ros`, `Annet`, default `Forslag`; hidden after the first message (follow-ups are free text).
- Multiline `TextInput` (same style as Task 11's open question), placeholder `Hva vil du fortelle oss?`, `maxLength={2000}`.
- Optional e-mail `TextInput` (`keyboardType="email-address"`, `autoCapitalize="none"`), placeholder `E-post (valgfritt, hvis du vil ha svar på e-post)`; only before the first message.
- Primary `Button` `Send` (loading while sending, disabled when text is blank or within 60 s of the last send).
- On success: clear text, `track('feedback_sent', { kind })`, refresh thread, show inline `Takk! Vi svarer her.` under the button.
- On failure: `track('feedback_failed')`, show `Kunne ikke sende. Sjekk nettet og prøv igjen.` in `danger`, keep the text, and show a secondary `Button` `Send på e-post` that opens `mailtoUrl(formatted)` via `Linking.openURL`.
- `track('feedback_opened')` once on mount.
- Context passed to `formatFeedback`: `versjon` (appVersion), `plattform` (`Platform.OS` + `Platform.Version`), `enhet` (`Device.modelName` from `expo-device`), `sted` (active location name), `tider` (`moské` or `beregnet`).

Register in `_layout.tsx` with the shared header options and `title: 'Tilbakemelding'`.

- [ ] **Step 7: Mer card**

In `more.tsx` add a card (before "Hva er nytt"): `href: '/feedback'`, icon `chatbubble-ellipses-outline`, title `Gi tilbakemelding` when no ticket, `Meldinger` when `hasTicket`, description `Skriv til oss, vi svarer i appen`. When `unread > 0`, show a `Badge` with the count. `FeatureCard` has no badge slot; add an optional `badge?: string` prop to `FeatureCard` rendered before the chevron with the existing `Badge` component. Fetch the thread on Mer focus only (not globally).

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit && npx expo lint && npm test`

- [ ] **Step 9: Commit**

```bash
git add -A src package.json package-lock.json
git commit -m "feat: in-app feedback thread through PostHog Support"
```

---

### Task 13: End-to-end verification on the simulator, docs and memory

**Files:**
- Modify: `CLAUDE.md` (telemetry line, test command)
- Modify: `docs/superpowers/specs/2026-10-03-posthog-feedback-whatsnew-design.md` (file name stays `telemetry.ts`; survey suppression is per session)
- Memory: update `bonnetid-telemetry.md` (superseded by PostHog) and `bonnetid-feedback-slack.md`

- [ ] **Step 1: Dev build on the simulator**

Follow the `bonnetid-always-rebuild-sim` memory: build from `../Bonnetid-main` after `git checkout -B main-build origin/main`, `npx expo prebuild -p ios --clean`, `npm run ios:sim` (Xcode 27). Metro on 8082 if 8081 is taken (check with `lsof` first).

- [ ] **Step 2: Verify each surface, record evidence**

1. Events: open PostHog Live events (eu.posthog.com project 292238) in Chrome and confirm `Application Opened`, `$screen` with `index`, and a `track` event (toggle a setting) arrive with `kommune` and `times_mode`.
2. Error: temporarily trigger `trackError(new Error('posthog test'), 'manual')` from a dev-only path, confirm it shows in Error tracking, then remove the trigger.
3. Survey: in Chrome create an API survey "Test" (one rating question), launch it, relaunch the app, answer, confirm the response in the survey's results, then archive the survey.
4. Support: send a message from `feedback.tsx`, reply in the PostHog Support inbox, pull to refresh in the app, confirm the reply renders and the Mer card shows the unread badge before opening.
5. What's new: temporarily set `lastSeenWhatsNew` to `'1.7.0'` and an entry for the running version, confirm the sheet shows once and not again after closing; revert.
6. Flags: set `qibla-ar` to 0 percent in PostHog, relaunch, confirm the AR segment is gone; restore to 100 percent. Repeat quickly for `duas`.
7. Review prompt: cannot be visually confirmed on the simulator (StoreKit sheet does not show in dev builds reliably); confirm via the `review_prompt_requested` event after logging 5 prayers.
8. Opt-out: toggle "Del anonym bruksdata" off, confirm no new events arrive in Live events.

Take simulator screenshots of the feedback thread, the survey sheet, the what's-new sheet and the Mer screen. Send them to the user with SendUserFile.

- [ ] **Step 3: Docs**

In `CLAUDE.md`: add `npm test` under Commands (`node --test` over `src/**/*.test.ts`, pure modules only) and a line under Conventions: "Telemetry is PostHog EU via `src/lib/telemetry.ts` (`track`, `trackError`); feature flags via `useFeature`, default on." Update the spec's two stale points.

- [ ] **Step 4: Commit and push**

```bash
git add CLAUDE.md docs
git commit -m "docs: PostHog telemetry, tests and flags in project notes"
git push origin main
```
