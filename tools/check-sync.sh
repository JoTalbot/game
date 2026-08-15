#!/usr/bin/env bash
# Сторож расхождений. Зовётся руками и из CI перед сборкой APK.
#
# Стеречь нечего было бы, если бы правда лежала в одном месте. Но версия
# живёт в двух файлах (сборочный скрипт и gradle), а душа — в двух копиях
# в репозитории (web/ и зеркало docs/play/). Разъезжались они молча: APK
# уходил человеку с одной версией, страница показывала другую.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
fail=0

say_ok()   { echo "  ✓ $1"; }
say_bad()  { echo "  ✗ $1"; fail=1; }

echo "— версия названа одинаково везде"

BUILD="$ROOT/tools/build-apk.sh"
GRADLE="$ROOT/android/app/build.gradle.kts"

b_name=$(sed -n 's/^NAME="igra-\(.*\)"$/\1/p' "$BUILD" | head -1)
b_code=$(sed -n 's/^VCODE=\(.*\)$/\1/p' "$BUILD" | head -1)
b_vname=$(sed -n 's/^VNAME="\(.*\)"$/\1/p' "$BUILD" | head -1)
g_code=$(sed -n 's/.*versionCode = \([0-9]*\).*/\1/p' "$GRADLE" | head -1)
g_vname=$(sed -n 's/.*versionName = "\(.*\)".*/\1/p' "$GRADLE" | head -1)

if [ -z "$b_code" ] || [ -z "$b_vname" ] || [ -z "$g_code" ] || [ -z "$g_vname" ]; then
  say_bad "версию не удалось прочитать (скрипт: '$b_vname'/'$b_code', gradle: '$g_vname'/'$g_code')"
else
  if [ "$b_vname" = "$g_vname" ]; then
    say_ok "имя версии: $b_vname"
  else
    say_bad "имя версии разъехалось: скрипт $b_vname, gradle $g_vname"
  fi
  if [ "$b_code" = "$g_code" ]; then
    say_ok "код версии: $b_code"
  else
    say_bad "код версии разъехался: скрипт $b_code, gradle $g_code"
  fi
  if [ "$b_name" = "$b_vname" ]; then
    say_ok "имя файла APK совпадает с версией"
  else
    say_bad "APK назовётся igra-$b_name, а версия $b_vname"
  fi
fi

echo "— душа и её зеркало совпадают"
# android/app/src/main/assets/www — третья копия, но она gitignored и
# рождается самой сборкой. Стеречь надо то, что лежит в репозитории.
if diff -rq "$ROOT/web" "$ROOT/docs/play" >/tmp/igra-sync-diff 2>&1; then
  say_ok "docs/play повторяет web"
else
  say_bad "зеркало отстало от web:"
  sed 's/^/      /' /tmp/igra-sync-diff | head -20
fi

echo
if [ "$fail" = 0 ]; then
  echo "✓ расхождений нет"
else
  echo "✗ есть расхождения — чинить до сборки"
fi
exit "$fail"
