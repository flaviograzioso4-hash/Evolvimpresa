#!/usr/bin/env python3
"""
Generate a transparent GIF 'grafico_lamborghini_target.gif' using Matplotlib.
Specs: Lamborghini yellow (#FEDF00), transparent background, axes drawing,
6 bars animating, progressive arrow, final target with 300K label.

Usage:
  python3 scripts/generate_gif.py

Outputs: grafico_lamborghini_target.gif in the current repo root.
"""
import math
import os
from io import BytesIO

import imageio
import numpy as np
from PIL import Image
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle, Polygon

# --- Config
OUT_FILE = 'grafico_lamborghini_target.gif'
FPS = 24  # frames per second (within 20-24)
DURATION_SEC = 7.0
FRAMES = int(FPS * DURATION_SEC)
W, H = 720, 420  # pixels
DPI = 100

# Colors
LAMB = '#FEDF00'  # Lamborghini yellow
WHITE = '#FFFFFF'
GLOW_ALPHA = 0.48  # glow alpha between 0.4-0.6

# Timeline (in frames)
# phases durations
axes_dur = int(0.8 * FPS)  # axes build
months_dur = int(0.45 * FPS)
cols_total_dur = int(2.8 * FPS)  # all columns sequentially
arrow_dur = int(0.9 * FPS)
target_dur = int(0.8 * FPS)

# compute offsets
f_axes_end = axes_dur
f_months_end = f_axes_end + months_dur
col_start = f_months_end
# per-column duration and spacing
n_cols = 6
col_each = int(cols_total_dur / n_cols)
col_starts = [col_start + i * col_each for i in range(n_cols)]
col_ends = [s + col_each for s in col_starts]
f_cols_end = col_ends[-1]
f_arrow_start = f_cols_end + int(0.06 * FPS)
f_arrow_end = f_arrow_start + arrow_dur
f_target_start = f_arrow_end + int(0.04 * FPS)
f_target_end = f_target_start + target_dur

# easing (easeInOutCubic equivalent using t*t*(3-2*t))
def ease(t):
    return t * t * (3 - 2 * t)

# chart layout in pixel coords
pad_l, pad_r = 84, 84
pad_b, pad_t = 60, 80
chart_left = pad_l
chart_right = W - pad_r
chart_bottom = pad_b
chart_top = H - pad_t
chart_w = chart_right - chart_left
chart_h = chart_top - chart_bottom

# bar properties
bar_names = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu']
# normalized target heights (0..1)
heights = [0.35, 0.52, 0.62, 0.48, 0.72, 0.9]
bar_w = int(chart_w / (n_cols * 2.6))
bar_xs = [chart_left + (i + 0.6) * (chart_w / n_cols) for i in range(n_cols)]

# arrow path: from low-left to near last bar top
arrow_start = (chart_left + 12, chart_bottom + 14)
arrow_end_x = chart_left + chart_w * 0.94
arrow_end_y = chart_bottom + heights[-1] * chart_h + 6
arrow_end = (arrow_end_x, arrow_end_y)

# target at arrow end + small offset
target_cx = arrow_end[0]
target_cy = arrow_end[1]

# helper to render frame using Matplotlib and return RGBA numpy array

def render_frame(frame_idx):
    fig = plt.figure(figsize=(W / DPI, H / DPI), dpi=DPI)
    ax = fig.add_axes([0, 0, 1, 1])
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    ax.axis('off')

    # transparent background
    fig.patch.set_alpha(0.0)
    ax.patch.set_alpha(0.0)

    # axes draw progress
    t_axes = min(max(frame_idx / max(1, axes_dur), 0.0), 1.0)
    t_axes_e = ease(t_axes)
    # X axis: left -> right
    x_end = chart_left + t_axes_e * chart_w
    ax.plot([chart_left, x_end], [chart_bottom, chart_bottom], color=LAMB, linewidth=3.2, solid_capstyle='round')
    # subtle lighter end cap
    if t_axes > 0.98:
        ax.scatter([chart_left, chart_right], [chart_bottom, chart_bottom], s=8, color='#FFF8D9', zorder=5)

    # glow behind axes (soft thicker line, alpha)
    ax.plot([chart_left, x_end], [chart_bottom, chart_bottom], color=LAMB, linewidth=12, alpha=GLOW_ALPHA * 0.7, solid_capstyle='round')

    # Y axis: bottom -> top
    y_end = chart_bottom + t_axes_e * chart_h
    ax.plot([chart_left, chart_left], [chart_bottom, y_end], color=LAMB, linewidth=3.2, solid_capstyle='round')
    ax.plot([chart_left, chart_left], [chart_bottom, y_end], color=LAMB, linewidth=12, alpha=GLOW_ALPHA * 0.7)

    # months labels fade-in after axes
    alpha_months = 0.0
    if frame_idx >= f_axes_end:
        t_m = (frame_idx - f_axes_end) / max(1, months_dur)
        alpha_months = ease(min(max(t_m, 0.0), 1.0))
    for i, name in enumerate(bar_names):
        x = bar_xs[i]
        ax.text(x, chart_bottom - 16, name, ha='center', va='top', fontsize=12, color=WHITE, alpha=alpha_months)

    # bars: each grows one-by-one with ease
    for i in range(n_cols):
        # compute progress for this bar
        s = col_starts[i]
        e = col_ends[i]
        if frame_idx < s:
            p = 0.0
        elif frame_idx >= e:
            p = 1.0
        else:
            t = (frame_idx - s) / max(1, (e - s))
            p = ease(min(max(t, 0.0), 1.0))
        # actual height
        h_target = heights[i] * chart_h
        h = h_target * p
        bx = bar_xs[i] - bar_w / 2
        by = chart_bottom
        # glow rectangle behind
        glow_w = int(bar_w * 1.55)
        glow_x = bar_xs[i] - glow_w / 2
        rect_glow = Rectangle((glow_x, by), glow_w, h, facecolor=LAMB, alpha=GLOW_ALPHA * 0.85, linewidth=0, zorder=1)
        ax.add_patch(rect_glow)
        # main bar
        rect = Rectangle((bx, by), bar_w, h, facecolor=LAMB, edgecolor=None, linewidth=0, zorder=3)
        ax.add_patch(rect)

    # arrow drawing after columns
    arrow_progress = 0.0
    if frame_idx >= f_arrow_start:
        t = (frame_idx - f_arrow_start) / max(1, (f_arrow_end - f_arrow_start))
        arrow_progress = ease(min(max(t, 0.0), 1.0))
    if arrow_progress > 0:
        sx, sy = arrow_start
        ex, ey = arrow_end
        cx = sx + arrow_progress * (ex - sx)
        cy = sy + arrow_progress * (ey - sy)
        # draw glow line behind
        ax.plot([sx, cx], [sy, cy], color=LAMB, linewidth=8, alpha=GLOW_ALPHA * 0.6, solid_capstyle='round', zorder=2)
        # draw main arrow line
        ax.plot([sx, cx], [sy, cy], color=LAMB, linewidth=3.6, solid_capstyle='round', zorder=5)
        # draw tip if near end (>0.97) or always show moving tip
        # compute tip if arrow_progress>0.0
        # triangle perpendicular and oriented
        tip_size = 12
        if arrow_progress > 0.04:
            # direction vector
            dx = (ex - sx)
            dy = (ey - sy)
            ang = math.atan2(dy, dx)
            # tip position at current end
            tip_x = cx
            tip_y = cy
            # triangle points
            back_x = tip_x - math.cos(ang) * tip_size
            back_y = tip_y - math.sin(ang) * tip_size
            # perpendicular
            px = math.cos(ang + math.pi / 2) * (tip_size * 0.55)
            py = math.sin(ang + math.pi / 2) * (tip_size * 0.55)
            tri = Polygon([[tip_x, tip_y], [back_x + px, back_y + py], [back_x - px, back_y - py]], closed=True, facecolor=LAMB, edgecolor=None, zorder=6)
            ax.add_patch(tri)
            # small glow behind tip
            tri_glow = Polygon([[tip_x, tip_y], [back_x + px, back_y + py], [back_x - px, back_y - py]], closed=True, facecolor=LAMB, alpha=GLOW_ALPHA * 0.8, zorder=3)
            ax.add_patch(tri_glow)

    # target appears at the end with scale & fade
    target_alpha = 0.0
    target_scale = 0.98
    if frame_idx >= f_target_start:
        t = (frame_idx - f_target_start) / max(1, (f_target_end - f_target_start))
        tt = ease(min(max(t, 0.0), 1.0))
        # scale: 1.0 -> 1.1 -> 1.0 (we'll use sin easing for a small bounce)
        if tt < 0.6:
            # scale up
            target_scale = 1.0 + 0.1 * (tt / 0.6)
        else:
            target_scale = 1.1 - 0.1 * ((tt - 0.6) / 0.4)
        target_alpha = tt
    # draw target only if progress > 0
    if target_alpha > 0:
        s = target_scale
        # outer circle
        r_big = 28 * s
        r_mid = 18 * s
        r_in = 9 * s
        # big circle
        circ_big = plt.Circle((target_cx, target_cy), r_big, color=LAMB, zorder=8, alpha=target_alpha)
        circ_mid = plt.Circle((target_cx, target_cy), r_mid, color=WHITE, zorder=9, alpha=target_alpha)
        circ_in = plt.Circle((target_cx, target_cy), r_in, color=LAMB, zorder=10, alpha=target_alpha)
        ax.add_patch(circ_big)
        ax.add_patch(circ_mid)
        ax.add_patch(circ_in)
        # 300K label above
        ax.text(target_cx, target_cy - r_big - 10, '300K', ha='center', va='bottom', fontsize=18, fontweight='bold', color=LAMB, alpha=target_alpha, zorder=11)

    # tighten and render
    ax.set_xlim(0, W)
    ax.set_ylim(0, H)
    # render to RGBA numpy
    fig.canvas.draw()
    buf = fig.canvas.tostring_argb()
    ncols, nrows = fig.canvas.get_width_height()
    img = np.frombuffer(buf, dtype=np.uint8).reshape((nrows, ncols, 4))
    # ARGB -> RGBA
    img = img[:, :, [1, 2, 3, 0]]
    plt.close(fig)
    return img


def main():
    print('Generating frames...')
    frames = []
    for f in range(FRAMES):
        img = render_frame(f)
        frames.append(img)
        if f % 12 == 0:
            print(f' frame {f}/{FRAMES}')

    print('Converting to PIL images and saving GIF...')
    pil_frames = [Image.fromarray(frame, mode='RGBA') for frame in frames]
    # Use imageio to write GIF; imageio will use pillow backend preserving alpha where possible
    imageio.mimsave(OUT_FILE, pil_frames, fps=FPS, format='GIF')
    print('Saved', OUT_FILE)

if __name__ == '__main__':
    main()
