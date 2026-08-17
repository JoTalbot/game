#!/usr/bin/env python3
# Генератор скриншотов для страницы магазина.
#
# В песочнице нет браузера, чтобы снять настоящий кадр движка, но есть
# тьма, семя света и узлы берега — их и рисуем. Это атмосферные кадры,
# а не поддельный геймплей: никаких кнопок и HUD, которых нет в игре.
# Угловые подписи («ИГРА», сезон) повторяют реальный #brand/#season.
# Детерминировано seed по номеру кадра — повторяемо.
from __future__ import annotations
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "screens")
FONT = os.path.join(ROOT, "web", "assets", "fonts")
SERIF = os.path.join(FONT, "f3.ttf")   # Cormorant Garamond 500
SERIF_IT = os.path.join(FONT, "f1.ttf")  # italic

W, H = 1080, 1920
BG = (5, 6, 12, 255)


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def background(seed_color=(90, 150, 220)):
    img = Image.new("RGBA", (W, H), BG)
    d = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(5 + (10 - 5) * t)
        g = int(6 + (14 - 6) * t)
        b = int(12 + (26 - 12) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b, 255))
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    cx, cy = W // 2, int(H * 0.52)
    for i in range(60, 0, -1):
        t = i / 60
        rad = int(W * 0.62 * t)
        a = int(seed_color[2] * (1 - t) ** 2 * 0.5)
        gd.ellipse([cx - rad, cy - rad, cx + rad, cy + rad],
                   fill=(seed_color[0], seed_color[1], seed_color[2], a))
    img.alpha_composite(glow)
    return img, cx, cy


def radial(draw, center, radius, color, steps=60):
    cx, cy = center
    for i in range(steps, 0, -1):
        t = i / steps
        r = radius * t
        a = int(color[3] * (1 - t) ** 2)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r],
                     fill=color[:3] + (a,))


def trait_color(trait):
    return {
        "curiosity": (120, 210, 255),
        "contemplation": (170, 150, 240),
        "empathy": (255, 180, 200),
        "aggression": (255, 90, 110),
        "chaos": (180, 255, 140),
        "harmony": (255, 210, 140),
    }.get(trait, (180, 220, 255))


def draw_nodes(img, cx, cy, rng, trait=None, count=40, alive_ratio=0.7,
               spread_x=0.82, spread_y=0.40, y_center=0.52, glow=True):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col = trait_color(trait) if trait else (180, 220, 255)
    placed = []
    for _ in range(count):
        ang = rng.uniform(-math.pi * 0.78, math.pi * 0.78)
        radx = rng.uniform(W * 0.05, W * spread_x * 0.5)
        rady = radx * rng.uniform(0.55, 0.95)
        x = cx + math.cos(ang) * radx
        y = cy + math.sin(ang) * rady * 0.7
        alive = rng.random() < alive_ratio
        dist = math.hypot((x - cx) / W, (y - cy) / H)
        bright = max(0.12, 1 - dist * 2.4)
        base = col if alive else (70, 80, 110)
        if alive:
            rr = rng.uniform(3.2, 8.5) * (1.4 if dist < 0.16 else 1.0)
            a = int(60 + 170 * bright)
        else:
            rr = rng.uniform(2.0, 4.5)
            a = int(40 + 60 * bright)
        rgb = (
            min(255, int(base[0] * (0.5 + 0.5 * bright))),
            min(255, int(base[1] * (0.5 + 0.5 * bright))),
            min(255, int(base[2] * (0.5 + 0.5 * bright))),
        )
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=rgb + (a,))
        placed.append((x, y, bright, alive))
    if glow:
        layer = layer.filter(ImageFilter.GaussianBlur(0.8))
    img.alpha_composite(layer)
    return placed


def draw_seed(img, cx, cy, color=(245, 250, 255), size=1.0):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    radial(gd, (cx, cy), int(W * 0.10 * size), (180, 220, 255, 200))
    radial(gd, (cx, cy), int(W * 0.045 * size), color + (230,))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    r = max(7, int(14 * size))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (255,))


def draw_stars(img, rng, n=70):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x = rng.uniform(0, W)
        y = rng.uniform(int(H * 0.10), int(H * 0.46))
        a = rng.randint(40, 160)
        r = rng.choice([1, 1, 1, 1.5, 2])
        c = rng.choice([(200, 220, 255), (255, 230, 200), (180, 200, 255)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=c + (a,))
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.4)))


def corner_label(img, season_ru, season_en=None):
    d = ImageDraw.Draw(img)
    fbrand = font(SERIF, 34)
    fseason = font(SERIF_IT, 30)
    d.text((56, 56), "ИГРА", font=fbrand, fill=(232, 230, 242, 115))
    if season_ru:
        d.text((56, 100), season_ru, font=fseason, fill=(232, 230, 242, 140))


def caption(img, ru, en=None):
    d = ImageDraw.Draw(img)
    f = font(SERIF_IT, 52)
    # мягкая подложка внизу для читаемости
    shade = Image.new("RGBA", (W, 260), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for y in range(260):
        sd.line([(0, y), (W, y)], fill=(5, 6, 12, int(150 * (y / 260))))
    img.alpha_composite(shade, (0, H - 260))
    bbox = d.textbbox((0, 0), ru, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, H - 150), ru, font=f, fill=(232, 230, 242, 230))


def scene(n):
    rng = random.Random(1000 + n)
    if n == 1:  # пустота / рождение
        img, cx, cy = background((110, 170, 240))
        draw_seed(img, cx, cy, size=1.1)
        corner_label(img, "")
        caption(img, "ты пришёл.")
    elif n == 2:  # первый берег
        img, cx, cy = background((120, 200, 250))
        draw_nodes(img, cx, cy, rng, "curiosity", count=46, alive_ratio=0.75)
        draw_seed(img, cx, cy, size=1.0)
        corner_label(img, "странствие")
        caption(img, "куда смотришь — становится настоящим.")
    elif n == 3:  # сад тишины
        img, cx, cy = background((150, 130, 230))
        draw_nodes(img, cx, cy, rng, "contemplation", count=58,
                   alive_ratio=0.9, spread_x=0.78)
        draw_seed(img, cx, cy, color=(220, 210, 255), size=0.95)
        corner_label(img, "тишина")
        caption(img, "можно ничего не делать.")
    elif n == 4:  # забвение / звёзды
        img, cx, cy = background((80, 120, 200))
        draw_stars(img, rng, 90)
        draw_nodes(img, cx, cy, rng, None, count=34, alive_ratio=0.35,
                   spread_x=0.7)
        draw_seed(img, cx, cy, color=(200, 220, 255), size=0.9)
        corner_label(img, "оттепель")
        caption(img, "что отпускаешь — уходит в небо.")
    elif n == 5:  # спутник
        img, cx, cy = background((255, 180, 200))
        draw_nodes(img, cx, cy, rng, "empathy", count=40, alive_ratio=0.8)
        # второй мягкий огонёк рядом
        draw_seed(img, cx + 150, cy - 90, color=(255, 210, 225), size=0.7)
        draw_seed(img, cx, cy, color=(255, 240, 245), size=1.0)
        corner_label(img, "оттепель")
        caption(img, "ты уже не один.")
    elif n == 7:  # голод — тусклое существо ждёт
        img, cx, cy = background((90, 110, 190))
        draw_nodes(img, cx, cy, rng, "empathy", count=36, alive_ratio=0.55, spread_x=0.75)
        # тусклый огонёк — голод (dim)
        draw_seed(img, cx + 140, cy - 70, color=(180, 190, 220), size=0.6)
        draw_seed(img, cx, cy, color=(245, 240, 255), size=1.0)
        corner_label(img, "оттепель")
        caption(img, "одно из них бледнеет.")
    elif n == 8:  # спасение — цветок цветом памяти
        img, cx, cy = background((170, 150, 240))
        draw_nodes(img, cx, cy, rng, "contemplation", count=52, alive_ratio=0.85, spread_x=0.78)
        # яркий цветок спасения
        bloom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bloom)
        col = (255, 180, 200, 180)
        bd.ellipse([cx+110-18, cy-40-18, cx+110+18, cy-40+18], fill=col)
        bloom = bloom.filter(ImageFilter.GaussianBlur(1.2))
        img.alpha_composite(bloom)
        draw_seed(img, cx, cy, color=(220, 210, 255), size=0.95)
        corner_label(img, "сад")
        caption(img, "ты вернулся — оно не уйдёт.")
    else:  # сигила / конец
        img, cx, cy = background((180, 220, 255))
        draw_stars(img, rng, 120)
        draw_nodes(img, cx, cy, rng, "harmony", count=30, alive_ratio=0.5,
                   spread_x=0.9)
        draw_seed(img, cx, cy, color=(255, 250, 235), size=1.2)
        corner_label(img, "хор")
        caption(img, "она растёт из тебя.")
    return img


def main():
    os.makedirs(OUT, exist_ok=True)
    paths = []
    for n in range(1, 9):
        img = scene(n)
        p = os.path.join(OUT, f"screen-{n}.png")
        img.convert("RGB").save(p, "PNG", optimize=True)
        paths.append(p)
        print(f"{p} — {W}×{H}")
    return paths


if __name__ == "__main__":
    main()
