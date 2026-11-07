// Usage: node render.js <port> <site> <format: walk|reel|teaser> <out.mp4|stillsDir> [stills]
// Expects an http server on 127.0.0.1:<port> serving stage.html and sites/<site>/.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const [port, site, format, out, mode] = process.argv.slice(2);
const DIMS = { walk: [1920, 1080], reel: [1080, 1920], teaser: [1080, 1080] };
(async () => {
  const [w, h] = DIMS[format];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto(`http://127.0.0.1:${port}/stage.html?site=${encodeURIComponent(site)}&format=${format}`, { waitUntil: 'networkidle' });
  const { total } = await p.evaluate(() => window.setup());
  if (mode === 'stills') {
    const ts = [0.3, 0.25, 0.45, 0.65, 0.85, 0.97].map(f => f * total);
    for (const t of ts) { await p.evaluate(t => render(t), t); await p.screenshot({ path: `${out}/${format}_${t.toFixed(1)}.jpg`, type: 'jpeg', quality: 70 }); }
  } else {
    const fps = 30, N = Math.ceil(total * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '' + fps, '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < N; i++) {
      await p.evaluate(t => render(t), i / fps);
      const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  console.log(`${site} ${format} ${total.toFixed(1)}s`);
  await b.close();
})().catch(e => { console.error('RENDER FAILED', site, format, e.message); process.exit(1); });
