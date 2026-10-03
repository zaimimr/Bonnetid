# PostHog, feedback, surveys and "what's new"

Date: 2026-10-03

## Goal

Understand how people use Bønnetid, hear from them directly, and tell them what changed. One vendor (PostHog EU) replaces Sentry for analytics, errors and session replay, and also carries feature flags, surveys and the support inbox.

## Decisions

- PostHog EU (`https://eu.i.posthog.com`) for product analytics, error tracking, session replay, feature flags, surveys and Support.
- Sentry is removed in the same round. No parallel period.
- Feedback goes to PostHog Support as a two-way thread. The Slack webhook is not used.
- Feature flags default to ON when no value is known (offline first launch, PostHog unreachable). Flags are kill switches.
- "What's new" content is bundled in the app per version, not fetched.
- The PostHog wizard is not used. Integration is written by hand.

## 1. Analytics base

- `src/lib/analytics.ts` replaces `src/lib/telemetry.ts`. It owns the PostHog client and exports `track(event, props)` and `trackError(error, source, extra)` with the current signatures, so existing call sites only change their import path.
- Key from `EXPO_PUBLIC_POSTHOG_KEY`, host from `EXPO_PUBLIC_POSTHOG_HOST`. With no key, every export is a no-op.
- `PostHogProvider` wraps the root layout. Screen views are captured manually from expo-router `usePathname` (route pattern, not raw params).
- Errors: JS exception autocapture, native crash autocapture via `@posthog/react-native-plugin`, source maps and native symbols uploaded by the `posthog-react-native/expo` plugin when `POSTHOG_PERSONAL_API_KEY` is present at build time.
- Session replay via `posthog-react-native-session-replay`: text inputs masked, text and images visible. Native only, inert in Expo Go.
- Identity: anonymous distinct id. No IDFA, no GPS coordinates. Registered super properties: `kommune` (location name), `times_mode` (`mosque` or `calculated`), `travel_mode` (boolean).
- Settings gets "Del anonym bruksdata" (default on). Off calls `optOut()`, which stops events and replay.
- react-query errors keep flowing to `trackError` through `QueryCache.onError`.
- Sentry removal: `@sentry/react-native` dependency, `metro.config.js` Sentry wrapper, the app.json plugin, `EXPO_PUBLIC_SENTRY_DSN` in `.env` and EAS env.

## 2. Feature flags

- `useFeature(flag)` returns `true` unless PostHog explicitly returns `false` for the flag.
- Flags: `duas`, `tasbih`, `mosque-donation`, `qibla-ar`, `prayer-tracker`.
- When a flag is off, its entry points are hidden and its route redirects back.

## 3. Surveys

- `SurveyHost` mounted once in the root layout. It calls `getActiveMatchingSurveys` on start and on app foreground and shows at most one survey per session.
- Own themed bottom sheet in Norwegian, built from `src/components/ui`. Supported question types: single choice, multiple choice, rating (1 to 5 and 0 to 10), open text. Branching follows the survey definition.
- Captures `survey shown`, `survey sent` (with `$survey_response*` and `$survey_questions`) and `survey dismissed`, so results appear in the PostHog survey view.
- Never shown during onboarding, and not within 30 seconds of the app being opened from a notification.
- Surveys are created in the dashboard as type "API".

## 4. Support

- "Gi tilbakemelding" card in Mer opens `feedback.tsx`: type chips (Feil, Forslag, Ros, Annet), message (required, max 2000 characters), optional e-mail.
- Sends to `POST /api/conversations/v1/widget/message` with the conversations token from the remote config, the same calls posthog-js makes. This API is not documented for mobile and may change.
- Ticket id stored locally. Once a ticket exists, the card reads "Meldinger" with an unread badge, and a thread screen lists messages from `/api/conversations/v1/widget/messages/{ticketId}` on open and on pull-to-refresh.
- On failure the error is shown, the text is kept, and "Send på e-post" opens `mailto:` with the text prefilled.
- Events: `feedback_opened`, `feedback_sent`, `feedback_failed`.

## 5. What's new

- `src/lib/whatsNew.ts`: list of `{ version, items: { title, body, route?, flag? }[] }`.
- Sheet shown once after an update when the current app version has an entry newer than `lastSeenVersion`. Not shown on a fresh install (onboarding covers it). Settings version bump stores `lastSeenVersion`.
- Archive at "Hva er nytt" in Mer. Items whose flag is off are hidden. Items with a route get a "Prøv nå" button.
- Events: `whats_new_shown`, `whats_new_opened_item`.

## 6. Store ratings (primary ask)

Store ratings are the main thing we ask users for. Surveys and feedback stay secondary.

- No sentiment gate. Never ask "do you like the app" before the native prompt (Google Play in-app review policy, Apple review gating).
- `useReviewPrompt` stops prompting at launch. It requests the native review sheet (`expo-store-review`) when a trigger has fired and the user is on Oversikt with nothing else open. Triggers:
  - `prayers_logged`: 5 prayers marked as prayed in the tracker.
  - `active_days`: app opened on 7 distinct days.
  - `mosque_return`: a mosque is selected and the app is opened on a later day.
- Re-ask allowed once 120 days have passed since the last request and the app version has changed. The OS still applies its own quota.
- Suppressed during onboarding, when the app was opened from a notification, after a tracked error in the session, and in a session where what's new or a survey was shown.
- Explicit links stay: "Vurder Bønnetid" card in Mer, and a "Gi Bønnetid en vurdering" button in the what's-new sheet that calls `openStoreReview()`.
- Event `review_prompt_requested` with `trigger`.
- Surveys are only for targeted product questions and are never shown in the same session as the review prompt.

## PostHog project setup

- Project timezone Europe/Oslo, discard client IP.
- Enable exception autocapture, session replay for mobile, surveys, Support.
- Create the five flags at 100 percent rollout.
- Dashboard "Bønnetid": daily and weekly active users, retention, top screens, feature usage, onboarding funnel, feedback funnel, errors by version, users by version, platform, kommune, times mode, review prompt requests.

## Verification

- `npx tsc --noEmit`, `npx expo lint`, `npx expo export`.
- Dev build on the simulator: events visible in PostHog Live events, a test API survey renders and its answer shows in PostHog, a test ticket arrives in Support and a reply appears in the app thread, the what's-new sheet shows once after a simulated version bump, toggling each flag hides its feature.
