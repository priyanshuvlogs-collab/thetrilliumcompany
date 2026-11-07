# Northbank Advisory: Kadence demo redesign

A concept redesign of the Northbank Advisory sample page (`wpdemo.thetrilliumcompany.com/kadence/`) by The Trillium Company.

- Single static `index.html`, no build step. Inline CSS and JS, Google Fonts (Fraunces + Inter).
- Deploys to Vercel as a static site: import the repo with no framework preset, or run `vercel` in this folder.
- Northbank Advisory is a fictional sample brand. The testimonial is marked as illustrative.

## Showcase video

`video/northbank-showcase.mp4`: a 37-second 1080p/30fps walkthrough (intro, guided desktop scroll with captions, mobile pass, outro). No audio.

To regenerate it, copy `index.html` next to `video/stage.html`, serve that folder at `http://127.0.0.1:8765`, then run `node video/render.js <out-dir> video`. This needs Playwright and ffmpeg. Use `stills` instead of `video` to render preview frames.
