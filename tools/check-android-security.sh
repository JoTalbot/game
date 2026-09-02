#!/usr/bin/env bash
set -euo pipefail

f="android/app/src/main/java/world/igra/app/MainActivity.java"
m="android/app/src/main/AndroidManifest.xml"

[ -f "$f" ] || { echo "missing $f" >&2; exit 1; }
[ -f "$m" ] || { echo "missing $m" >&2; exit 1; }

grep -F 's.setAllowFileAccess(false);' "$f" >/dev/null
grep -F 's.setAllowContentAccess(false);' "$f" >/dev/null
grep -F 's.setAllowFileAccessFromFileURLs(false);' "$f" >/dev/null
grep -F 's.setAllowUniversalAccessFromFileURLs(false);' "$f" >/dev/null
grep -F 's.setSafeBrowsingEnabled(true);' "$f" >/dev/null
grep -F 'android:usesCleartextTraffic="false"' "$m" >/dev/null

if grep -F 's.setAllowFileAccess(true);' "$f" >/dev/null; then
  echo 'unsafe file access enabled' >&2
  exit 1
fi
if grep -F 's.setAllowContentAccess(true);' "$f" >/dev/null; then
  echo 'unsafe content access enabled' >&2
  exit 1
fi
if grep -F 's.setAllowFileAccessFromFileURLs(true);' "$f" >/dev/null; then
  echo 'unsafe file-origin access enabled' >&2
  exit 1
fi
if grep -F 's.setAllowUniversalAccessFromFileURLs(true);' "$f" >/dev/null; then
  echo 'unsafe universal file-origin access enabled' >&2
  exit 1
fi
if grep -F 's.setSafeBrowsingEnabled(false);' "$f" >/dev/null; then
  echo 'Safe Browsing disabled' >&2
  exit 1
fi
if grep -F 'android:usesCleartextTraffic="true"' "$m" >/dev/null; then
  echo 'cleartext traffic enabled' >&2
  exit 1
fi

echo 'Android WebView security checks passed'
