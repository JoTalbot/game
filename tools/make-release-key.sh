#!/usr/bin/env bash
# Генератор release-ключа подписи для Google Play.
#
# Google Play не принимает debug-ключ. Этот скрипт создаёт release.keystore
# с НЕпредсказуемым паролем и показывает пароль ОДИН раз — его нужно
# сохранить вместе с keystore. Потеря обоих = приложение навсегда заперто
# на обновления (см. docs/PUBLISH.md).
#
# Запуск: bash tools/make-release-key.sh
# Вывод: dist/release.keystore + пароль на экран (только один раз).
#
# После генерации: залей base64(keystore) в секрет репозитория
# IGRA_KEYSTORE_B64 и удали debug-сборку с телефона (разовая потеря сейва).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/dist"
mkdir -p "$OUT"

KS="$OUT/release.keystore"
if [ -f "$KS" ]; then
  echo "release.keystore уже существует ($KS) — не перезаписываю."
  echo "Если хочешь новый ключ, удали файл вручную и запусти заново."
  exit 1
fi

# Пароль из системной случайности: 32 символа, не выводится повторно.
PASS="$(head -c 24 /dev/urandom | base64 | tr -d '=+/' | head -c 32)"

KEYTOOL="$(command -v keytool || true)"
if [ -z "$KEYTOOL" ]; then
  # JDK в песочнице/CI может лежать вне PATH
  for c in /usr/lib/jvm/*/bin/keytool /opt/*/bin/keytool; do
    [ -x "$c" ] && KEYTOOL="$c" && break
  done
fi
if [ -z "$KEYTOOL" ]; then
  echo "keytool не найден — установи JDK." >&2
  exit 1
fi

"$KEYTOOL" -genkeypair -v \
  -keystore "$KS" \
  -storepass "$PASS" -keypass "$PASS" \
  -alias igra -keyalg RSA -keysize 4096 -validity 10000 \
  -dname "CN=IGRA, O=JoTalbot, C=UA" >/dev/null

echo "=============================="
echo "release.keystore создан: $KS"
echo "ПАРОЛЬ (покажи один раз, сохрани):"
echo "$PASS"
echo "=============================="
echo ""
echo "Дальше:"
echo "  1. base64 -w0 dist/release.keystore  →  секрет IGRA_KEYSTORE_B64 на GitHub."
echo "  2. В Play Console выбери Play App Signing, upload key = этот keystore."
echo "  3. Удали старую ИГРУ с телефона (сейв на устройстве сотрётся один раз)."
echo "Подробно: docs/PUBLISH.md"
