// Usage: node capture.js <url> <outDir> [brandOverride]
// Captures full-page desktop (1440w) + mobile (390w @2x) screenshots and page metadata.
const { chromium } = require('playwright');
const fs = require('fs');
const [url, out, brandOverride] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });

async function settle(page) {
  // scroll through the page to trigger lazy images / reveal-on-scroll animations
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < Math.min(h, 16000); y += 500) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(90);
  }
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
  // dismiss common cookie / popup overlays
  await page.addStyleTag({ content: `
    [id*="cookie" i],[class*="cookie" i],[id*="consent" i],[class*="consent" i],
    #crisp-chatbox,nextjs-portal,[data-nextjs-toast],.intercom-lightweight-app,[class*="tawk" i]{display:none!important}
    ::-webkit-scrollbar{display:none}` }).catch(() => {});
}

async function meta(page) {
  return page.evaluate(() => {
    const txt = el => (el?.innerText || el?.textContent || '').replace(/\s+/g, ' ').trim();
    const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
    const sy = window.scrollY;
    const heads = [...document.querySelectorAll('h2, section h3:first-of-type')]
      .filter(vis).map(el => ({ text: txt(el).slice(0, 140), y: el.getBoundingClientRect().top + sy }))
      .filter(h => h.text.length > 2 && h.text.length < 140)
      .sort((a, b) => a.y - b.y);
    // de-duplicate headings that are very close together
    const sections = [];
    for (const h of heads) if (!sections.length || h.y - sections[sections.length - 1].y > 300) sections.push(h);
    // accent colour: most-used saturated background among buttons/links
    const score = {};
    const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const [r, g, b, a = 1] = m[1].split(',').map(Number); return a < 0.6 ? null : [r, g, b]; };
    const sat = ([r, g, b]) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : (mx - mn) / mx; };
    for (const el of document.querySelectorAll('a, button, [class*="btn" i], [class*="button" i]')) {
      if (!vis(el)) continue;
      const c = parse(getComputedStyle(el).backgroundColor);
      if (!c || sat(c) < 0.25 || Math.max(...c) < 70) continue;
      const r = el.getBoundingClientRect(); const k = c.join(',');
      score[k] = (score[k] || 0) + Math.min(r.width * r.height, 40000) + 5000;
    }
    let accent = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!accent) { // fall back to headings / links colour
      for (const el of document.querySelectorAll('h1, h2, a')) { const c = parse(getComputedStyle(el).color); if (c && sat(c) > 0.3) { accent = c.join(','); break; } }
    }
    const og = document.querySelector('meta[property="og:site_name"]')?.content;
    const desc = document.querySelector('meta[name="description"]')?.content || document.querySelector('meta[property="og:description"]')?.content || '';
    const h1 = txt(document.querySelector('h1'));
    return {
      title: document.title, siteName: og || '', h1, desc: desc.trim(),
      sections, accent: accent ? `rgb(${accent})` : '',
      bodyBg: getComputedStyle(document.body).backgroundColor,
      height: document.documentElement.scrollHeight,
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const go = async (page) => {
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
    catch { await page.goto(url, { waitUntil: 'load', timeout: 60000 }); }
    await page.waitForTimeout(1500);
  };
  // desktop
  const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const dp = await dctx.newPage(); await go(dp); await settle(dp);
  const dm = await meta(dp);
  const dh = Math.min(dm.height, 14000);
  await dp.screenshot({ path: `${out}/desktop.jpg`, type: 'jpeg', quality: 88, fullPage: true, clip: { x: 0, y: 0, width: 1440, height: dh } });
  // mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const mp = await mctx.newPage(); await go(mp); await settle(mp);
  const mm = await meta(mp);
  const mh = Math.min(mm.height, 7800);
  await mp.screenshot({ path: `${out}/mobile.jpg`, type: 'jpeg', quality: 85, fullPage: true, clip: { x: 0, y: 0, width: 390, height: mh } });

  const clean = s => (s || '').replace(/\s*[|–—·:-]\s*.*$/, '').trim();
  let brand = brandOverride || dm.siteName || clean(dm.title) || dm.h1.split(' ').slice(0, 3).join(' ');
  if (brand.length > 32) brand = brand.slice(0, 32).replace(/\s+\S*$/, '');
  const config = {
    url, brand, title: dm.title, h1: dm.h1, desc: dm.desc, accent: dm.accent || 'rgb(18,113,96)', bodyBg: dm.bodyBg,
    desktop: { height: dh, sections: dm.sections.filter(s => s.y < dh - 300) },
    mobile: { height: mh, sections: mm.sections.filter(s => s.y < mh - 300) },
  };
  fs.writeFileSync(`${out}/config.json`, JSON.stringify(config, null, 2));
  console.log(JSON.stringify({ brand, accent: config.accent, dh, mh, sections: config.desktop.sections.length }));
  await browser.close();
})().catch(e => { console.error('CAPTURE FAILED', e.message); process.exit(1); });
