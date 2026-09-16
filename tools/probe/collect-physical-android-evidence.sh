#!/usr/bin/env bash
set -euo pipefail

# Collects physical-device metadata and creates a reviewable evidence template.
# This intentionally produces PENDING results. It does NOT prove physical acceptance.

APK="${1:-igra-3.0.1.apk}"
OUT="${2:-physical-android-evidence.json}"
EXPECTED_SHA="b1785e9e69f806464e4d446507bfc2ab6e528de2298ee048072901274a0ef03f"

command -v adb >/dev/null || { echo "adb is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "sha256sum is required" >&2; exit 1; }
command -v node >/dev/null || { echo "node is required" >&2; exit 1; }
[[ -f "$APK" ]] || { echo "APK not found: $APK" >&2; exit 1; }

adb wait-for-device
STATE="$(adb get-state 2>/dev/null)"
[[ "$STATE" == "device" ]] || { echo "ADB device is not ready: $STATE" >&2; exit 1; }

ACTUAL_SHA="$(sha256sum "$APK" | awk '{print $1}')"
[[ "$ACTUAL_SHA" == "$EXPECTED_SHA" ]] || {
  echo "APK SHA mismatch: expected $EXPECTED_SHA, got $ACTUAL_SHA" >&2
  exit 1
}

manufacturer="$(adb shell getprop ro.product.manufacturer | tr -d '\r')"
model="$(adb shell getprop ro.product.model | tr -d '\r')"
android_version="$(adb shell getprop ro.build.version.release | tr -d '\r')"
resolution="$(adb shell wm size | awk -F': ' '/Physical size:/ {print $2; exit}' | tr -d '\r')"
density="$(adb shell wm density | awk -F': ' '/Physical density:/ {print $2; exit}' | tr -d '\r')"
ram="$(adb shell cat /proc/meminfo | awk '/MemTotal:/ {printf "%.0f MB", $2/1024; exit}' | tr -d '\r')"
profile="other"

# Reject common emulator/simulator identities before creating evidence.
qemu="$(adb shell getprop ro.kernel.qemu | tr -d '\r')"
hardware="$(adb shell getprop ro.hardware | tr -d '\r')"
if [[ "$qemu" == "1" ]] || printf '%s\n' "$manufacturer $model $hardware" | grep -Eiq 'emulator|simulator|goldfish|ranchu|sdk_gphone|generic'; then
  echo "Physical Android collector rejected emulator/simulator identity: manufacturer=$manufacturer model=$model hardware=$hardware qemu=$qemu" >&2
  exit 1
fi

started="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

export OUT manufacturer model android_version resolution density ram profile started ACTUAL_SHA
node <<'NODE'
const fs = require('fs');
const out = process.env.OUT;
const now = process.env.started;
const names = [
  'Clean install',
  'Boot / birth / gameplay',
  'Home → resume',
  'Save → restart → recovery',
  'Force-stop → recovery',
  'Old save → upgrade',
  'Offline',
  'Release / Become / NG+',
  'Vibration',
  'Audio',
  'Fullscreen',
  'Crash',
  'ANR',
  'Heavy-frame / performance blocker',
  'Critical visual blocker',
  'Critical touch blocker'
];
const evidence = {
  schema: 1,
  artifact: {
    version: '3.0.1',
    versionCode: 601,
    commit: '909203f203fc1e695e4d481aeaf34c81b135aff0',
    apkSha256: process.env.ACTUAL_SHA
  },
  device: {
    manufacturer: process.env.manufacturer,
    model: process.env.model,
    androidVersion: process.env.android_version,
    resolution: process.env.resolution,
    density: process.env.density,
    ram: process.env.ram,
    profile: process.env.profile
  },
  test: { startedAtUtc: now, endedAtUtc: now },
  results: names.map(name => ({ name, status: 'PENDING', description: 'Not executed yet.' })),
  evidence: [{ type: 'collection', path: out }],
  physicalAndroid: false,
  IGRA_PHYSICAL_ANDROID: false
};
fs.writeFileSync(out, JSON.stringify(evidence, null, 2) + '\n');
NODE

echo "Created $OUT from physical Android device metadata."
echo "APK SHA verified: $ACTUAL_SHA"
echo "All acceptance results are intentionally PENDING; complete the physical run before validation."
