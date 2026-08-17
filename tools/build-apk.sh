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
NAME="igra-1.7.1"
VCODE=171
VNAME="1.7.1"

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
# apk is a zip; add classes.dex at root
(
  cd "$WORK"
  zip -q -u merged.apk classes.dex
)

echo "==> zipalign + sign"
if [ ! -f "$OUT/debug.keystore" ]; then
  keytool -genkeypair -v \
    -keystore "$OUT/debug.keystore" \
    -storepass android -keypass android \
    -alias igra -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=IGRA, O=JoTalbot, C=UA"
fi
"$BT/zipalign" -p -f 4 "$WORK/merged.apk" "$WORK/aligned.apk"
"$BT/apksigner" sign \
  --ks "$OUT/debug.keystore" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --ks-key-alias igra \
  --out "$OUT/$NAME.apk" \
  "$WORK/aligned.apk"
"$BT/apksigner" verify --verbose "$OUT/$NAME.apk" | head -20

cp -f "$OUT/$NAME.apk" "$OUT/igra.apk"
cp -f "$OUT/$NAME.apk" "$ROOT/docs/igra.apk"
ls -lh "$OUT/$NAME.apk"
echo "==> done $OUT/$NAME.apk"
