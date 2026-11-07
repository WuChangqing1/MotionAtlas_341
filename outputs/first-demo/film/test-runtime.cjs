'use strict';
/**
 * Runtime smoke without a browser: executes film.html's inline Canvas code against
 * a no-op Canvas mock. It cannot judge pixels; it catches undefined symbols,
 * broken state wiring and per-time runtime throws.
 */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const filmDir = __dirname;
const html = fs.readFileSync(path.join(filmDir, 'film.html'), 'utf8');
const m = html.match(/<script>\s*(\(\(\) => \{[\s\S]*?\}\)\(\);)\s*<\/script>/);
if (!m) throw new Error('could not extract inline film script');

function gradient() { return { addColorStop() {} }; }
function makeCtx(canvas) {
  const target = {
    canvas,
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    filter: 'none',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    strokeStyle: '#000',
    fillStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    shadowColor: 'transparent',
    shadowBlur: 0
  };
  return new Proxy(target, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => gradient();
      if (prop === 'measureText') return text => ({ width: String(text).length * 48 });
      if (prop === 'getImageData') return (x, y, w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h });
      if (prop === 'createImageData') return (w, h) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h });
      if (prop === 'createPattern') return () => ({});
      if (prop === 'getTransform') return () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });
      return () => {};
    },
    set(t, prop, value) { t[prop] = value; return true; }
  });
}
function makeCanvas(w = 300, h = 150) {
  const canvas = { width: w, height: h, style: {}, toDataURL: () => 'data:image/png;base64,iVBORw0KGgo=' };
  canvas.getContext = () => makeCtx(canvas);
  return canvas;
}

const mainCanvas = makeCanvas(1920, 1080);
const sandbox = {
  console,
  Math,
  URLSearchParams,
  document: {
    title: '',
    fonts: { ready: Promise.resolve(), status: 'loaded' },
    getElementById: id => (id === 'c' ? mainCanvas : null),
    createElement: tag => (tag === 'canvas' ? makeCanvas() : { style: {} })
  },
  location: { search: '?t=1.8' },
  window: {},
  requestAnimationFrame: cb => Promise.resolve().then(() => cb(0)),
  setTimeout,
  clearTimeout
};
sandbox.window.document = sandbox.document;
sandbox.window.location = sandbox.location;
sandbox.window.FILM_TIMELINE = require(path.join(filmDir, 'timeline.js'));
sandbox.window.window = sandbox.window;
sandbox.globalThis = sandbox.window;

vm.runInNewContext(m[1], sandbox, { filename: 'film-inline.js' });

async function main() {
  await new Promise(r => setImmediate(r));
  const w = sandbox.window;
  if (!w.__ready) throw new Error('window.__ready not set');
  if (typeof w.__seek !== 'function') throw new Error('window.__seek missing');
  const times = [0, 0.6, 1.8, 2.35, 3.1, 4.4, 5.5, 5.95, 6.4, 6.65, 7.8, 8.4, 8.6, 9.45, 10.4, 10.95, 11.15, 11.5, 12.3, 12.7, 13.2, 13.65, 14.3, 14.6, 14.9666666667];
  for (const t of times) {
    const s = w.__seek(t);
    if (Math.abs(s.t - t) > 1e-9) throw new Error(`seek returned wrong t: ${t} -> ${s.t}`);
  }
  // Same time twice must be deterministic at the state level; the mock cannot compare pixels.
  const a = JSON.stringify(w.__filmState(11.2));
  const b = JSON.stringify(w.__filmState(11.2));
  if (a !== b) throw new Error('state not deterministic at 11.2');
  const budget = w.__particleBudget;
  if (!budget || budget.S01 !== 500 || budget.S04 !== 1400 || budget.S05.scan !== 2600) {
    throw new Error('particle budget missing/mismatched: ' + JSON.stringify(budget));
  }
  if (typeof w.__particleDiagCapture !== 'function') throw new Error('__particleDiagCapture missing');
  const dg = w.__particleDiagCapture(3.5, 'S02');
  if (!dg || !dg.a || !dg.b || !dg.c || !dg.stats || !dg.stats.roi) throw new Error('diagnostic capture shape invalid');
  const f1 = w.__filmState(6.4), f2 = w.__filmState(6.5);
  const strip = x => { const o = { ...x }; delete o.t; delete o.frame; delete o.frozen; delete o.effectiveT; return JSON.stringify(o); };
  if (strip(f1) !== strip(f2)) throw new Error('S04 freeze visual state differs (mock state)');
  console.log(`PASS runtime mock: ${times.length} seeks, ready=true, no throw; freeze state equal; budget OK`);
}

main().catch(e => { console.error('FAIL', e && e.stack || e); process.exit(1); });
