'use strict';
/**
 * Build the picture-lock contact sheet from frame-manifest.json.
 * Run on the Windows host after capture-frames.cjs.
 */
const fs = require('node:fs');
const path = require('node:path');

const filmDir = __dirname;
const framesDir = path.join(filmDir, 'frames');
const manifestPath = path.join(filmDir, 'frame-manifest.json');
const outPath = path.join(filmDir, 'contact-sheet.html');
const timeline = require(path.join(filmDir, 'timeline.js'));

if (!fs.existsSync(manifestPath)) throw new Error('Missing frame-manifest.json; run capture-frames.cjs first');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
if (manifest.complete !== true) throw new Error('frame-manifest.json is not complete');
if (!Array.isArray(manifest.frames) || manifest.frames.length !== 450) throw new Error('Expected 450 frames in manifest');

const byFrame = new Map(manifest.frames.map(f => [f.frame, f]));
const sceneAt = t => timeline.sceneAt(t);
const eventsAt = t => timeline.EVENTS.filter(e => Math.abs(e.at - t) < 1 / 60 || (e.at <= t && e.at > t - 2 / 30));

const pick = new Set();
// every 15 frames
for (let i = 0; i < 450; i += 15) pick.add(i);
pick.add(449);
// scene boundaries, both sides
for (const s of timeline.SCENES) {
  for (const b of [s.start, s.end]) {
    const f = Math.round(b * 30);
    for (let d = -2; d <= 2; d++) if (f + d >= 0 && f + d < 450) pick.add(f + d);
  }
}
// important events, key frame and neighbours
for (const e of timeline.EVENTS) {
  const f = Math.round(e.at * 30);
  for (let d = -2; d <= 2; d++) if (f + d >= 0 && f + d < 450) pick.add(f + d);
}

const frames = Array.from(pick).sort((a, b) => a - b);
const missing = [];
for (const f of frames) {
  const name = `frame_${String(f).padStart(6, '0')}.png`;
  if (!fs.existsSync(path.join(framesDir, name))) missing.push(name);
}
if (missing.length) throw new Error('Missing selected frames: ' + missing.slice(0, 10).join(', '));

const cards = frames.map(f => {
  const t = f / 30;
  const name = `frame_${String(f).padStart(6, '0')}.png`;
  const sc = sceneAt(t);
  const near = timeline.EVENTS.filter(e => Math.abs(e.at - t) <= 3 / 30).map(e => e.id).join(' ');
  return `<article><header><strong>#${String(f).padStart(3, '0')}</strong><span>${t.toFixed(2)}s · ${sc.id}</span></header><a href="frames/${name}" target="_blank" rel="noopener"><img src="frames/${name}" alt="${name} ${t.toFixed(2)}s" loading="lazy"></a><p>${name}${near ? ' · ' + near : ''}</p></article>`;
}).join('\n');

const sampleRows = (manifest.samples || []).map(s => `<tr><td>${s.frame}</td><td>${s.time.toFixed(2)}s</td><td>${s.all_equal ? 'PASS' : 'FAIL'}</td><td><code>${s.file_sha256}</code></td><td><code>${s.repeat_a_sha256}</code></td><td><code>${s.repeat_b_sha256}</code></td></tr>`).join('\n');

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion Atlas · 450 帧接触表</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#eef2fc;font:17px/1.55 system-ui,"Microsoft YaHei",sans-serif}
main{max-width:1600px;margin:auto;padding:28px}h1{font-size:32px;margin:0 0 6px}p{color:#b9c6dd}.meta{display:flex;gap:24px;flex-wrap:wrap;margin:16px 0 24px;color:#9fb0c9;font-size:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:16px}article{background:#171f2e;border:1px solid #303d55;border-radius:12px;overflow:hidden}
article header{display:flex;justify-content:space-between;padding:10px 14px;font-size:19px}article img{width:100%;display:block;aspect-ratio:16/9;object-fit:contain;background:#070a10}
article p{padding:0 14px 8px;font-size:13px;color:#9fb0c9;word-break:break-all}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:13px}th,td{border-bottom:1px solid #2a364a;padding:7px 6px;text-align:left}code{font-size:11px;color:#a8c7e8;word-break:break-all}
.warn{color:#ffb4a2}.note{background:#171f2e;border:1px solid #303d55;border-radius:12px;padding:14px 18px;margin:22px 0}
</style></head><body><main>
<h1>MA341-DEMO-001《完成之后》· 450 帧接触表</h1>
<p>自动抽取每 15 帧、镜头边界两侧与重要事件邻帧。接触表只用于定位问题，不能替代连续播放与人工审片。</p>
<div class="meta"><span>source ${manifest.source_sha256}</span><span>timeline ${manifest.timeline_sha256}</span><span>${manifest.width}×${manifest.height} / ${manifest.fps}fps / 450f</span><span>${manifest.channel || 'chrome'}</span></div>
<div class="note warn">本页无音轨：这是 picture-lock（无声画锁）。动作、文字、粒子与镜头需人工连续播放验收；接触表不能证明动作连续。</div>
<section class="grid">${cards}</section>
<div class="note"><h2 style="font-size:21px;margin:0 0 8px">双重渲染抽样</h2><p>${manifest.samples.length} 帧两次重渲并与首帧比较；全部 PASS 才能编码。</p>
<table><thead><tr><th>帧</th><th>时间</th><th>结果</th><th>首帧 SHA</th><th>重渲 A</th><th>重渲 B</th></tr></thead><tbody>${sampleRows}</tbody></table></div>
</main></body></html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`Contact sheet: ${outPath}`);
console.log(`Selected ${frames.length} frames from 450; samples ${manifest.samples.length}; all_equal=${(manifest.samples || []).every(s => s.all_equal)}`);
