#!/usr/bin/env python3
# Раскадровка трейлера («трейлер в картинках»).
#
# TRAILER.md — сценарий на 22 секунды. Видео здесь не собрать (нет ffmpeg,
# и видео не место в git), но сценарий обязан стать картинкой, иначе он —
# только текст. Этот скрипт рендерит 11 кадров ровно по битам сценария,
# в той же палитре и теми же приёмами, что и make-screens.py: тьма, семя
# света, узлы берега, шесть цветных орбит, сигила. Никаких кнопок и HUD,
# которых нет в игре. Детерминировано seed'ом — воспроизводимо.
#
# Запуск: python3 tools/make-trailer.py
# Вывод: docs/trailer/frame-01.png … frame-11.png (540×960)
#        docs/trailer/storyboard.png (сетка всех кадров с таймкодами)
from __future__ import annotations
import math
import os
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "trailer")
FONT = os.path.join(ROOT, "web", "assets", "fonts")
SERIF = os.path.join(FONT, "f3.ttf")      # Cormorant Garamond 500
SERIF_IT = os.path.join(FONT, "f1.ttf")   # italic

W, H = 540, 960
BG = (5, 6, 12, 255)


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


TRAITS = ["curiosity", "aggression", "contemplation", "empathy", "chaos", "harmony"]


def trait_color(trait):
    return {
        "curiosity": (120, 210, 255),
        "contemplation": (170, 150, 240),
        "empathy": (255, 180, 200),
        "aggression": (255, 90, 110),
        "chaos": (180, 255, 140),
        "harmony": (255, 210, 140),
    }.get(trait, (180, 220, 255))


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
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color[:3] + (a,))


def draw_seed(img, cx, cy, color=(245, 250, 255), size=1.0):
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    radial(gd, (cx, cy), int(W * 0.10 * size), (180, 220, 255, 200))
    radial(gd, (cx, cy), int(W * 0.045 * size), color + (230,))
    img.alpha_composite(glow)
    d = ImageDraw.Draw(img)
    r = max(7, int(14 * size))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=color + (255,))


def draw_nodes(img, cx, cy, rng, trait=None, count=40, alive_ratio=0.7,
               spread_x=0.82, y_center=0.52, glow=True):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    col = trait_color(trait) if trait else (180, 220, 255)
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
    if glow:
        layer = layer.filter(ImageFilter.GaussianBlur(0.8))
    img.alpha_composite(layer)


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


def draw_orbits(img, cx, cy, rng):
    """Шесть цветных орбит — пульс, след ДНК вокруг семени."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for k, trait in enumerate(TRAITS):
        col = trait_color(trait)
        ang = -math.pi / 2 + k * (math.pi / 3) + rng.uniform(-0.1, 0.1)
        rad = int(W * 0.16)
        x = cx + math.cos(ang) * rad
        y = cy + math.sin(ang) * rad
        rr = 5 + k % 3
        radial(d, (x, y), int(W * 0.045), col + (160,))
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col + (235,))
        # лёгкая дуга орбиты
        d.arc([cx - rad - 8, cy - rad - 8, cx + rad + 8, cy + rad + 8],
              ang - 0.25, ang + 0.25, fill=col + (60,), width=2)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.5)))


def draw_sigil(img, cx, cy, rng):
    """Сигила — замкнутая ломаная по шести осям ДНК."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    pts = []
    for k, trait in enumerate(TRAITS):
        col = trait_color(trait)
        mag = 0.5 + rng.uniform(0.2, 0.5)
        ang = -math.pi / 2 + k * (math.pi / 3)
        rad = int(W * 0.30)
        x = cx + math.cos(ang) * rad * mag
        y = cy + math.sin(ang) * rad * mag
        pts.append((x, y))
        rr = 6 + (k % 3) * 2
        radial(d, (x, y), int(W * 0.05), col + (170,))
        d.ellipse([x - rr, y - rr, x + rr, y + rr], fill=col + (235,))
    d.line(pts + [pts[0]], fill=(232, 230, 242, 200), width=3)
    img.alpha_composite(layer.filter(ImageFilter.GaussianBlur(0.5)))


def caption(img, ru, sub=None):
    d = ImageDraw.Draw(img)
    f = font(SERIF_IT, 40)
    shade = Image.new("RGBA", (W, 240), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    for y in range(240):
        sd.line([(0, y), (W, y)], fill=(5, 6, 12, int(160 * (y / 240))))
    img.alpha_composite(shade, (0, H - 240))
    bbox = d.textbbox((0, 0), ru, font=f)
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) // 2, H - 150), ru, font=f, fill=(232, 230, 242, 235))
    if sub:
        fs = font(SERIF, 24)
        d.text((W // 2, H - 90), sub, font=fs, fill=(232, 230, 242, 140),
               anchor="mm")


def timecode(img, tc):
    d = ImageDraw.Draw(img)
    f = font(SERIF, 22)
    d.text((W - 74, 28), tc, font=f, fill=(232, 230, 242, 90), anchor="ra")


def title_card():
    """Титр: ИГРА / она растёт из тебя."""
    img, cx, cy = background((180, 220, 255))
    draw_stars(img, random.Random(77), 40)
    d = ImageDraw.Draw(img)
    fbig = font(SERIF, 92)
    ftag = font(SERIF_IT, 40)
    d.text((W // 2, int(H * 0.44)), "ИГРА", font=fbig,
           fill=(240, 238, 250, 250), anchor="mm")
    d.text((W // 2, int(H * 0.55)), "она растёт из тебя", font=ftag,
           fill=(232, 230, 242, 190), anchor="mm")
    return img


def scene(n):
    rng = random.Random(20260819 + n)
    # 1. Чёрный кадр. Пульс.
    if n == 1:
        img, cx, cy = background((40, 60, 100))
        # одиночная пульс-волна — едва заметное кольцо из центра
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)
        d.ellipse([cx - 60, cy - 60, cx + 60, cy + 60],
                  outline=(200, 220, 255, 60), width=2)
        img.alpha_composite(layer)
        return img
    # 2. Голос: «ты пришёл.»
    if n == 2:
        img, cx, cy = background((110, 170, 240))
        draw_seed(img, cx, cy, size=1.1)
        caption(img, "ты пришёл.")
        return img
    # 3. Семя света. Палец задерживается. Из тумана растёт берег.
    if n == 3:
        img, cx, cy = background((120, 200, 250))
        draw_nodes(img, cx, cy, rng, "curiosity", count=30, alive_ratio=0.6)
        draw_seed(img, cx, cy, size=1.0)
        caption(img, "куда смотришь — становится настоящим.")
        return img
    # 4. Резко: удар — рана.
    if n == 4:
        img, cx, cy = background((120, 40, 70))
        draw_nodes(img, cx, cy, rng, "aggression", count=26, alive_ratio=0.5)
        # рана — багровый рваный ореол рядом
        wl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        wd = ImageDraw.Draw(wl)
        radial(wd, (cx + 120, cy - 60), int(W * 0.11), (255, 70, 90, 220))
        for k in range(8):
            a = rng.uniform(0, math.tau)
            rr = rng.uniform(W * 0.05, W * 0.11)
            wd.line([(cx + 120, cy - 60),
                     (cx + 120 + math.cos(a) * rr, cy - 60 + math.sin(a) * rr)],
                    fill=(255, 90, 110, 180), width=3)
        img.alpha_composite(wl.filter(ImageFilter.GaussianBlur(0.7)))
        draw_seed(img, cx, cy, color=(255, 240, 240), size=0.9)
        caption(img, "удар — рана.")
        return img
    # 5. Тихо: пауза — цветок.
    if n == 5:
        img, cx, cy = background((150, 130, 230))
        draw_nodes(img, cx, cy, rng, "contemplation", count=30, alive_ratio=0.75)
        bloom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        bd = ImageDraw.Draw(bloom)
        for k in range(6):
            a = -math.pi / 2 + k * (math.pi / 3)
            bx = cx + 90 + math.cos(a) * 26
            by = cy - 40 + math.sin(a) * 26
            radial(bd, (bx, by), int(W * 0.03), (255, 180, 200, 190))
            bd.ellipse([bx - 7, by - 7, bx + 7, by + 7], fill=(255, 180, 200, 220))
        radial(bd, (cx + 90, cy - 40), int(W * 0.02), (255, 220, 235, 230))
        img.alpha_composite(bloom.filter(ImageFilter.GaussianBlur(1.0)))
        draw_seed(img, cx, cy, color=(220, 210, 255), size=0.9)
        caption(img, "пауза — цветок.")
        return img
    # 6. Двойное касание — пульс, шесть цветных орбит.
    if n == 6:
        img, cx, cy = background((160, 200, 255))
        draw_orbits(img, cx, cy, rng)
        draw_seed(img, cx, cy, color=(255, 250, 240), size=1.0)
        caption(img, "пульс — шесть орбит.")
        return img
    # 7. Голод с чужим/твоим лицом.
    if n == 7:
        img, cx, cy = background((90, 110, 190))
        draw_nodes(img, cx, cy, rng, "empathy", count = 30, alive_ratio=0.55)
        # тусклый огонёк — голод (dim), едва светится
        draw_seed(img, cx + 120, cy - 70, color=(150, 160, 195), size=0.55)
        draw_seed(img, cx, cy, color=(245, 240, 255), size=1.0)
        caption(img, "одно из них бледнеет.")
        return img
    # 8. Небо из звёзд-отказов.
    if n == 8:
        img, cx, cy = background((70, 100, 180))
        draw_stars(img, rng, 110)
        draw_seed(img, cx, cy, color=(200, 220, 255), size=0.9)
        caption(img, "небо из того, что ты отпустил.")
        return img
    # 9. Сигила.
    if n == 9:
        img, cx, cy = background((180, 220, 255))
        draw_sigil(img, cx, cy, rng)
        caption(img, "сигила.")
        return img
    # 10. Титр.
    if n == 10:
        return title_card()
    # 11. «не выбирай. просто будь.»
    img, cx, cy = background((200, 225, 255))
    draw_seed(img, cx, cy, size=1.0)
    caption(img, "не выбирай. просто будь.")
    return img


TIMECODES = ["0:00", "0:02", "0:05", "0:08", "0:10", "0:13",
             "0:15", "0:17", "0:19", "0:20", "0:22"]


def main():
    os.makedirs(OUT, exist_ok=True)
    frames = []
    for n in range(1, 12):
        img = scene(n)
        timecode(img, TIMECODES[n - 1])
        p = os.path.join(OUT, f"frame-{n:02d}.png")
        img.convert("RGB").save(p, "PNG", optimize=True)
        frames.append(img.convert("RGB"))
        print(f"{p} — {W}×{H}")

    # Контактный лист: сетка 4×3, весь трейлер одним взглядом.
    cols, rows = 4, 3
    cw, ch = 540, 960
    sheet = Image.new("RGB", (cw * cols, ch * rows), (3, 4, 8))
    for i, f in enumerate(frames):
        x = (i % cols) * cw
        y = (i // cols) * ch
        sheet.paste(f, (x, y))
    sp = os.path.join(OUT, "storyboard.png")
    sheet.save(sp, "PNG", optimize=True)
    print(f"{sp} — {sheet.width}×{sheet.height}")


if __name__ == "__main__":
    main()
