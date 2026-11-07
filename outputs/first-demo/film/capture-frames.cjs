'use strict';
/**
 * MA341-DEMO-001 picture-lock frame exporter.
 * Runs in a normal Windows PowerShell (Medium integrity), NOT in the DSH Low sandbox.
 * Uses the already verified system Chrome / playwright-core path.
 *
 * Usage:
 *   node capture-frames.cjs --smoke
 *   node capture-frames.cjs --smoke-particles
 *   node capture-frames.cjs --smoke-particles --dry-run
 *   node capture-frames.cjs --diagnose-particles
 *   node capture-frames.cjs
 *   node capture-frames.cjs --resume
 *
 * Output:
 *   film/frames/frame_000000.png ... frame_000449.png
 *   film/frame-manifest.json
 * Smoke output:
 *   film/smoke/frame_XXXXXX.png, film/smoke-manifest.json
 * Particle smoke output:
 *   film/particle-smoke/frame_XXXXXX.png, film/particle-smoke-manifest.json,
 *   film/particle-smoke/review.html
 * Particle diagnostics output:
 *   film/particle-diagnostics/*_A/_B/_C.png, particle-diagnostics-manifest.json,
 *   review.html
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const filmDir = __dirname;
const htmlPath = path.join(filmDir, 'film.html');
const timelinePath = path.join(filmDir, 'timeline.js');
const playwrightPath = path.join(filmDir, '..', 'renderer', 'host-tools', 'node_modules', 'playwright-core');
const { chromium } = require(playwrightPath);

const FPS = 30;
const TOTAL = 450;
const W = 1920;
const H = 1080;
const SMOKE_FRAMES = [0, 30, 60, 90, 132, 180, 240, 300, 360, 390, 420, 449];
const PARTICLE_SMOKE_FRAMES = [30, 54, 75, 90, 96, 105, 108, 114, 120, 126, 132, 150, 165, 180, 189, 192, 195, 199, 200, 234, 240, 270, 300, 360, 369, 375, 381, 384, 390, 396, 399, 405, 438, 449];
const DIAGNOSTIC_FRAMES = [
  { frame: 90, target: 'S02' }, { frame: 96, target: 'S02' }, { frame: 105, target: 'S02' }, { frame: 108, target: 'S02' },
  { frame: 114, target: 'S02' }, { frame: 120, target: 'S02' }, { frame: 126, target: 'S02' }, { frame: 132, target: 'S02' },
  { frame: 369, target: 'S06' }, { frame: 375, target: 'S06' }, { frame: 381, target: 'S06' }, { frame: 384, target: 'S06' },
  { frame: 390, target: 'S06' }, { frame: 396, target: 'S06' }, { frame: 399, target: 'S06' }, { frame: 405, target: 'S06' }
];

const args = new Set(process.argv.slice(2));
const tagArg = process.argv.find(a => a.startsWith('--tag='));
const tag = tagArg ? tagArg.split('=')[1].replace(/[^A-Za-z0-9_-]/g, '') : '';
const isParticleSmoke = args.has('--smoke-particles');
const isDiagnostics = args.has('--diagnose-particles');
const isSmoke = args.has('--smoke');
const resume = args.has('--resume');
const dryRun = args.has('--dry-run');
const particleDirName = tag ? `particle-smoke-${tag}` : 'particle-smoke';
const diagnosticDirName = tag ? `particle-diagnostics-${tag}` : 'particle-diagnostics';
const outDir = path.join(filmDir, isDiagnostics ? diagnosticDirName : isParticleSmoke ? particleDirName : isSmoke ? 'smoke' : 'frames');
const manifestPath = path.join(filmDir, isDiagnostics ? `${diagnosticDirName}-manifest.json` : isParticleSmoke ? `${particleDirName}-manifest.json` : isSmoke ? 'smoke-manifest.json' : 'frame-manifest.json');

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

function pngDimensions(bytes) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(sig)) throw new Error('Canvas export is not a valid PNG');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function frameName(i) { return `frame_${String(i).padStart(6, '0')}.png`; }

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function sampleFrames() {
  const set = new Set([0, 30, 60, 90, 132, 180, 240, 300, 360, 390, 420, 449]);
  const r = mulberry32(20261106);
  while (set.size < 18) set.add(Math.floor(r() * TOTAL));
  return Array.from(set).sort((a, b) => a - b);
}

async function openBrowser() {
  const failures = [];
  for (const channel of ['chrome', 'msedge']) {
    try {
      const browser = await chromium.launch({ channel, headless: true, timeout: 45000 });
      console.log(`Browser: ${channel} / ${browser.version()}`);
      return { browser, channel };
    } catch (e) {
      failures.push(`${channel}: ${String(e.message || e).slice(0, 500)}`);
    }
  }
  throw new Error('Neither system Chrome nor Edge could start in the host account.\n' + failures.join('\n'));
}

async function exportAt(page, frame) {
  const t = frame / FPS;
  await page.evaluate(tt => window.__seek(tt), t);
  const data = await page.evaluate(() => {
    const canvases = Array.from(document.querySelectorAll('canvas'));
    const canvas = canvases.find(c => c.width === 1920 && c.height === 1080) || canvases[0];
    if (!canvas) throw new Error('No 1920x1080 canvas found in film.html');
    return { w: canvas.width, h: canvas.height, url: canvas.toDataURL('image/png') };
  });
  if (data.w !== W || data.h !== H) throw new Error(`Canvas intrinsic ${data.w}x${data.h}, expected ${W}x${H}`);
  if (!data.url.startsWith('data:image/png;base64,')) throw new Error('Canvas did not return a PNG data URL');
  const bytes = Buffer.from(data.url.split(',')[1], 'base64');
  const dims = pngDimensions(bytes);
  if (dims.width !== W || dims.height !== H) throw new Error(`PNG ${dims.width}x${dims.height}, expected ${W}x${H}`);
  return bytes;
}

function readManifest() {
  if (!fs.existsSync(manifestPath)) return null;
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return null; }
}

function writeManifest(m) {
  fs.writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n', 'utf8');
}

function writeParticleSmokeReview(m) {
  const cards = (m.frames || []).map(f => `<article><header><strong>#${String(f.frame).padStart(3, '0')}</strong><span>${f.time.toFixed(2)}s</span></header><a href="${f.file}" target="_blank" rel="noopener"><img src="${f.file}" alt="${f.file} ${f.time.toFixed(2)}s" loading="lazy"></a><p>${f.file} · ${f.bytes} B</p></article>`).join('\n');
  const samples = (m.samples || []).map(s => `<tr><td>${s.frame}</td><td>${s.time.toFixed(2)}s</td><td class="${s.all_equal ? 'ok' : 'bad'}">${s.all_equal ? 'PASS' : 'FAIL'}</td><td><code>${s.file_sha256}</code></td><td><code>${s.repeat_a_sha256}</code></td><td><code>${s.repeat_b_sha256}</code></td></tr>`).join('\n');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion Atlas · 粒子专项审片</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#eef2fc;font:17px/1.55 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1600px;margin:auto;padding:28px}h1{font-size:31px;margin:0 0 8px}p{color:#b9c6dd}
.meta{display:flex;gap:22px;flex-wrap:wrap;margin:14px 0 20px;color:#9fb0c9;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}article{background:#171f2e;border:1px solid #303d55;border-radius:12px;overflow:hidden}article header{display:flex;justify-content:space-between;padding:10px 14px;font-size:19px}article img{width:100%;display:block;aspect-ratio:16/9;object-fit:contain;background:#070a10}article p{padding:0 14px 9px;font-size:12px;color:#9fb0c9;word-break:break-all}
.note{background:#171f2e;border:1px solid #303d55;border-radius:12px;padding:14px 18px;margin:20px 0}.bad{color:#ffb4a2}.ok{color:#9fe3b0}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}th,td{border-bottom:1px solid #2a364a;padding:7px 6px;text-align:left}code{font-size:10px;color:#a8c7e8;word-break:break-all}
</style></head><body><main><h1>MA341-DEMO-001 · 粒子专项冒烟</h1><p>这是 <code>film.html</code> 的真实 Canvas 输出，不是诊断增亮图，也不是旧生产帧。逐帧检查粒子是否真的可见。</p>
<div class="meta"><span>source ${m.source_sha256}</span><span>timeline ${m.timeline_sha256}</span><span>${m.width}×${m.height} / ${m.fps}fps</span><span>${m.channel || 'chrome'}</span><span>${m.frames.length} frames</span></div>
<div class="note"><strong>必须逐项看：</strong> S01 #54 目标环是否有可辨认颗粒；S02 #90/#105/#120 拖尾是否沿运动方向；S03 #180 目标环/接触点；S04 #234 粒子保留；S05 #270/#300/#330 扫描/接触/溶解；S06 #381 幽灵齿轮是否不再只是虚线；S07 #438/#449 下划线。另看 #192/#195/#199 冻结是否无粒子突跳。</div>
<section class="grid">${cards}</section>
<div class="note"><h2 style="font-size:21px;margin:0 0 8px">双重渲染抽样</h2><p>本模式要求所有 ${m.samples.length} 个选中帧两次重渲 SHA 相同。</p><table><thead><tr><th>帧</th><th>时间</th><th>结果</th><th>首帧 SHA</th><th>重渲 A</th><th>重渲 B</th></tr></thead><tbody>${samples}</tbody></table></div>
</main></body></html>`;
  fs.writeFileSync(path.join(outDir, 'review.html'), html, 'utf8');
}

function writeParticleDiagnosticsReview(m) {
  const cards = (m.frames || []).map((f, idx) => {
    const prefix = `${f.target}_${String(f.frame).padStart(6, '0')}`;
    const st = f.stats;
    return `<article><header><strong>${f.target} #${f.frame}</strong><span>${f.time.toFixed(2)}s</span></header><div class="trio"><figure><img src="${prefix}_A.png"><figcaption>A normal</figcaption></figure><figure><img src="${prefix}_B.png"><figcaption>B particles off</figcaption></figure><figure><img src="${prefix}_C.png"><figcaption>C diff</figcaption></figure></div><p>ROI ${st.roi.width}×${st.roi.height} · diff pixels ${st.diff_pixels} · coverage ${(st.coverage * 100).toFixed(2)}% · mean ${st.mean_abs.toFixed(1)} · max ${st.max_abs}</p></article>`;
  }).join('\n');
  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>粒子贡献诊断</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#eef2fc;font:16px/1.5 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1600px;margin:auto;padding:26px}h1{font-size:30px;margin:0 0 8px}p{color:#b9c6dd}.meta{color:#9fb0c9;font-size:13px;margin:12px 0 18px;word-break:break-all}
.grid{display:grid;gap:16px}article{background:#171f2e;border:1px solid #303d55;border-radius:12px;overflow:hidden}article header{display:flex;justify-content:space-between;padding:10px 14px;font-size:18px}.trio{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;background:#303d55}figure{margin:0;background:#070a10}figure img{width:100%;display:block;aspect-ratio:16/9;object-fit:contain}figcaption{padding:6px 8px;font-size:12px;color:#9fb0c9}article p{padding:9px 14px;font-size:12px;color:#9fb0c9}
</style></head><body><main><h1>MA341 · 粒子贡献诊断</h1><p>A 是正常正式 Canvas；B 只关闭目标粒子层；C 是 A/B 像素差（红橙为差异）。C 仅诊断，不是正式帧。</p><div class="meta">source ${m.source_sha256} · timeline ${m.timeline_sha256} · ${m.width}×${m.height}</div><section class="grid">${cards}</section></main></body></html>`;
  fs.writeFileSync(path.join(outDir, 'review.html'), html, 'utf8');
}

async function runParticleDiagnostics(page, manifest) {
  fs.mkdirSync(outDir, { recursive: true });
  const activeMax = { S02: 0, S06: 0 };
  for (const item of DIAGNOSTIC_FRAMES) {
    const result = await page.evaluate(
      ({ t, target }) => window.__particleDiagCapture(t, target),
      { t: item.frame / FPS, target: item.target }
    );
    if (!result || !result.a || !result.b || !result.c || !result.stats || !result.stats.roi) {
      throw new Error(`diagnostic capture missing A/B/C/stats for ${item.target} #${item.frame}`);
    }
    if (result.stats.frame !== item.frame) throw new Error(`diagnostic frame mismatch ${result.stats.frame} != ${item.frame}`);
    const prefix = `${item.target}_${String(item.frame).padStart(6, '0')}`;
    const files = {};
    for (const key of ['a', 'b', 'c']) {
      if (typeof result[key] !== 'string' || !result[key].startsWith('data:image/png;base64,')) {
        throw new Error(`diagnostic ${prefix}_${key} is not a PNG data URL`);
      }
      const bytes = Buffer.from(result[key].split(',')[1], 'base64');
      const dims = pngDimensions(bytes);
      if (dims.width !== W || dims.height !== H) throw new Error(`diagnostic ${prefix}_${key} wrong size`);
      const file = `${prefix}_${key.toUpperCase()}.png`;
      fs.writeFileSync(path.join(outDir, file), bytes);
      files[key] = { file, bytes: bytes.length, sha256: sha(bytes) };
    }
    manifest.channel = manifest.channel || 'chrome';
    manifest.frames.push({
      frame: item.frame,
      time: +(item.frame / FPS).toFixed(6),
      target: item.target,
      files,
      stats: result.stats
    });
    activeMax[item.target] = Math.max(activeMax[item.target], result.stats.diff_pixels);
    console.log(`diag ${item.target} #${item.frame} diff=${result.stats.diff_pixels} coverage=${(result.stats.coverage * 100).toFixed(2)}%`);
    writeManifest(manifest);
  }
  if (activeMax.S02 <= 0) manifest.warnings.push('S02 has no frame with measurable particle contribution');
  if (activeMax.S06 <= 0) manifest.warnings.push('S06 has no frame with measurable particle contribution');
  const totalFiles = manifest.frames.reduce((n, f) => n + Object.keys(f.files || {}).length, 0);
  manifest.expected_files = DIAGNOSTIC_FRAMES.length * 3;
  manifest.exported_files = totalFiles;
  manifest.active_diff_max = activeMax;
  manifest.complete = manifest.frames.length === DIAGNOSTIC_FRAMES.length && totalFiles === DIAGNOSTIC_FRAMES.length * 3 && manifest.warnings.length === 0;
  writeManifest(manifest);
  writeParticleDiagnosticsReview(manifest);
  if (!manifest.complete) throw new Error('Particle diagnostics incomplete: ' + manifest.warnings.join('; '));
  console.log(`PASS particle diagnostics: ${manifest.frames.length} frames, ${totalFiles} A/B/C PNGs, ROI stats.`);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Review: ${path.join(outDir, 'review.html')}`);
}

async function main() {
  if (!fs.existsSync(htmlPath)) throw new Error(`Missing film.html: ${htmlPath}`);
  if (!fs.existsSync(timelinePath)) throw new Error(`Missing timeline.js: ${timelinePath}`);
  if (!fs.existsSync(playwrightPath)) throw new Error(`Missing playwright-core: ${playwrightPath}`);

  const sourceSha = sha(fs.readFileSync(htmlPath));
  const timelineSha = sha(fs.readFileSync(timelinePath));
  if (!isSmoke && !isParticleSmoke && !isDiagnostics && !resume && fs.existsSync(outDir)) {
    const existing = fs.readdirSync(outDir).filter(f => /^frame_\d{6}\.png$/.test(f));
    if (existing.length) {
      throw new Error(`frames/ already contains ${existing.length} picture-lock frames. Archive the failed run before a fresh 450-frame export; do not overwrite the FAIL evidence.`);
    }
  }
  if (isParticleSmoke && !tag && fs.existsSync(outDir)) {
    const existing = fs.readdirSync(outDir).filter(f => /^frame_\d{6}\.png$/.test(f));
    if (existing.length) {
      throw new Error(`particle-smoke/ already contains ${existing.length} frames. Use --tag=<version> to create a versioned particle-smoke-<version>/ directory; do not overwrite old evidence.`);
    }
  }
  if (isDiagnostics && !tag && fs.existsSync(outDir)) {
    const existing = fs.readdirSync(outDir).filter(f => /\.png$/.test(f));
    if (existing.length) {
      throw new Error(`particle-diagnostics/ already contains ${existing.length} PNGs. Use --tag=<version> to create a versioned diagnostic directory; do not overwrite old evidence.`);
    }
  }
  fs.mkdirSync(outDir, { recursive: true });

  const old = readManifest();
  if (resume && !old) throw new Error('--resume requires an existing manifest; refusing to mix unknown frames');
  if (resume && old && (old.source_sha256 !== sourceSha || old.timeline_sha256 !== timelineSha)) {
    throw new Error('Source/timeline changed since the existing manifest; refusing to mix old frames. Delete frames/ and manifest or rerender without --resume.');
  }

  const frames = isDiagnostics ? DIAGNOSTIC_FRAMES.map(x => x.frame) : isParticleSmoke ? PARTICLE_SMOKE_FRAMES.slice() : isSmoke ? SMOKE_FRAMES.slice() : Array.from({ length: TOTAL }, (_, i) => i);
  if (dryRun) {
    console.log(JSON.stringify({
      mode: isDiagnostics ? 'particle-diagnostics' : isParticleSmoke ? 'particle-smoke' : isSmoke ? 'smoke' : 'full',
      outDir,
      manifestPath,
      frames,
      diagnostics: isDiagnostics ? DIAGNOSTIC_FRAMES : undefined,
      particle_tag: isParticleSmoke ? (tag || null) : undefined,
      diagnostic_tag: isDiagnostics ? (tag || null) : undefined,
      source_sha256: sourceSha,
      timeline_sha256: timelineSha,
      guardBypassed: isParticleSmoke || isDiagnostics || isSmoke || resume
    }, null, 2));
    return;
  }
  const manifest = {
    project: 'MA341-DEMO-001',
    phase: 'final-picture-lock',
    mode: isDiagnostics ? 'particle-diagnostics' : isParticleSmoke ? 'particle-smoke' : isSmoke ? 'smoke' : 'full',
    source: htmlPath,
    source_sha256: sourceSha,
    timeline_sha256: timelineSha,
    channel: null,
    width: W,
    height: H,
    fps: FPS,
    duration: 15,
    expected_frames: frames.length,
    frames: [],
    samples: [],
    warnings: [],
    complete: false
  };

  const byFrame = new Map();
  if (resume && old) for (const f of old.frames || []) byFrame.set(f.frame, f);

  let browser;
  try {
    const opened = await openBrowser();
    browser = opened.browser;
    manifest.channel = opened.channel;

    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    const pageErrors = [];
    page.on('pageerror', e => pageErrors.push(String(e.message || e)));

    const url = new URL(pathToFileURL(htmlPath).href);
    url.searchParams.set('t', '0');
    await page.goto(url.href, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    await page.evaluate(async () => { if (document.fonts && document.fonts.ready) await document.fonts.ready; });
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

    const info = await page.evaluate(() => ({ w: document.querySelector('canvas').width, h: document.querySelector('canvas').height, seek: typeof window.__seek, diag: typeof window.__particleDiagCapture }));
    if (info.w !== W || info.h !== H || info.seek !== 'function') throw new Error(`Bad film page: ${JSON.stringify(info)}`);
    if (isDiagnostics) {
      if (info.diag !== 'function') throw new Error('film.html missing __particleDiagCapture');
      await runParticleDiagnostics(page, manifest);
      return;
    }

    console.log(`${isSmoke ? 'SMOKE' : 'FULL'} ${frames.length} frames → ${outDir}`);
    let count = 0;
    for (const frame of frames) {
      if (sha(fs.readFileSync(htmlPath)) !== sourceSha || sha(fs.readFileSync(timelinePath)) !== timelineSha) {
        throw new Error('Source changed during export; aborting to avoid mixed frames');
      }

      const file = frameName(frame);
      const filePath = path.join(outDir, file);
      if (resume && fs.existsSync(filePath) && byFrame.has(frame)) {
        const entry = byFrame.get(frame);
        const fileSha = sha(fs.readFileSync(filePath));
        if (entry.sha256 === fileSha && entry.bytes === fs.statSync(filePath).size) {
          manifest.frames.push(entry);
          count++;
          if (count % 30 === 0 || count === frames.length) console.log(`resume ${count}/${frames.length}`);
          continue;
        }
      }

      const bytes = await exportAt(page, frame);
      fs.writeFileSync(filePath, bytes);
      const entry = { frame, time: +(frame / FPS).toFixed(6), file, bytes: bytes.length, sha256: sha(bytes) };
      manifest.frames.push(entry);
      byFrame.set(frame, entry);
      count++;
      if (count % 30 === 0 || count === frames.length) console.log(`${count}/${frames.length} ${file} ${bytes.length}B`);
      if (count % 10 === 0) writeManifest(manifest);
    }

    // at least 15 sample frames re-rendered twice; particle smoke checks all selected frames
    const samples = isParticleSmoke ? frames.slice() : isSmoke ? frames.slice(0, Math.min(12, frames.length)) : sampleFrames();
    for (const frame of samples) {
      const filePath = path.join(outDir, frameName(frame));
      const fileBytes = fs.readFileSync(filePath);
      const fileSha = sha(fileBytes);
      const a = await exportAt(page, frame);
      const b = await exportAt(page, frame);
      const item = {
        frame,
        time: +(frame / FPS).toFixed(6),
        file_sha256: fileSha,
        repeat_a_sha256: sha(a),
        repeat_b_sha256: sha(b),
        all_equal: fileSha === sha(a) && sha(a) === sha(b)
      };
      manifest.samples.push(item);
      console.log(`sample ${frame} ${item.all_equal ? 'PASS' : 'FAIL'}`);
      if (!item.all_equal) manifest.warnings.push(`sample frame ${frame} differs between exports`);
    }

    if (pageErrors.length) manifest.warnings.push(...pageErrors.map(e => `pageerror: ${e}`));
    manifest.complete = manifest.frames.length === frames.length && manifest.warnings.length === 0;
    manifest.page_errors = pageErrors;
    writeManifest(manifest);
    if (isParticleSmoke) writeParticleSmokeReview(manifest);

    if (manifest.frames.length !== frames.length) throw new Error(`Only ${manifest.frames.length}/${frames.length} frames exported`);
    const minSamples = isParticleSmoke ? frames.length : isSmoke ? 1 : 15;
    if (manifest.samples.length < minSamples) throw new Error(`Fewer than ${minSamples} deterministic samples`);
    if (manifest.warnings.length) throw new Error('Export completed with warnings: ' + manifest.warnings.join('; '));

    console.log(`\nPASS ${frames.length} PNG frames, ${manifest.samples.length} double-render samples.`);
    console.log(`Manifest: ${manifestPath}`);
    if (isParticleSmoke) console.log(`Particle review: ${path.join(outDir, 'review.html')}`);
    console.log(isParticleSmoke ? 'Host: inspect particle-smoke/review.html before a production rerender.' : isSmoke ? 'Now run: node capture-frames.cjs' : 'Now run: powershell -ExecutionPolicy Bypass -File .\\encode-film.ps1');
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

main().catch(e => { console.error('BLOCKED: ' + (e.stack || e)); process.exitCode = 1; });
