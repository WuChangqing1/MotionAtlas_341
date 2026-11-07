'use strict';
/**
 * Build a side-by-side comparison: accepted stills vs picture-lock frames
 * at the same six time points. Run on the Windows host after capture-frames.cjs.
 */
const fs = require('node:fs');
const path = require('node:path');

const filmDir = __dirname;
const stillDir = path.join(filmDir, '..', 'stills');
const framesDir = path.join(filmDir, 'frames');
const outPath = path.join(filmDir, 'still-compare.html');

const items = [
  { shot: 'S01', t: 1.80, frame: 54, still: 'S01_01.80s.png' },
  { shot: 'S03', t: 6.00, frame: 180, still: 'S03_06.00s.png' },
  { shot: 'S04', t: 7.80, frame: 234, still: 'S04_07.80s.png' },
  { shot: 'S05', t: 11.20, frame: 336, still: 'S05_11.20s.png' },
  { shot: 'S06', t: 12.70, frame: 381, still: 'S06_12.70s.png' },
  { shot: 'S07', t: 14.60, frame: 438, still: 'S07_14.60s.png' }
];

for (const x of items) {
  const a = path.join(stillDir, x.still);
  const b = path.join(framesDir, `frame_${String(x.frame).padStart(6, '0')}.png`);
  if (!fs.existsSync(a)) throw new Error('Missing still: ' + a);
  if (!fs.existsSync(b)) throw new Error('Missing film frame: ' + b);
}

const cards = items.map(x => {
  const f = `frame_${String(x.frame).padStart(6, '0')}.png`;
  return `<article><header><strong>${x.shot}</strong><span>${x.t.toFixed(2)}s</span></header>
<div class="pair"><figure><img src="../stills/${x.still}" alt="${x.shot} accepted still"><figcaption>STILL PASS · ${x.still}</figcaption></figure>
<figure><img src="frames/${f}" alt="${x.shot} film frame"><figcaption>FILM · ${f}</figcaption></figure></div>
<p>对比重点：主体位置、印章文字、标签避让、粒子层、纸面材质。连续镜头的取景可与静帧略有差异，但不可出现跳位、裁字或画风断裂。</p></article>`;
}).join('\n');

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Motion Atlas · STILL vs FILM</title><style>
*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#eef2fc;font:16px/1.55 system-ui,"Microsoft YaHei",sans-serif}main{max-width:1600px;margin:auto;padding:28px}h1{font-size:30px;margin:0 0 8px}p{color:#b9c6dd}
.grid{display:grid;gap:18px;margin-top:22px}article{background:#171f2e;border:1px solid #303d55;border-radius:12px;overflow:hidden;padding-bottom:10px}
article header{display:flex;justify-content:space-between;padding:12px 16px;font-size:20px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#303d55}
figure{margin:0;background:#0a0f17}figure img{width:100%;display:block;aspect-ratio:16/9;object-fit:contain}figcaption{padding:8px 12px;font-size:13px;color:#9fb0c9;word-break:break-all}
article p{padding:0 16px;font-size:14px;color:#b9c6dd}@media(max-width:760px){.pair{grid-template-columns:1fr}}
</style></head><body><main><h1>MA341-DEMO-001 · STILL vs FILM</h1>
<p>左：已通过 STILL 验收的六张 PNG。右：picture-lock 在相同时间点的真实帧。用于检查连续动画是否继承静帧质量；取景差异需有合理镜头运动解释。</p>
<section class="grid">${cards}</section></main></body></html>`;

fs.writeFileSync(outPath, html, 'utf8');
console.log(`Still comparison: ${outPath}`);
