"""Generate 10 rank logos following the 'Heraldic Ascension' philosophy.

Each emblem is built from a shared architecture:
  - outer ring  (provenance frame)
  - inner field (background tone keyed to the rank)
  - central glyph (unique sigil)
  - Roman numeral (tier mark, top)
  - centered serif name (bottom)

Master-level craftsmanship: hairline strokes, concentric geometry, restrained palette.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT_DIR = (
    r"C:\Users\FA506\AppData\Roaming\Claude\local-agent-mode-sessions"
    r"\skills-plugin\07b07c6d-5806-4e6d-96e6-c96add0017df"
    r"\bb4f8b3d-223e-46e0-a4cd-652da9f1bc1f\skills\canvas-design\canvas-fonts"
)
OUT_DIR = os.path.dirname(os.path.abspath(__file__))

# High-resolution: render at 2x then downsample for crispness
SIZE = 1024
SCALE = 2
W = SIZE * SCALE  # render canvas
INK = (12, 13, 17)         # near-black ground
INK_DEEP = (6, 7, 10)      # vignette ground
PAPER_DIM = (200, 200, 200)

# Rank meta : (id, label fr, numeral, accent rgb, ground rgb, glow rgb)
RANKS = [
    ("bronze",       "BRONZE",        "I",    (205, 127, 50),  (28, 18, 12),  (140, 80, 30)),
    ("argent",       "ARGENT",        "II",   (210, 215, 222), (20, 22, 26),  (140, 145, 150)),
    ("or",           "OR",            "III",  (255, 198, 60),  (28, 22, 10),  (180, 130, 30)),
    ("platine",      "PLATINE",       "IV",   (220, 232, 238), (18, 22, 26),  (140, 160, 170)),
    ("diamant",      "DIAMANT",       "V",    (140, 230, 248), (10, 20, 26),  (50, 160, 200)),
    ("emeraude",     "EMERAUDE",      "VI",   (52, 211, 153),  (8, 22, 18),   (10, 130, 90)),
    ("maitre",       "MAITRE",        "VII",  (168, 100, 255), (16, 12, 26),  (110, 60, 180)),
    ("grand-maitre", "GRAND MAITRE",  "VIII", (236, 90, 160),  (22, 10, 18),  (170, 50, 110)),
    ("virtuose",     "VIRTUOSE",      "IX",   (255, 110, 70),  (22, 10, 8),   (200, 70, 30)),
    ("dieu-grec",    "DIEU GREC",     "X",    (255, 210, 100), (10, 9, 7),    (220, 170, 60)),
]


def f(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), size)


def hex_at(cx, cy, r, rot=0):
    pts = []
    for i in range(6):
        a = math.radians(60 * i + rot)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def star_pts(cx, cy, r_outer, r_inner, n, rot=-90):
    pts = []
    for i in range(n * 2):
        r = r_outer if i % 2 == 0 else r_inner
        a = math.radians(rot + (360 / (n * 2)) * i)
        pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
    return pts


def alpha_color(rgb, a):
    return (rgb[0], rgb[1], rgb[2], a)


def draw_radial_ground(img, center, ground, glow_color, glow_strength=80):
    """Subtle vignette : deep ink with a faint colored glow behind the sigil."""
    w, h = img.size
    base = Image.new("RGB", (w, h), INK_DEEP)
    bd = ImageDraw.Draw(base)
    # uneven warm/cool fill
    for r in range(int(w * 0.55), 0, -8):
        t = r / (w * 0.55)
        gr = int(ground[0] * (1 - t) + INK_DEEP[0] * t)
        gg = int(ground[1] * (1 - t) + INK_DEEP[1] * t)
        gb = int(ground[2] * (1 - t) + INK_DEEP[2] * t)
        bd.ellipse([center[0] - r, center[1] - r, center[0] + r, center[1] + r],
                   fill=(gr, gg, gb))
    # add a soft glow disc
    glow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow_layer)
    gr_r = int(w * 0.34)
    gd.ellipse([center[0] - gr_r, center[1] - gr_r, center[0] + gr_r, center[1] + gr_r],
               fill=alpha_color(glow_color, glow_strength))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(radius=w * 0.06))
    base = base.convert("RGBA")
    base.alpha_composite(glow_layer)
    img.paste(base.convert("RGB"), (0, 0))


def draw_frame(draw, cx, cy, accent, R_outer):
    """Outer concentric rings + tick marks. Shared across all emblems."""
    # outer thin ring
    draw.ellipse([cx - R_outer, cy - R_outer, cx + R_outer, cy + R_outer],
                 outline=accent, width=2 * SCALE)
    # inner hairline ring
    R2 = int(R_outer * 0.96)
    draw.ellipse([cx - R2, cy - R2, cx + R2, cy + R2],
                 outline=alpha_color(accent, 180)[:3], width=1 * SCALE)
    # 12 small tick marks around the inner ring
    for i in range(12):
        a = math.radians(i * 30 - 90)
        r1 = R_outer * 0.92
        r2 = R_outer * 0.945
        draw.line([
            (cx + r1 * math.cos(a), cy + r1 * math.sin(a)),
            (cx + r2 * math.cos(a), cy + r2 * math.sin(a)),
        ], fill=accent, width=1 * SCALE)


# ---------- Per-rank sigils ----------------------------------------------------

def sigil_bronze(draw, cx, cy, R, accent):
    # Foundational triangle (earth) — solid, deliberate
    h = R * 0.78
    base = R * 0.86
    pts = [
        (cx, cy - h * 0.62),
        (cx - base / 2, cy + h * 0.42),
        (cx + base / 2, cy + h * 0.42),
    ]
    draw.polygon(pts, outline=accent, width=3 * SCALE)
    # inner echo
    pts2 = [
        (cx, cy - h * 0.36),
        (cx - base * 0.30, cy + h * 0.24),
        (cx + base * 0.30, cy + h * 0.24),
    ]
    draw.polygon(pts2, outline=accent, width=1 * SCALE)
    # baseline tick
    draw.line([(cx - R * 0.55, cy + h * 0.54), (cx + R * 0.55, cy + h * 0.54)],
              fill=accent, width=1 * SCALE)


def sigil_argent(draw, cx, cy, R, accent):
    # 5-pointed silver star with concentric pentagon
    pts = star_pts(cx, cy, R * 0.72, R * 0.30, 5, rot=-90)
    draw.polygon(pts, outline=accent, width=3 * SCALE)
    # inner pentagon
    pent = []
    for i in range(5):
        a = math.radians(-90 + 72 * i)
        pent.append((cx + R * 0.28 * math.cos(a), cy + R * 0.28 * math.sin(a)))
    draw.polygon(pent, outline=accent, width=1 * SCALE)


def sigil_or(draw, cx, cy, R, accent):
    # Laurel wreath : two symmetric arcs of leaves around a central sun-disc.
    # Center sun-disc
    r_inner = R * 0.28
    draw.ellipse([cx - r_inner, cy - r_inner, cx + r_inner, cy + r_inner],
                 outline=accent, width=2 * SCALE)
    # radiating sun rays inside the disc
    for i in range(12):
        a = math.radians(i * 30)
        r1 = r_inner * 0.28
        r2 = r_inner * 0.70
        draw.line([
            (cx + r1 * math.cos(a), cy + r1 * math.sin(a)),
            (cx + r2 * math.cos(a), cy + r2 * math.sin(a)),
        ], fill=accent, width=1 * SCALE)
    # central pip
    draw.ellipse([cx - r_inner * 0.10, cy - r_inner * 0.10,
                  cx + r_inner * 0.10, cy + r_inner * 0.10], fill=accent)

    # Laurel wreath : 9 leaves per side, sweeping from bottom around to mid-height
    n_leaves = 9
    r_wreath = R * 0.62
    for side in (-1, 1):
        # angle sweep : from 200° (bottom-left) to 340° (top-left) for left,
        # mirrored for right. We use math angles where 0° is east, ccw.
        # Map index t in [0,1] -> angle from bottom area sweeping up.
        for i in range(n_leaves):
            t = i / (n_leaves - 1)
            # start near bottom (270° = 3π/2 in PIL coords) and go up to ~30° from top
            base_angle = math.pi / 2 + side * (math.pi * 0.10 + t * math.pi * 0.75)
            px = cx + r_wreath * math.cos(base_angle)
            py = cy + r_wreath * math.sin(base_angle)
            # leaf points outward, slightly tilted upward toward the top
            tilt = -side * 0.35
            tang = base_angle + math.pi / 2 + tilt
            leaf_len = R * 0.11
            leaf_w = R * 0.038
            ux, uy = math.cos(tang), math.sin(tang)
            vx, vy = -uy, ux
            tip_x = px + ux * leaf_len
            tip_y = py + uy * leaf_len
            base_x = px - ux * leaf_len * 0.20
            base_y = py - uy * leaf_len * 0.20
            poly = [
                (tip_x, tip_y),
                (px + ux * leaf_len * 0.55 + vx * leaf_w,
                 py + uy * leaf_len * 0.55 + vy * leaf_w),
                (px + ux * leaf_len * 0.10 + vx * leaf_w * 0.9,
                 py + uy * leaf_len * 0.10 + vy * leaf_w * 0.9),
                (base_x, base_y),
                (px + ux * leaf_len * 0.10 - vx * leaf_w * 0.9,
                 py + uy * leaf_len * 0.10 - vy * leaf_w * 0.9),
                (px + ux * leaf_len * 0.55 - vx * leaf_w,
                 py + uy * leaf_len * 0.55 - vy * leaf_w),
            ]
            draw.polygon(poly, fill=accent)

    # Bow / tie ribbon at the bottom where the two wreath arcs meet
    by = cy + r_wreath + R * 0.02
    draw.line([(cx - R * 0.10, by), (cx + R * 0.10, by)], fill=accent, width=2 * SCALE)
    draw.polygon([
        (cx - R * 0.10, by),
        (cx - R * 0.18, by + R * 0.10),
        (cx - R * 0.06, by + R * 0.05),
    ], outline=accent, width=1 * SCALE)
    draw.polygon([
        (cx + R * 0.10, by),
        (cx + R * 0.18, by + R * 0.10),
        (cx + R * 0.06, by + R * 0.05),
    ], outline=accent, width=1 * SCALE)


def sigil_platine(draw, cx, cy, R, accent):
    # Hexagonal lattice : large hex + inner hex + tri-radial bars
    big = hex_at(cx, cy, R * 0.70, rot=30)
    draw.polygon(big, outline=accent, width=3 * SCALE)
    small = hex_at(cx, cy, R * 0.32, rot=30)
    draw.polygon(small, outline=accent, width=1 * SCALE)
    # 3 bars connecting outer vertices to center
    for i in range(3):
        a = math.radians(30 + 120 * i)
        x = cx + R * 0.70 * math.cos(a)
        y = cy + R * 0.70 * math.sin(a)
        draw.line([(cx, cy), (x, y)], fill=accent, width=1 * SCALE)


def sigil_diamant(draw, cx, cy, R, accent):
    # Faceted rhombus with internal facet lines
    top    = (cx, cy - R * 0.72)
    right  = (cx + R * 0.55, cy)
    bottom = (cx, cy + R * 0.72)
    left   = (cx - R * 0.55, cy)
    draw.polygon([top, right, bottom, left], outline=accent, width=3 * SCALE)
    # crown facets
    mid_l = (cx - R * 0.28, cy - R * 0.20)
    mid_r = (cx + R * 0.28, cy - R * 0.20)
    draw.line([left, mid_l], fill=accent, width=1 * SCALE)
    draw.line([right, mid_r], fill=accent, width=1 * SCALE)
    draw.line([mid_l, mid_r], fill=accent, width=1 * SCALE)
    draw.line([top, mid_l], fill=accent, width=1 * SCALE)
    draw.line([top, mid_r], fill=accent, width=1 * SCALE)
    # pavilion facets
    draw.line([mid_l, bottom], fill=accent, width=1 * SCALE)
    draw.line([mid_r, bottom], fill=accent, width=1 * SCALE)
    # central glint
    draw.line([(cx - R * 0.05, cy - R * 0.10), (cx + R * 0.05, cy - R * 0.10)],
              fill=accent, width=2 * SCALE)


def sigil_emeraude(draw, cx, cy, R, accent):
    # Emerald cut : octagon (rectangle with cut corners) + step facets
    w, h = R * 0.86, R * 1.20
    cut = R * 0.20
    pts = [
        (cx - w / 2 + cut, cy - h / 2),
        (cx + w / 2 - cut, cy - h / 2),
        (cx + w / 2,       cy - h / 2 + cut),
        (cx + w / 2,       cy + h / 2 - cut),
        (cx + w / 2 - cut, cy + h / 2),
        (cx - w / 2 + cut, cy + h / 2),
        (cx - w / 2,       cy + h / 2 - cut),
        (cx - w / 2,       cy - h / 2 + cut),
    ]
    draw.polygon(pts, outline=accent, width=3 * SCALE)
    # inner step rectangles
    for k in (0.18, 0.34):
        inset_w = w * (1 - k * 1.4)
        inset_h = h * (1 - k * 1.4)
        cut2 = cut * (1 - k * 1.2)
        ipts = [
            (cx - inset_w / 2 + cut2, cy - inset_h / 2),
            (cx + inset_w / 2 - cut2, cy - inset_h / 2),
            (cx + inset_w / 2,        cy - inset_h / 2 + cut2),
            (cx + inset_w / 2,        cy + inset_h / 2 - cut2),
            (cx + inset_w / 2 - cut2, cy + inset_h / 2),
            (cx - inset_w / 2 + cut2, cy + inset_h / 2),
            (cx - inset_w / 2,        cy + inset_h / 2 - cut2),
            (cx - inset_w / 2,        cy - inset_h / 2 + cut2),
        ]
        draw.polygon(ipts, outline=accent, width=1 * SCALE)


def sigil_maitre(draw, cx, cy, R, accent):
    # Greek cross with serif terminals
    arm = R * 0.62
    th = R * 0.16
    # horizontal bar
    draw.rectangle([cx - arm, cy - th, cx + arm, cy + th], outline=accent, width=3 * SCALE)
    # vertical bar
    draw.rectangle([cx - th, cy - arm, cx + th, cy + arm], outline=accent, width=3 * SCALE)
    # four corner dots
    for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1)]:
        ox = cx + dx * arm * 0.55
        oy = cy + dy * arm * 0.55
        draw.ellipse([ox - 4 * SCALE, oy - 4 * SCALE, ox + 4 * SCALE, oy + 4 * SCALE], fill=accent)


def sigil_grand_maitre(draw, cx, cy, R, accent):
    # Crown : 5 peaks + base bar + jewels
    base_y = cy + R * 0.30
    top_y = cy - R * 0.40
    width = R * 1.10
    peaks_x = [cx - width / 2 + width * i / 4 for i in range(5)]
    valleys_x = [cx - width / 2 + width * (i + 0.5) / 4 for i in range(4)]
    pts = [(cx - width / 2, base_y)]
    for i, px in enumerate(peaks_x):
        pts.append((px, top_y if i % 2 == 0 else top_y + R * 0.18))
        if i < 4:
            pts.append((valleys_x[i], cy - R * 0.05))
    pts.append((cx + width / 2, base_y))
    pts.append((cx - width / 2, base_y))
    draw.polygon(pts, outline=accent, width=3 * SCALE)
    # base band
    draw.rectangle([cx - width / 2, base_y, cx + width / 2, base_y + R * 0.18],
                   outline=accent, width=3 * SCALE)
    # jewels on the band
    for i in range(3):
        jx = cx - width * 0.30 + i * width * 0.30
        jy = base_y + R * 0.09
        draw.ellipse([jx - R * 0.04, jy - R * 0.04, jx + R * 0.04, jy + R * 0.04],
                     outline=accent, width=2 * SCALE)


def sigil_virtuose(draw, cx, cy, R, accent):
    # Stylized flame : pointed top, undulating sides, broader base.
    def flame_poly(scale_x, scale_y, y_offset, n=120):
        pts = []
        for i in range(n + 1):
            t = i / n  # 0 at top → 1 at bottom-loop
            ang = math.pi + 2 * math.pi * t  # start at top going clockwise
            # base radius modulated to create a flame profile
            base = (1 - math.cos(ang)) * 0.5  # 0 at top, 1 at bottom
            # add subtle waves on sides
            wave = 0.07 * math.sin(4 * ang + 0.8)
            r = (0.18 + 0.78 * base + wave)
            x = cx + r * math.sin(ang) * scale_x * R * 0.55
            y = cy - (math.cos(ang) * 1.2 - 0.15) * scale_y * R * 0.55 + y_offset
            pts.append((x, y))
        return pts

    outer = flame_poly(1.0, 1.0, 0)
    draw.polygon(outer, outline=accent, width=3 * SCALE)
    inner = flame_poly(0.50, 0.55, R * 0.08)
    draw.polygon(inner, outline=accent, width=1 * SCALE)
    # core spark (small filled diamond near the heart of the flame)
    sx, sy = cx, cy + R * 0.18
    draw.polygon([
        (sx, sy - R * 0.06),
        (sx + R * 0.04, sy),
        (sx, sy + R * 0.06),
        (sx - R * 0.04, sy),
    ], fill=accent)


def sigil_dieu_grec(draw, cx, cy, R, accent):
    # Apollonian sun : long & short alternating rays + double concentric disc +
    # central Omega (Ω) — the divine terminus.
    n_rays = 24
    for i in range(n_rays):
        a = math.radians(i * (360 / n_rays) - 90)
        r1 = R * 0.60
        r2 = R * (0.86 if i % 2 == 0 else 0.74)
        draw.line([
            (cx + r1 * math.cos(a), cy + r1 * math.sin(a)),
            (cx + r2 * math.cos(a), cy + r2 * math.sin(a)),
        ], fill=accent, width=(2 if i % 2 == 0 else 1) * SCALE)
    # double concentric disc
    draw.ellipse([cx - R * 0.42, cy - R * 0.42, cx + R * 0.42, cy + R * 0.42],
                 outline=accent, width=3 * SCALE)
    draw.ellipse([cx - R * 0.34, cy - R * 0.34, cx + R * 0.34, cy + R * 0.34],
                 outline=accent, width=1 * SCALE)
    # Omega glyph — arched top with two splayed feet
    leg_w = 7 * SCALE
    top = cy - R * 0.16
    bot = cy + R * 0.16
    span = R * 0.22
    # arch (upper semicircle)
    draw.arc(
        [cx - span, top - R * 0.04, cx + span, top + R * 0.36],
        start=180, end=360, fill=accent, width=leg_w,
    )
    # left foot : diagonal stroke + small horizontal serif
    draw.line([(cx - span + leg_w / 2, top + R * 0.16),
               (cx - span - R * 0.04, bot)], fill=accent, width=leg_w)
    draw.line([(cx - span - R * 0.12, bot),
               (cx - span + R * 0.06, bot)], fill=accent, width=leg_w)
    # right foot
    draw.line([(cx + span - leg_w / 2, top + R * 0.16),
               (cx + span + R * 0.04, bot)], fill=accent, width=leg_w)
    draw.line([(cx + span + R * 0.12, bot),
               (cx + span - R * 0.06, bot)], fill=accent, width=leg_w)


SIGIL_FNS = {
    "bronze":       sigil_bronze,
    "argent":       sigil_argent,
    "or":           sigil_or,
    "platine":      sigil_platine,
    "diamant":      sigil_diamant,
    "emeraude":     sigil_emeraude,
    "maitre":       sigil_maitre,
    "grand-maitre": sigil_grand_maitre,
    "virtuose":     sigil_virtuose,
    "dieu-grec":    sigil_dieu_grec,
}


def make_logo(rank_id, label, numeral, accent, ground, glow):
    img = Image.new("RGB", (W, W), INK)
    cx, cy = W // 2, W // 2

    draw_radial_ground(img, (cx, cy), ground, glow,
                       glow_strength=110 if rank_id == "dieu-grec" else 80)

    # we draw on RGBA to support hairlines well
    overlay = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    R_outer = int(W * 0.42)
    draw_frame(draw, cx, cy, accent, R_outer)

    # central sigil region radius
    R_sig = int(R_outer * 0.62)
    SIGIL_FNS[rank_id](draw, cx, cy - int(R_outer * 0.03), R_sig, accent)

    # composite overlay (sigil etc.) onto ground
    img = img.convert("RGBA")
    img.alpha_composite(overlay)

    draw = ImageDraw.Draw(img)
    serif = f("Gloock-Regular.ttf", int(W * 0.038))
    serif_big = f("Gloock-Regular.ttf", int(W * 0.060))
    mono = f("DMMono-Regular.ttf", int(W * 0.025))

    # Roman numeral at top inside the ring
    bbox = draw.textbbox((0, 0), numeral, font=serif_big)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - R_outer * 0.93 - bbox[1]),
              numeral, font=serif_big, fill=accent)

    # tier rule (thin line under numeral)
    rule_w = int(W * 0.06)
    ry = cy - R_outer * 0.80
    draw.line([(cx - rule_w / 2, ry), (cx + rule_w / 2, ry)],
              fill=accent, width=1 * SCALE)

    # bottom : label
    bbox = draw.textbbox((0, 0), label, font=serif)
    lw = bbox[2] - bbox[0]
    # letter-spaced label
    spaced = " ".join(list(label))
    bbox = draw.textbbox((0, 0), spaced, font=serif)
    lw = bbox[2] - bbox[0]
    draw.text((cx - lw / 2, cy + R_outer * 0.78 - bbox[1]),
              spaced, font=serif, fill=accent)

    # small inscription far below the label
    insc = f"MUSCULOG  ·  RANK  ·  {numeral}"
    bbox = draw.textbbox((0, 0), insc, font=mono)
    iw = bbox[2] - bbox[0]
    draw.text((cx - iw / 2, cy + R_outer * 1.00 - bbox[1]),
              insc, font=mono, fill=(accent[0], accent[1], accent[2]))

    # downscale to final size with antialiasing
    img = img.convert("RGB").resize((SIZE, SIZE), Image.LANCZOS)
    return img


def make_contact_sheet(logos):
    """5x2 contact sheet of all 10 emblems on deep ink ground."""
    cell = SIZE // 2
    pad = SIZE // 16
    cols, rows = 5, 2
    sheet_w = cols * cell + (cols + 1) * pad
    sheet_h = rows * cell + (rows + 1) * pad + 80
    sheet = Image.new("RGB", (sheet_w, sheet_h), INK_DEEP)
    for i, logo in enumerate(logos):
        thumb = logo.resize((cell, cell), Image.LANCZOS)
        c = i % cols
        r = i // cols
        x = pad + c * (cell + pad)
        y = pad + r * (cell + pad)
        sheet.paste(thumb, (x, y))
    # title
    draw = ImageDraw.Draw(sheet)
    title_font = ImageFont.truetype(os.path.join(FONT_DIR, "Gloock-Regular.ttf"), 28)
    title = "H E R A L D I C   A S C E N S I O N   ·   T E N   R A N K S"
    bbox = draw.textbbox((0, 0), title, font=title_font)
    tw = bbox[2] - bbox[0]
    draw.text(((sheet_w - tw) / 2, sheet_h - 50), title,
              font=title_font, fill=(180, 180, 180))
    return sheet


def main():
    logos = []
    for rank_id, label, numeral, accent, ground, glow in RANKS:
        img = make_logo(rank_id, label, numeral, accent, ground, glow)
        out_path = os.path.join(OUT_DIR, f"rank-{rank_id}.png")
        img.save(out_path, "PNG", optimize=True)
        logos.append(img)
        print("wrote", out_path)

    sheet = make_contact_sheet(logos)
    sheet_path = os.path.join(OUT_DIR, "rank-contact-sheet.png")
    sheet.save(sheet_path, "PNG", optimize=True)
    print("wrote", sheet_path)


if __name__ == "__main__":
    main()
