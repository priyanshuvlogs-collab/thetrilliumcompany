#!/usr/bin/env bash
# Renders every site in scripts.json in all three formats.
cd "$(dirname "$0")/.."
for slug in $(python3 -c "import json;print(' '.join(json.load(open('scripts/scripts.json'))))"); do
  for f in walk reel teaser; do
    [ -f "out/final/$slug-$f.mp4" ] && [ "${FORCE:-0}" = 0 ] && { echo "skip $slug-$f"; continue; }
    scripts/render.sh "$slug" "$f" 2>&1 | grep -vE "memory|Memory|CGroup|meminfo" | tail -1 || echo "FAILED $slug $f"
  done
done
echo RENDER_ALL_DONE
