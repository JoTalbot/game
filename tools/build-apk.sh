#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SDK="${ANDROID_SDK_ROOT:-/tmp/android-sdk}"
API=34
BUILD_TOOLS_VER="34.0.0"
BT="$SDK/build-tools/$BUILD_TOOLS_VER"
JAR="$SDK/platforms/android-$API/android.jar"
APP="$ROOT/android/app/src/main"
OUT="$ROOT/dist"
WORK="/tmp/igra-apk"
NAME="igra-3.0.1.apk"
VCODE=601
VNAME="3.0.1"

# Signing contract:
# - Release builds MUST provide IGRA_KEYSTORE and IGRA_KEYSTORE_PASSWORD.
# - Local/non-release checks may fall back to the generated debug key.
# The CI workflow enforces the release contract for tags.
SIGNING_MODE="${IGRA_SIGNING_MODE:-debug}"
KEYSTORE="${IGRA_KEYSTORE:-$OUT/debug.keystore}"
KEYSTORE_PASSWORD="${IGRA_KEYSTORE_PASSWORD:-android}"
KEY_ALIAS="${IGRA_KEY_ALIAS:-igra}"

if [ "$SIGNING_MODE" = "release" ]; then
  if [ ! -f "$KEYSTORE" ]; then
    echo "ERROR: release signing requested but keystore is missing: $KEYSTORE" >&2
    exit 1
  fi
  if [ -z "${IGRA_KEYSTORE_PASSWORD:-}" ]; then
    echo "ERROR: release signing requested but IGRA_KEYSTORE_PASSWORD is empty" >&2
    exit 1
  fi
else
  KEYSTORE="$OUT/debug.keystore"
  KEYSTORE_PASSWORD="android"
  KEY_ALIAS="igra"
fi

echo "==> sync web → assets"
rm -rf "$APP/assets/www"
mkdir -p "$APP/assets"
cp -a "$ROOT/web" "$APP/assets/www"

echo "==> work dir"
rm -rf "$WORK"
mkdir -p "$WORK/compiled" "$WORK/gen" "$WORK/classes" "$OUT"
echo "==> aapt2 compile/link"
find "$APP/res" -type f | while read -r f; do
  "$BT/aapt2" compile -o "$WORK/compiled" "$f"
done
FLAT=( "$WORK/compiled"/*.flat )
"$BT/aapt2" link \
  -o "$WORK/res.apk" \
  -I "$JAR" \
  --manifest "$APP/AndroidManifest.xml" \
  --java "$WORK/gen" \
  -A "$APP/assets" \
  --min-sdk-version 26 \
  --target-sdk-version 34 \
  --version-code "$VCODE" \
  --version-name "$VNAME" \
  --auto-add-overlay \
  "${FLAT[@]}"

echo "==> javac"
find "$WORK/gen" -name 'R.java' -print
javac --release 11 -encoding UTF-8 \
  -cp "$JAR" \
  -d "$WORK/classes" \
  "$WORK/gen/world/igra/app/R.java" \
  "$APP/java/world/igra/app/MainActivity.java"

echo "==> d8"
find "$WORK/classes" -name '*.class' > "$WORK/classes.list"
"$BT/d8" --min-api 26 --lib "$JAR" --output "$WORK" @"$WORK/classes.list"

echo "==> merge dex into apk"
cp "$WORK/res.apk" "$WORK/merged.apk"
(
  cd "$WORK"
  zip -q -u merged.apk classes.dex
)

echo "==> zipalign + sign ($SIGNING_MODE)"
if [ "$SIGNING_MODE" != "release" ]; then
  if [ ! -f "$OUT/debug.keystore" ]; then
    keytool -genkeypair -v \
      -keystore "$OUT/debug.keystore" \
      -storepass android -keypass android \
      -alias igra -keyalg RSA -keysize 2048 -validity 10000 \
      -dname "CN=IGRA, O=JoTalbot, C=UA"
  fi
fi
"$BT/zipalign" -p -f 4 "$WORK/merged.apk" "$WORK/aligned.apk"
"$BT/apksigner" sign \
  --ks "$KEYSTORE" \
  --ks-pass "pass:$KEYSTORE_PASSWORD" \
  --key-pass "pass:$KEYSTORE_PASSWORD" \
  --ks-key-alias "$KEY_ALIAS" \
  --out "$OUT/$NAME" \
  "$WORK/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT/$NAME" | head -20

echo "==> checksum"
sha256sum "$OUT/$NAME" | tee "$OUT/$NAME.sha256"
