#!/usr/bin/env bash
# Usage: scripts/render.sh <slug> <format: walk|reel|teaser>
# Renders the Remotion composition, then uses ffmpeg to master the audio for ads
# (two-pass EBU R128 loudness: -14 LUFS, -1 dBTP) and re-mux with faststart.
set -euo pipefail
cd "$(dirname "$0")/.."
SLUG=$1; FMT=$2
declare -A ID=([walk]=Walkthrough [reel]=Reel [teaser]=Teaser)
mkdir -p out/raw out/final
RAW=out/raw/$SLUG-$FMT.mp4; FINAL=out/final/$SLUG-$FMT.mp4
npx remotion render ${ID[$FMT]} "$RAW" --props="props/$SLUG-$FMT.json" --codec=h264 --crf=18 --audio-bitrate=192k --log=error --concurrency=${CONC:-4}
# pass 1: measure loudness
M=$(ffmpeg -hide_banner -i "$RAW" -af loudnorm=I=-14:TP=-1:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$M" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
# pass 2: apply measured correction
ffmpeg -hide_banner -v error -y -i "$RAW" -c:v copy \
  -af "loudnorm=I=-14:TP=-1:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true" \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$FINAL"
echo "$FINAL $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$FINAL")s"
