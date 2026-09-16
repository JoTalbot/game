#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COLLECTOR="$ROOT/tools/probe/collect-physical-android-evidence.sh"
COLLECTOR_CMD=(bash "$COLLECTOR")
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

FAKE_ADB="$TMP/adb"
cat > "$FAKE_ADB" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${FAKE_ADB_MODE:-emulator}" == "emulator" ]]; then
  case " $* " in
    *" wait-for-device "*) exit 0 ;;
    *" get-state "*) printf 'device\n' ;;
    *" shell getprop ro.product.manufacturer "*) printf 'Google\n' ;;
    *" shell getprop ro.product.model "*) printf 'sdk_gphone64_x86_64\n' ;;
    *" shell getprop ro.build.version.release "*) printf '14\n' ;;
    *" shell wm size "*) printf 'Physical size: 1080x2400\n' ;;
    *" shell wm density "*) printf 'Physical density: 420\n' ;;
    *" shell getprop ro.product.cpu.abilist "*) printf 'arm64-v8a\n' ;;
    *" shell getprop ro.kernel.qemu "*) printf '1\n' ;;
    *" shell getprop ro.hardware "*) printf 'ranchu\n' ;;
    *" shell cat /proc/meminfo "*) printf 'MemTotal:        4096000 kB\n' ;;
    *) exit 0 ;;
  esac
fi

case " $* " in
  *" wait-for-device "*) exit 0 ;;
  *" get-state "*) printf 'device\n' ;;
  *" shell getprop ro.product.manufacturer "*) printf 'TestVendor\n' ;;
  *" shell getprop ro.product.model "*) printf 'TestPhone X1\n' ;;
  *" shell getprop ro.build.version.release "*) printf '14\n' ;;
  *" shell wm size "*) printf 'Physical size: 1080x2400\n' ;;
  *" shell wm density "*) printf 'Physical density: 420\n' ;;
  *" shell getprop ro.product.cpu.abilist "*) printf 'arm64-v8a\n' ;;
  *" shell getprop ro.kernel.qemu "*) printf '0\n' ;;
  *" shell getprop ro.hardware "*) printf 'qcom\n' ;;
  *" shell cat /proc/meminfo "*) printf 'MemTotal:        4096000 kB\n' ;;
  *) exit 0 ;;
esac
EOF
chmod +x "$FAKE_ADB"

APK="$TMP/igra-3.0.1.apk"
printf 'fixture-apk\n' > "$APK"
EXPECTED_SHA="$(sha256sum "$APK" | awk '{print $1}')"
EXPECTED_COMMIT="1111111111111111111111111111111111111111"

if PATH="$TMP:$PATH" FAKE_ADB_MODE=emulator \
  IGRA_EXPECTED_APK_SHA256="$EXPECTED_SHA" \
  IGRA_EXPECTED_APK_COMMIT="$EXPECTED_COMMIT" \
  "${COLLECTOR_CMD[@]}" "$APK" "$TMP/emulator.json" >"$TMP/emulator.out" 2>&1; then
  echo "collector accepted emulator fixture unexpectedly"
  cat "$TMP/emulator.out"
  exit 1
fi

echo "emulator rejection: PASS"

PATH="$TMP:$PATH" FAKE_ADB_MODE=physical \
  IGRA_EXPECTED_APK_SHA256="$EXPECTED_SHA" \
  IGRA_EXPECTED_APK_COMMIT="$EXPECTED_COMMIT" \
  "${COLLECTOR_CMD[@]}" "$APK" "$TMP/physical.json"
node -e '
const fs=require("fs");
const p=process.argv[1];
const x=JSON.parse(fs.readFileSync(p,"utf8"));
if(x.physicalAndroid!==false || x.IGRA_PHYSICAL_ANDROID!==false) throw new Error("collector must emit non-proof flags");
if(x.device.model!=="TestPhone X1" || x.device.androidVersion!=="14") throw new Error("device metadata mismatch");
if(x.artifact.commit!==process.argv[2] || x.artifact.apkSha256!==process.argv[3]) throw new Error("artifact provenance mismatch");
if(!Array.isArray(x.results) || x.results.some(r=>r.status!=="PENDING")) throw new Error("collector output must remain pending");
console.log("physical template: PASS");
' "$TMP/physical.json" "$EXPECTED_COMMIT" "$EXPECTED_SHA"

if PATH="$TMP:$PATH" FAKE_ADB_MODE=physical "${COLLECTOR_CMD[@]}" "$APK" "$TMP/missing-provenance.json" >"$TMP/missing.out" 2>&1; then
  echo "collector accepted missing provenance unexpectedly"
  cat "$TMP/missing.out"
  exit 1
fi

echo "missing provenance rejection: PASS"
echo "physical Android collector self-test: PASS"
