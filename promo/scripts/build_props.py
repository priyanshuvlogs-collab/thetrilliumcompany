"""Build Remotion props for one site and format.

Usage: python3 build_props.py <scripts.json> <slug> <format>

scripts.json holds, per site: brand, tagline, accent, domain, ctaLabel and, per
format, a list of beats ({kind, say, title?, sub?, highlight?, look?, stat?,
statLabel?}). The beat timings come from the voiceover itself: ffmpeg's
silencedetect finds the pauses, and each beat ends at the pause closest to
where its share of the script's characters runs out.
"""
import json, os, re, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = "/home/user/showcase-work/sites"


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path]))


def pauses(path):
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", path, "-af", "silencedetect=noise=-35dB:d=0.15", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    return [((s + e) / 2) for s, e in zip(starts, ends)]


def align(beats, vo):
    total = duration(vo)
    gaps = pauses(vo)
    chars = [len(b["say"]) for b in beats]
    whole = sum(chars)
    # speech starts after any leading silence
    lead = 0.0
    out = subprocess.run(["ffmpeg", "-v", "info", "-i", vo, "-af", "silencedetect=noise=-35dB:d=0.05", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    m = re.search(r"silence_start: 0(?:\.0+)?\s.*?silence_end: ([\d.]+)", out, re.S)
    if m:
        lead = float(m.group(1))
    bounds, acc, used = [], 0, set()
    for c in chars[:-1]:
        acc += c
        target = lead + (total - lead) * acc / whole
        cands = [g for g in gaps if g not in used and (not bounds or g > bounds[-1] + 0.4)]
        g = min(cands, key=lambda x: abs(x - target)) if cands else target
        if abs(g - target) > 1.6:  # no pause nearby: cut at the proportional point
            g = target
        used.add(g)
        bounds.append(g)
    edges = [0.0] + bounds + [total]
    return [(edges[i], edges[i + 1]) for i in range(len(beats))], total


def find_y(sections, look, height, frac):
    if look:
        for s in sections:
            if look.lower() in s["text"].lower():
                return max(0, s["y"] - 90)
    return max(0, height * frac - 300)


def main(scripts_path, slug, fmt):
    data = json.load(open(scripts_path))[slug]
    cap = json.load(open(f"{SITES}/{data.get('capture', slug)}/config.json"))
    dst = f"{ROOT}/public/sites/{slug}"
    os.makedirs(dst, exist_ok=True)
    for f in ("desktop.jpg", "mobile.jpg"):
        if not os.path.exists(f"{dst}/{f}"):
            shutil.copy(f"{SITES}/{data.get('capture', slug)}/{f}", dst)
    vo = f"audio/{slug}/{fmt}.mp3"
    beats = data[fmt]
    spans, total = align(beats, f"{ROOT}/public/{vo}")
    out_beats = []
    n = len(beats)
    for i, (b, (a, z)) in enumerate(zip(beats, spans)):
        frac = (i + 1) / (n + 1)
        nb = {k: v for k, v in b.items() if k != "look"}
        nb["from"], nb["to"] = round(a, 3), round(z, 3)
        if b["kind"] in ("feature", "brand"):
            nb["dy"] = 0 if b["kind"] == "brand" else find_y(cap["desktop"]["sections"], b.get("look"), cap["desktop"]["height"], frac)
            nb["my"] = 0 if b["kind"] == "brand" else find_y(cap["mobile"]["sections"], b.get("look"), cap["mobile"]["height"], frac)
        out_beats.append(nb)
    props = {
        "slug": slug, "format": fmt, "brand": data["brand"], "tagline": data["tagline"],
        "accent": data.get("accent", cap["accent"]), "domain": data.get("domain"), "ctaLabel": data.get("ctaLabel", "Visit the website"),
        "desktopH": cap["desktop"]["height"], "mobileH": cap["mobile"]["height"],
        "vo": vo, "voDuration": round(total, 3), "music": data.get("music", "audio/music/upbeat.mp3"), "beats": out_beats,
    }
    if fmt == "teaser":  # the square cut advertises the agency itself
        props["ctaButton"] = "hello@thetrilliumcompany.com"
    if props["domain"] is None:
        del props["domain"]
    os.makedirs(f"{ROOT}/props", exist_ok=True)
    path = f"{ROOT}/props/{slug}-{fmt}.json"
    json.dump(props, open(path, "w"), indent=1)
    print(path, [(b["kind"], b["from"], b["to"]) for b in out_beats])


if __name__ == "__main__":
    main(*sys.argv[1:4])
