#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

udid=$(xcrun simctl list devices booted | grep -oE '[0-9A-F-]{36}' | head -1)
if [ -z "$udid" ]; then
  echo "No booted simulator. Boot one with: xcrun simctl boot 'iPhone 16 Pro'" >&2
  exit 1
fi

[ -d ios ] || npx expo prebuild -p ios

xcodebuild \
  -workspace ios/Bnnetid.xcworkspace \
  -scheme Bnnetid \
  -configuration Debug \
  -destination "id=$udid" \
  -derivedDataPath ios/build/dd \
  build | grep -E "error:|BUILD (SUCCEEDED|FAILED)"

xcrun simctl install "$udid" ios/build/dd/Build/Products/Debug-iphonesimulator/Bnnetid.app
xcrun simctl spawn "$udid" defaults write no.irn.bonnetid EXDevMenuIsOnboardingFinished -bool YES
xcrun simctl spawn "$udid" defaults write no.irn.bonnetid EXDevMenuShowsAtLaunch -bool NO
xcrun simctl terminate "$udid" no.irn.bonnetid 2>/dev/null || true
xcrun simctl launch "$udid" no.irn.bonnetid --initialUrl "http://localhost:${RCT_METRO_PORT:-8081}"
open -a DeviceHub 2>/dev/null || true
