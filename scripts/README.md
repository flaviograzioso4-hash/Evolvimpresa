# Generate Lamborghini-style GIF

This script generates `grafico_lamborghini_target.gif` — a transparent animated GIF matching the visual brief.

Requirements

Install the Python packages (preferably in a virtualenv):

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r scripts/requirements.txt
```

Run the generator:

```bash
python3 scripts/generate_gif.py
```

Output: `grafico_lamborghini_target.gif` in the project root.

Notes & Caveats

- The script uses Matplotlib to render RGBA frames and `imageio` (Pillow backend) to assemble a GIF. GIF transparency handling can vary depending on installed libraries; if the output GIF loses transparency, consider installing ImageMagick and converting frames to GIF via ImageMagick or using `moviepy` with ImageMagick as a backend.
- Frame rate: 24 FPS, total duration ~7s.
- Colors: Lamborghini yellow `#FEDF00` and white `#FFFFFF`.
- If you want different timing/easing or higher resolution, edit `scripts/generate_gif.py` constants near the top.
