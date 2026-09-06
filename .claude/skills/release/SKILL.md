---
name: release
description: Ship a Bønnetid release - bump the version, build iOS + Android (mobile and automotive) on EAS, and submit to App Store Connect and Google Play on both the production and internal-testing tracks. Use when asked to cut a release, make new builds, ship to the stores, or push a build to TestFlight/Play internal.
---

# Release runbook

Four artifacts leave the machine every round:

| Artifact | Build profile | Goes to |
| --- | --- | --- |
| iOS `.ipa` | `production` | App Store Connect (TestFlight is automatic, App Store review is manual) |
| Android mobile `.aab` | `production` | Play `production` + Play `internal` |
| Android automotive `.aab` | `production-automotive` | Play `automotive:production` + `automotive:internal` |

Skipping the automotive bundle regresses Android Automotive OS to the previous version code, which is what earned the AAOS policy rejection before. Always build all three.

## 1. Decide the version, then check what is in flight

Ask the user for the version bump if it is not obvious from the merged PRs (feature merges = minor, fixes only = patch).

Before submitting anything to Play production, check whether a review is already running:

- `https://play.google.com/console/u/0/developers/<devId>/app/<appId>/policy-center` - "No issues found" means no open enforcement.
- `https://play.google.com/console/u/0/developers/<devId>/app/<appId>/publishing` - the Publishing overview is the only trustworthy status card. "Your changes are now in review" means a submission is pending.

A new production release pushed on top of a pending review supersedes it and restarts the verdict. Surface that to the user and let them choose; do not decide it alone.

## 2. Bump and gate

```bash
git checkout -b chore/release-<x-y-z>
# edit app.json -> expo.version only. Build numbers are remote (appVersionSource: remote, autoIncrement).
rm -f .expo/types/router.d.ts   # a stale one throws bogus route errors on any branch
npx tsc --noEmit
npx expo lint
git commit -am "chore: release <x.y.z>" && git push -u origin chore/release-<x-y-z>
gh pr create --title "chore: release <x.y.z>" --body-file <file> --base main
```

`gh pr edit` is broken on this repo (deprecated Projects classic GraphQL). Use `gh api -X PATCH repos/zaimimr/Bonnetid/pulls/<n> -F body=@file`.

## 3. Build

Use the repo-local `eas` (pnpm global). `npx eas-cli@latest` fails with `Invalid Version:` here.

```bash
eas build -p ios     --profile production            --non-interactive --no-wait
eas build -p android --profile production            --non-interactive --no-wait
eas build -p android --profile production-automotive --non-interactive --no-wait
```

`--no-wait` returns a build URL immediately; poll with `eas build:list --limit 5 --non-interactive --json`.

Each Android profile auto-increments its own version code, so the mobile and automotive bundles land on different version codes. That is expected and required - Play refuses two bundles with the same code.

### iOS credentials trap

`eas build` never forces an Apple login when a provisioning profile already exists, so a newly added capability (Time Sensitive notifications, App Groups, Live Activities) silently misses the build. After adding any entitlement in `app.json`, run `eas credentials -p ios` in a **real terminal** - the `!` prefix in Claude Code has no TTY and Apple auth needs one. Confirm the profile's "Updated" line in the credentials table reads today before trusting the build.

## 4. Submit

```bash
eas submit -p ios     --profile production            --id <ios-build-id>        --non-interactive
eas submit -p android --profile production            --id <android-build-id>    --non-interactive
eas submit -p android --profile production-automotive --id <automotive-build-id> --non-interactive
```

**One `eas submit` per Android bundle, not one per track.** The Play API refuses the second upload of a version code even when it targets a different track:

> You've already submitted this version of the app. Versions are identified by Android version code

So `--profile testing` and `--profile testing-automotive` fail after the matching production submit has run. Put the bundle on the internal track from the Console instead, which reuses the already-uploaded artifact:

1. Test and release -> Testing -> Internal testing. For the automotive bundle, first switch the form-factor dropdown (top right) from "Phones, Tablets, Chrome OS, Android XR" to **Automotive OS only** - it is a separate track with its own releases.
2. **Create new release**. If the button is greyed out, a draft release is blocking the track - open it with "Edit release" and reuse it.
3. **Add from library** -> tick the new version code -> Add to release.
4. A reused draft can still carry an old bundle, which then fails review with "This APK will not be served to any users because it is completely shadowed by one or more APKs with higher version codes." Remove it: the row's **Manage artifact** menu -> Remove app bundle. It stays in the artifact library.
5. Set the release name to `<versionCode> (<version>)`, write the Norwegian release notes inside `<no-NO>` tags, **Next**, then **Save and publish**.

A remaining "no deobfuscation file" warning is harmless. A warning that the release "will not be available to any users because you haven't specified any testers" means that track has no tester list - the bundle still lands, but nobody receives it. Tell the user; do not add testers on your own.

iOS needs only one submit: it uploads to App Store Connect, and TestFlight internal testers get it automatically once processing finishes. There is no separate iOS internal-testing submit profile to run.

Non-interactive iOS submit needs `submit.production.ios.ascAppId` in `eas.json` (`6792056685`). Android uses the Play service-account key stored at the EAS account level - no key file in the repo.

## 5. Finish the App Store release by hand

`eas submit` only uploads the build. Releasing to the App Store still needs, in App Store Connect:

1. Create the new version under the app.
2. Attach the processed build, fill "What's New".
3. Submit for review.

Drive it with the claude-in-chrome tools against the user's logged-in Chrome. Never enter Apple credentials.

## 6. Play checks after submitting

- Play runs "quick checks for commonly found issues" (up to ~14 min) before the changes actually reach review.
- The exact-alarm declaration at `/app-content/use-exact-alarm` is an API-only requirement; the Console release flow never prompts for it. Answer "Alarm clock". Sending it restarts any in-flight review, so send it only when nothing is pending.
- **A paused track does not deactivate its bundle.** Old version codes stay live under Paused tracks (behind the "Show" toggle on `/closed-testing`) and Google's policy reviewers still read them. To retire one, create a new release on that track with the current bundle and the old code under "Not included".
- Car/AAOS screenshots live in the **default** store listing's Android Automotive OS section, not in a separate automotive listing.

## Attribution

Never mention Claude, Codex, AI, an agent, or a tool in branch names, commit messages, PR titles, PR bodies, or release notes. Release notes are Norwegian bokmål.
