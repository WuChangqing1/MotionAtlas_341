'use strict';
/**
 * MotionAtlas MA341-DEMO-001: trusted host-side Canvas frame exporter.
 * Runs as an ordinary Windows user (Medium integrity), OUTSIDE DSH's Low sandbox.
 * Uses locally installed Chrome or Edge, not a downloaded Chromium.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright-core');

const demoDir = path.resolve(__dirname, '..', '..');
const htmlPath = path.join(demoDir, 'renderer', 'still.html');
const outputDir = path.join(demoDir, 'stills');
const frames = [
  { shot: 'S01', time: 1.80, file: 'S01_01.80s.png' },
  { shot: 'S03', time: 6.00, file: 'S03_06.00s.png' },
  { shot: 'S04', time: 7.80, file: 'S04_07.80s.png' },
  { shot: 'S05', time: 11.20, file: 'S05_11.20s.png' },
  { shot: 'S06', time: 12.70, file: 'S06_12.70s.png' },
  { shot: 'S07', time: 14.60, file: 'S07_14.60s.png' },
];
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

async function openBrowser() {
  const failures = [];
  for (const channel of ['chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ channel, headless: true, timeout: 45000 });
      console.log(`Browser started: ${channel} / ${browser.version()}`);
      return { browser, channel };
    } catch (e) {
      failures.push(`${channel}: ${String(e.message || e).slice(0, 550)}`);
    }
  }
  throw new Error('Neither system Chrome nor system Edge could start under the current host account.\n' + failures.join('\n'));
}

function pngDimensions(bytes) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.length < 24 || !bytes.subarray(0,8).equals(signature)) throw new Error('Canvas export did not return a valid PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

async function exportAt(page, time) {
  const url = new URL(pathToFileURL(htmlPath).href);
  url.searchParams.set('t', time.toFixed(2));
  await page.goto(url.href, { waitUntil: 'load', timeout: 40000 });
  await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
  // Allow the page's load/RAF handlers to perform initial drawing.
  await page.waitForTimeout(450);
  const frame = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const canvas = canvases.find(c => c.width === 1920 && c.height === 1080) || canvases[0];
    if (!canvas) throw new Error('No <canvas> element found. Check still.html and render initialization.');
    return { width: canvas.width, height: canvas.height, url: canvas.toDataURL('image/png') };
  });
  if (frame.width !== 1920 || frame.height !== 1080) {
    throw new Error(`Canvas intrinsic dimensions are ${frame.width}x${frame.height}, expected 1920x1080. Do not upscale silently.`);
  }
  if (!frame.url.startsWith('data:image/png;base64,')) throw new Error('Canvas did not return a PNG data URL');
  const bytes = Buffer.from(frame.url.split(',')[1], 'base64');
  const dims = pngDimensions(bytes);
  if (dims.width !== 1920 || dims.height !== 1080) throw new Error(`PNG dimensions: ${dims.width}x${dims.height}`);
  return bytes;
}

function reviewHtml(items) {
  const cards = items.map(x => `<article><header><strong>${x.shot}</strong><span>${x.time.toFixed(2)} 秒</span></header><a href="stills/${x.file}" target="_blank" rel="noopener"><img src="stills/${x.file}" alt="${x.shot} ${x.time.toFixed(2)} 秒实际 Canvas 静帧" loading="lazy"></a><p>${x.file}</p></article>`).join('\n');
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Motion Atlas · 六帧审片</title><style>*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#eef2fc;font:18px/1.6 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1500px;margin:auto;padding:30px}h1{font-size:34px;margin:0}p{color:#b9c6dd}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(420px,1fr));gap:22px;margin-top:28px}article{background:#171f2e;border:1px solid #303d55;border-radius:15px;overflow:hidden}article header{display:flex;justify-content:space-between;padding:14px 18px;font-size:21px}article img{width:100%;display:block;aspect-ratio:16/9;object-fit:contain}article p{padding:0 18px;font-size:16px;word-break:break-all}@media(max-width:550px){main{padding:15px}.grid{grid-template-columns:1fr}h1{font-size:27px}}</style></head><body><main><h1>Motion Atlas · 六帧审片</h1><p>这些图片从浏览器实际运行的 Canvas 导出。6.2 mm / 23° / 71% 为模拟演示数据，不是实测。验收结论见 <a href="STILL_REPORT.md">STILL_REPORT.md</a>；画面是否符合美术与叙事要求仍需作者人工审核。</p><section class="grid">${cards}</section></main></body></html>`;
}

async function main() {
  if (!fs.existsSync(htmlPath)) throw new Error(`Renderer missing: ${htmlPath}`);
  fs.mkdirSync(outputDir, { recursive: true });
  const htmlSha = sha(fs.readFileSync(htmlPath));
  const { browser, channel } = await openBrowser();
  const manifest = { project: 'MA341-DEMO-001', source: htmlPath, source_sha256: htmlSha, channel, width: 1920, height: 1080, frames: [], warnings: [], verified_visual_by_human: false };
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', err => pageErrors.push(String(err.message || err)));
  try {
    for (const f of frames) {
      const first = await exportAt(page, f.time);
      const second = await exportAt(page, f.time);
      const firstSha = sha(first);
      const secondSha = sha(second);
      const consistent = firstSha === secondSha;
      fs.writeFileSync(path.join(outputDir, f.file), first);
      const item = { shot: f.shot, time: f.time, file: f.file, bytes: first.length, sha256: firstSha, bytes_repeat: second.length, sha256_repeat: secondSha, deterministic_reopen: consistent };
      manifest.frames.push(item);
      console.log(`${consistent ? 'PASS' : 'WARN'} ${f.file} ${first.length} bytes SHA=${item.sha256.slice(0,16)}... same-t=${consistent}`);
      if (!consistent) manifest.warnings.push(`${f.file}: same t rendered to different PNG bytes; inspect time freezing, resource loading, animations.`);
    }
    if (new Set(manifest.frames.map(f => f.sha256)).size === 1) manifest.warnings.push('All six PNGs are identical; inspect whether ?t= is honored.');
    if (pageErrors.length) manifest.warnings.push(...pageErrors.map(e => `Browser pageerror: ${e}`));
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(demoDir, 'render-manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  if (manifest.frames.length === frames.length) fs.writeFileSync(path.join(demoDir, 'review.html'), reviewHtml(manifest.frames), 'utf8');
  console.log(`\nPNG output: ${outputDir}`);
  console.log(`Review page: ${path.join(demoDir, 'review.html')}`);
  console.log(`Manifest: ${path.join(demoDir, 'render-manifest.json')}`);
  if (manifest.warnings.length) {
    console.error('WARNINGS:\n' + manifest.warnings.join('\n'));
    process.exitCode = 2;
  } else {
    console.log('Export complete. Six real Canvas PNG files created; human visual review still required.');
  }
}
main().catch(e => { console.error('BLOCKED: ' + (e.stack || e)); process.exitCode = 1; });
