#!/usr/bin/env python3
# Генератор графики витрины без внешних ассетов.
#
# Play feature graphic и og-картинка должны быть того же тона, что и сама
# ИГРА: тьма, семя света, берег узлов, ни одного готового арта из стока.
# Скрипт детерминирован фиксированным seed — картинка воспроизводима.
# Запуск: python3 tools/make-art.py
from __future__ import annotations
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs")
random.seed(20260816)

# палитра из игры: тьма и холодное семя света
BG_TOP = (5, 6, 12)
BG_MID = (8, 12, 24)
SEED = (180, 220, 255)
SEED_HOT = (255, 240, 220)


def radial(draw, size, center, radius, color, steps=80):
    """Мягкое радиальное свечение."""
    cx, cy = center
    for i in range(steps, 0, -1):
        t = i / steps
        r = radius * t
        a = int(color[3] * (1 - t) ** 2)
        rgb = color[:3] + (a,)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            fill=rgb,
        )


def background(size):
    w, h = size
    img = Image.new("RGBA", size, BG_TOP + (255,))
    draw = ImageDraw.Draw(img)
    # вертикальный градиент тьмы
    for y in range(h):
        t = y / h
        r = int(BG_TOP[0] + (BG_MID[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_MID[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_MID[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    # большое холодное свечение по центру
    glow = Image.new("RGBA", size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    radial(gdraw, size, (w * 0.5, h * 0.56), int(w * 0.5), (90, 150, 220, 70))
    radial(gdraw, size, (w * 0.5, h * 0.56), int(w * 0.28), (180, 220, 255, 50))
    img = Image.alpha_composite(img, glow)
    return img


def draw_shore(img, w, h, count=46, spread=0.78):
    """Узлы берега вокруг семени: чем ближе, тем ярче."""
    draw = ImageDraw.Draw(img)
    cx, cy = w * 0.5, h * 0.56
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(layer)
    for _ in range(count):
        ang = random.uniform(0, math.tau)
        rad = random.uniform(w * 0.06, w * spread * 0.5)
        x = cx + math.cos(ang) * rad
        y = cy + math.sin(ang) * rad * 0.62
        dist = math.hypot((x - cx) / w, (y - cy) / h)
        bright = max(0.12, 1 - dist * 2.6)
        r = random.uniform(1.4, 3.6) * (1.0 if dist > 0.15 else 1.5)
        col = (
            int(150 + 80 * bright),
            int(180 + 60 * bright),
            int(220 + 35 * bright),
            int(40 + 150 * bright),
        )
        ldraw.ellipse([x - r, y - r, x + r, y + r], fill=col)
        # редкие тонкие связи-нити
        if random.random() < 0.18:
            ang2 = ang + random.uniform(-0.4, 0.4)
            rad2 = rad * random.uniform(0.4, 0.8)
            x2 = cx + math.cos(ang2) * rad2
            y2 = cy + math.sin(ang2) * rad2 * 0.62
            ldraw.line(
                [(x, y), (x2, y2)],
                fill=(120, 170, 220, int(28 * bright)),
                width=1,
            )
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    img.alpha_composite(layer)
    return img


def draw_seed(img, w, h):
    cx, cy = int(w * 0.5), int(h * 0.56)
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g = ImageDraw.Draw(glow)
    radial(g, (w, h), (cx, cy), int(w * 0.16), SEED + (190,))
    radial(g, (w, h), (cx, cy), int(w * 0.07), SEED_HOT + (220,))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    r = max(5, w // 110)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 250, 255, 255))
    return img


def make_feature(path):
    w, h = 1024, 500
    img = background((w, h))
    img = draw_shore(img, w, h, count=44)
    img = draw_seed(img, w, h)
    # лёгкая виньетка по краям
    Image.new("RGBA", (w, h), (0, 0, 0, 0))
    img.save(path, "PNG")
    return path


def make_og(path):
    w, h = 1200, 630
    img = background((w, h))
    img = draw_shore(img, w, h, count=60, spread=0.82)
    img = draw_seed(img, w, h)
    img.convert("RGB").save(path, "JPEG", quality=88)
    return path


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    feats = [make_feature(os.path.join(OUT, "feature.png"))]
    ogs = [make_og(os.path.join(OUT, "og.jpg"))]
    for p in feats + ogs:
        im = Image.open(p)
        print(f"{p} — {im.size[0]}×{im.size[1]} {im.format}")
