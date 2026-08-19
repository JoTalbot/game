#!/usr/bin/env python3
# Генератор иконок Android из единственного исходника 1024×1024.
#
# Google Play требует иконку во всех плотностях (mdpi 48 … xxxhdpi 192),
# а современный Android — адаптивную иконку (foreground + фон), иначе на
# Android 8+ иконка отображается в белом квадрате или обрезается. Раньше в
# репозитории был только один mipmap-xxxhdpi/ic_launcher.png (192px) — это
# дыра на пути к публикации. Скрипт детерминирован: один исходник, все
# размеры выводятся из него.
#
# Запуск: python3 tools/make-icons.py
from __future__ import annotations
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "web", "assets", "img", "icon.png")
RES = os.path.join(ROOT, "android", "app", "src", "main", "res")

# Фон адаптивной иконки — тьма игры (#05060A, тот же тон, что у WebView и
# темы оболочки). Иконка сливается с берегом, а не торчит из него.
BG = (5, 6, 10)

LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
# Передний слой адаптивной иконки: 108dp на плотность.
FOREGROUND = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def main():
    src = Image.open(SRC).convert("RGBA")

    # 1. Легаси-иконки во всех плотностях (квадрат + круглая копия).
    for dpi, size in LEGACY.items():
        d = os.path.join(RES, f"mipmap-{dpi}")
        os.makedirs(d, exist_ok=True)
        im = src.resize((size, size), Image.LANCZOS)
        im.save(os.path.join(d, "ic_launcher.png"), "PNG", optimize=True)
        im.save(os.path.join(d, "ic_launcher_round.png"), "PNG", optimize=True)
        print(f"mipmap-{dpi}/ic_launcher[+_round].png {size}px")

    # 2. Адаптивная иконка: передний слой в каждой плотности + фон-цвет.
    for dpi, size in FOREGROUND.items():
        d = os.path.join(RES, f"drawable-{dpi}")
        os.makedirs(d, exist_ok=True)
        # Содержимое центрировано и ужато в безопасную зону (66%): маска
        # адаптивной иконки срежет углы, важно не потерять центр.
        safe = int(size * 0.66)
        im = src.resize((safe, safe), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        canvas.paste(im, ((size - safe) // 2, (size - safe) // 2))
        canvas.save(os.path.join(d, "ic_launcher_foreground.png"), "PNG", optimize=True)
        print(f"drawable-{dpi}/ic_launcher_foreground.png {size}px")

    # Фон-цвет (один на все плотности).
    vd = os.path.join(RES, "values")
    os.makedirs(vd, exist_ok=True)
    with open(os.path.join(vd, "ic_launcher_background.xml"), "w", encoding="utf-8") as f:
        f.write(
            '<?xml version="1.0" encoding="utf-8"?>\n'
            "<resources>\n"
            f'    <color name="ic_launcher_background">#{BG[0]:02x}{BG[1]:02x}{BG[2]:02x}</color>\n'
            "</resources>\n"
        )
    print("values/ic_launcher_background.xml")

    # Адаптивная разметка (v26+), падает на легаси ниже.
    ad = os.path.join(RES, "mipmap-anydpi-v26")
    os.makedirs(ad, exist_ok=True)
    for name in ("ic_launcher", "ic_launcher_round"):
        with open(os.path.join(ad, f"{name}.xml"), "w", encoding="utf-8") as f:
            f.write(
                '<?xml version="1.0" encoding="utf-8"?>\n'
                "<adaptive-icon xmlns:android=\"http://schemas.android.com/apk/res/android\">\n"
                '    <background android:drawable="@color/ic_launcher_background"/>\n'
                '    <foreground android:drawable="@drawable/ic_launcher_foreground"/>\n'
                "</adaptive-icon>\n"
            )
        print(f"mipmap-anydpi-v26/{name}.xml")

    print("\nготово: полный набор иконок Play-ready")


if __name__ == "__main__":
    main()
