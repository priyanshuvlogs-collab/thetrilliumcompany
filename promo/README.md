# Launch-ad video engine

Motion-graphics promo videos for client websites, built with Remotion. Each site gets:

| Cut | Size | Use |
|---|---|---|
| Walkthrough | 1920×1080 | YouTube, website, client pitch |
| Reel | 1080×1920 | Instagram Reels, TikTok, Shorts |
| Teaser | 1080×1080 | Feed ad for The Trillium Company |

Every cut has an ElevenLabs voiceover, a music bed ducked under the voice, sound effects on each cut, and burned-in subtitles timed to the speech.

## Pipeline

1. **Screenshots**: `../showcase/capture.js` grabs full-page desktop and mobile captures plus section positions.
2. **Script**: add the site to `scripts/scripts.json` (or `scripts/add_scripts.py`): voice, music, and beats per format.
3. **Audio**: generate each format's voiceover with ElevenLabs and save it as `public/audio/<slug>/<format>.mp3`.
4. **Props**: `python3 scripts/build_props.py scripts/scripts.json <slug> <format>` uses ffmpeg `silencedetect` to time each beat to the pauses in the voiceover.
5. **Render**: `scripts/render.sh <slug> <format>` renders with Remotion, then masters the audio to -14 LUFS / -1 dBTP with a two-pass ffmpeg `loudnorm`. `scripts/render_all.sh` does every site.

Client screenshots, audio, props and renders are gitignored. `public/sfx` and `public/fonts` are committed.

Preview in the Studio with `npx remotion studio`.
