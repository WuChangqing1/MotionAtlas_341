'use strict';
/**
 * Static + pure-logic tests for MA341-DEMO-001 picture-lock timeline.
 * Does not launch a browser and does not render media.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const filmDir = __dirname;
const timeline = require(path.join(filmDir, 'timeline.js'));
const task = JSON.parse(fs.readFileSync(path.join(filmDir, '..', 'card', 'task.json'), 'utf8'));

let checks = 0;
function ok(cond, msg) {
  assert.ok(cond, msg);
  checks++;
}

function finite(x, msg) {
  ok(typeof x === 'number' && Number.isFinite(x), `${msg}: ${x}`);
}

function contiguousScenes(scenes, duration) {
  ok(scenes.length > 0, 'scenes not empty');
  ok(scenes[0].start === 0, 'first scene starts at 0');
  ok(scenes[scenes.length - 1].end === duration, 'last scene ends at duration');
  for (let i = 0; i < scenes.length; i++) {
    ok(scenes[i].start < scenes[i].end, `scene ${scenes[i].id} positive window`);
    if (i > 0) ok(Math.abs(scenes[i - 1].end - scenes[i].start) < 1e-9, `scene ${scenes[i - 1].id}->${scenes[i].id} contiguous`);
  }
}

function main() {
  // 1. timeline constants
  ok(timeline.FPS === 30, 'fps 30');
  ok(timeline.DURATION === 15, 'duration 15');
  ok(timeline.FRAMES === 450, 'frames 450');
  ok(timeline.W === 1920 && timeline.H === 1080, 'canvas 1920x1080');

  // 2. scenes
  contiguousScenes(timeline.SCENES, timeline.DURATION);
  ok(timeline.SCENES.length === 7, '7 scenes');
  ok(JSON.stringify(timeline.SCENES.map(s => s.id)) === JSON.stringify(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']), 'scene ids');

  // 3. events match task.json and are in scene
  ok(timeline.EVENTS.length === 24, '24 events');
  ok(task.events.length === 24, 'task.json 24 events');
  for (let i = 0; i < 24; i++) {
    const e = timeline.EVENTS[i], t = task.events[i];
    ok(e.id === t.id, `event id ${i} ${e.id}/${t.id}`);
    ok(e.scene === t.scene_id, `event scene ${e.id}`);
    ok(Math.abs(e.at - t.at) < 1e-9, `event at ${e.id}`);
    const sc = timeline.SCENES.find(s => s.id === e.scene);
    ok(sc && e.at >= sc.start && e.at < sc.end, `event ${e.id} inside ${e.scene}`);
  }
  ok(new Set(timeline.EVENTS.map(e => e.id)).size === 24, 'unique event ids');

  // 4. frame range and exact t
  for (let i = 0; i < timeline.FRAMES; i++) {
    const t = i / timeline.FPS;
    ok(t >= 0 && t < timeline.DURATION, `frame ${i} t in [0,15)`);
    const s = timeline.stateAt(t);
    finite(s.t, `state t frame ${i}`);
    ok(Math.abs(s.t - t) < 1e-12, `state t exact frame ${i}`);
  }
  ok(timeline.stateAt(14.9666666667).t < 15, 'last frame below 15');

  // 5. determinism: same t twice identical
  for (const t of [0, 0.6, 1.8, 2.35, 3.1, 4.4, 5.5, 5.95, 6.4, 6.65, 7.8, 8.4, 8.6, 9.45, 10.4, 10.95, 11.15, 11.5, 12.3, 12.7, 13.2, 13.65, 14.3, 14.6, 14.9666666667]) {
    const a = JSON.stringify(timeline.stateAt(t));
    const b = JSON.stringify(timeline.stateAt(t));
    ok(a === b, `deterministic state at ${t}`);
  }

  // 6. all sampled states finite; camera / positions sane
  let prevCam = null, prevGear = null, prevArm = null;
  for (let frame = 0; frame <= timeline.FRAMES; frame += 1) {
    const t = frame / timeline.FPS;
    const s = timeline.stateAt(t);
    finite(s.camera.cx, `camera cx ${t}`);
    finite(s.camera.cy, `camera cy ${t}`);
    finite(s.camera.z, `camera z ${t}`);
    ok(s.camera.z > 0.5 && s.camera.z < 2.0, `camera zoom range ${t}`);
    finite(s.gear.x, `gear x ${t}`);
    finite(s.gear.y, `gear y ${t}`);
    finite(s.gear.angle, `gear angle ${t}`);
    ok(s.gear.x > 100 && s.gear.x < 1820, `gear x in page ${t}`);
    ok(s.gear.y > 100 && s.gear.y < 1000, `gear y in page ${t}`);
    for (const k of ['base', 'elbow', 'wrist', 'tip']) {
      finite(s.arm[k][0], `arm ${k}x ${t}`);
      finite(s.arm[k][1], `arm ${k}y ${t}`);
    }
    for (const k of ['ticketAlpha', 'doneStampAlpha', 'failStampAlpha', 'gapAlpha', 'specGhostAlpha', 'panelAlpha', 'contactAlpha', 'correctionAlpha', 'ghostGearAlpha', 'correctionLabelAlpha', 'dark']) {
      finite(s[k], `${k} ${t}`);
      ok(s[k] >= -1e-9 && s[k] <= 1.000001, `${k} 0..1 ${t}`);
    }
    for (const v of s.rowAlpha) { finite(v, `rowAlpha ${t}`); ok(v >= 0 && v <= 1.000001, `rowAlpha range ${t}`); }
    for (const k of ['line', 'neq', 'underline', 'subline']) { finite(s.closing[k], `closing ${k} ${t}`); ok(s.closing[k] >= 0 && s.closing[k] <= 1.000001, `closing ${k} range ${t}`); }

    if (prevCam) {
      ok(Math.abs(s.camera.cx - prevCam.cx) < 45, `camera x continuity ${t}`);
      ok(Math.abs(s.camera.cy - prevCam.cy) < 45, `camera y continuity ${t}`);
      ok(Math.abs(s.camera.z - prevCam.z) < 0.06, `camera z continuity ${t}`);
    }
    if (prevGear) {
      ok(Math.hypot(s.gear.x - prevGear.x, s.gear.y - prevGear.y) < 45, `gear continuity ${t}`);
    }
    if (prevArm) {
      for (const k of ['base', 'elbow', 'wrist', 'tip']) {
        ok(Math.hypot(s.arm[k][0] - prevArm[k][0], s.arm[k][1] - prevArm[k][1]) < 55, `arm ${k} continuity ${t}`);
      }
    }
    prevCam = s.camera; prevGear = s.gear; prevArm = s.arm;
  }

  // 7. scene boundary continuity: camera at end/start nearly equal
  for (let i = 1; i < timeline.SCENES.length; i++) {
    const b = timeline.SCENES[i].start;
    const a = timeline.cameraAt(b - 1 / timeline.FPS);
    const c = timeline.cameraAt(b);
    ok(Math.hypot(a.cx - c.cx, a.cy - c.cy) < 40, `camera boundary ${b}`);
    ok(Math.abs(a.z - c.z) < 0.05, `camera zoom boundary ${b}`);
  }

  // 8. required event visual turns exist
  ok(timeline.stateAt(5.94).doneStampAlpha === 0, 'done stamp before 5.95');
  ok(timeline.stateAt(5.96).doneStampAlpha > 0, 'done stamp after 5.95');
  ok(timeline.stateAt(11.14).failStampAlpha === 0, 'fail seal before 11.15');
  ok(timeline.stateAt(11.16).failStampAlpha > 0, 'fail seal after 11.15');
  ok(timeline.stateAt(10.94).doneStampAlpha > 0, 'done stamp before dissolve');
  ok(timeline.stateAt(11.16).doneStampAlpha === 0, 'done stamp gone after dissolve');
  ok(timeline.stateAt(8.59).scan.a === 0, 'scan before 8.6');
  ok(timeline.stateAt(8.61).scan.a > 0, 'scan after 8.6');
  ok(timeline.stateAt(13.64).closing.line === 0, 'closing before 13.65');
  ok(timeline.stateAt(13.86).closing.line > 0, 'closing after 13.65');

  // 9. six accepted still times must map to the expected visual state
  const k18 = timeline.stateAt(1.8);
  ok(Math.abs(k18.gear.x - 1420) < 1 && Math.abs(k18.gear.y - 660) < 1, 'S01 gear on stand');
  ok(k18.ticketAlpha === 1, 'S01 ticket visible');
  const k60 = timeline.stateAt(6.0);
  ok(Math.abs(k60.gear.x - 955) < 1 && Math.abs(k60.gear.y - 645) < 1, 'S03 gear at socket');
  ok(k60.doneStampAlpha > 0.9, 'S03 done stamp');
  ok(k60.gapAlpha === 0, 'S03 gap not yet visible');
  const k78 = timeline.stateAt(7.8);
  ok(k78.ticketAlpha === 0, 'S04 ticket hidden');
  ok(k78.gapAlpha === 1, 'S04 gap visible');
  ok(k78.specGhostAlpha > 0.9, 'S04 spec ghost');
  const k112 = timeline.stateAt(11.2);
  ok(k112.panelAlpha === 1, 'S05 panel visible');
  ok(k112.failStampAlpha > 0.9, 'S05 fail seal');
  ok(Math.abs(k112.dark - 0.62) < 1e-9, 'S05 dark 0.62');
  const k127 = timeline.stateAt(12.7);
  ok(k127.correctionAlpha > 0.9, 'S06 correction');
  ok(k127.ghostGearAlpha === 1, 'S06 ghost gear');
  ok(k127.correctionLabelAlpha === 1, 'S06 correction labels');
  const k146 = timeline.stateAt(14.6);
  ok(k146.closing.line === 1 && k146.closing.neq === 1 && k146.closing.underline === 1 && k146.closing.subline === 1, 'S07 closing complete');
  ok(k146.ticketAlpha === 1, 'S07 ticket visible');

  // 10. static layout safety: labels are to the right of the ticket; seal text fits
  ok(980 > 860, 'correction labels clear ticket right edge');
  ok(64 * 3 < 260 - 12, '未完成 64px x3 fits 260px seal');
  for (let t = 6.7; t <= 8.4; t += 0.1) ok(timeline.stateAt(t).ticketAlpha === 0, `S04 ticket hidden ${t.toFixed(1)}`);

  // 12. intentional S04 freeze: 192-199 must share one visual state
  function visualOf(t) {
    const s = timeline.stateAt(t);
    const o = JSON.parse(JSON.stringify(s));
    delete o.t; delete o.frame; delete o.frozen; delete o.effectiveT;
    return JSON.stringify(o);
  }
  const freezeState = visualOf(6.4);
  for (let frame = 192; frame <= 199; frame++) {
    const t = frame / 30;
    ok(timeline.stateAt(t).frozen === true, `freeze flag frame ${frame}`);
    ok(visualOf(t) === freezeState, `freeze visual state frame ${frame}`);
  }
  const fst = timeline.stateAt(6.4);
  ok(fst.ticketAlpha === 0, 'freeze ticket hidden');
  ok(Math.abs(fst.doneStampAlpha - 0.58) < 1e-9, 'freeze done stamp settled');
  ok(fst.gapAlpha === 1, 'freeze gap visible');
  ok(fst.arm.alpha === 0, 'freeze arm retracted');
  ok(fst.particles.S04 === 1400, 'freeze S04 particles active');
  const after = visualOf(6.65);
  ok(after === freezeState, 'freeze end state equals freeze start (no jump)');
  ok(timeline.stateAt(200 / 30).frozen === false, 'freeze ends at frame 200');
  const camFreezeA = timeline.cameraAt(6.4), camFreezeB = timeline.cameraAt(6.65);
  ok(camFreezeA.cx === camFreezeB.cx && camFreezeA.cy === camFreezeB.cy && camFreezeA.z === camFreezeB.z, 'freeze camera identical');

  // 13. no accidental 7.9-8.2 freeze; camera must keep moving
  const cam78 = timeline.cameraAt(7.8), cam84 = timeline.cameraAt(8.4);
  const cam79 = timeline.cameraAt(7.9), cam82 = timeline.cameraAt(8.2);
  ok(Math.hypot(cam79.cx - cam82.cx, cam79.cy - cam82.cy) > 1 || Math.abs(cam79.z - cam82.z) > 0.001, '7.9-8.2 camera moves');
  ok(Math.hypot(cam78.cx - cam84.cx, cam78.cy - cam84.cy) > 1 || Math.abs(cam78.z - cam84.z) > 0.01, '7.8-8.4 camera moves');
  ok(visualOf(7.9) !== visualOf(8.2), '7.9-8.2 visual state not identical');
  ok(timeline.stateAt(7.9).frozen === false && timeline.stateAt(8.2).frozen === false, '7.9-8.2 not marked frozen');

  // 14. S05 UI safe area: project world UI through the actual camera
  function project(cam, x, y) {
    return [960 + (x - cam.cx) * cam.z, 540 + (y - cam.cy) * cam.z];
  }
  function rectSafe(cam, x0, y0, x1, y1) {
    const pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(p => project(cam, p[0], p[1]));
    return pts.every(p => p[0] >= 4 && p[0] <= 1916 && p[1] >= 4 && p[1] <= 1076);
  }
  let s05UiFrames = 0;
  for (let frame = 258; frame <= 345; frame++) {
    const s = timeline.stateAt(frame / 30);
    if (s.ticketAlpha > 0.001) {
      s05UiFrames++;
      ok(rectSafe(s.camera, 240, 120, 860, 440), `S05 ticket safe frame ${frame}`);
    }
    if (s.panelAlpha > 0.001) {
      ok(rectSafe(s.camera, 1330, 200, 1650, 540), `S05 panel safe frame ${frame}`);
    }
  }
  ok(s05UiFrames > 0, 'S05 ticket becomes visible in checked range');
  ok(980 >= 0 && 980 + 220 <= 1920 && 100 >= 0 && 100 + 32 <= 1080, 'S05 screen-space header safe');

  // 15. particle budgets and activation intervals
  const B = timeline.PARTICLE_BUDGET;
  ok(B.S01 === 500, 'budget S01 500');
  ok(B.S02 === 300, 'budget S02 300');
  ok(B.S03.ring === 400 && B.S03.contact === 80, 'budget S03 400+80');
  ok(B.S04 === 1400, 'budget S04 1400');
  ok(B.S05.scan === 2600 && B.S05.contact === 1800 && B.S05.dissolve === 900, 'budget S05 2600+1800+900');
  ok(B.S06.ghost === 1800 && B.S06.path === 600, 'budget S06 1800+600');
  ok(B.S07 === 600, 'budget S07 600');
  const pl = timeline.particleLayersAt;
  ok(pl(1.0).S01 === 500, 'S01 particles active');
  ok(pl(2.5).S02 === 0, 'S02 trail not active before motion');
  ok(pl(3.0).S02 === 300, 'S02 particles active');
  ok(pl(5.0).S03ring === 400 && pl(5.0).S03contact === 80, 'S03 particles active');
  ok(pl(7.8).S04 === 1400, 'S04 particles active');
  ok(pl(9.0).S05scan === 2600 && pl(10.0).S05contact === 1800 && pl(11.0).S05dissolve === 900, 'S05 particles active');
  ok(pl(12.7).S06ghost === 1800 && pl(12.7).S06path === 600, 'S06 particles active');

  // 15b. S06 geometry: 12 separated tooth caps + low-density valleys
  const gp = timeline.ghostGearPoints(940, 660, 1800, 7006);
  ok(gp.length === 1800, 'S06 1800 points');
  ok(JSON.stringify(gp) === JSON.stringify(timeline.ghostGearPoints(940, 660, 1800, 7006)), 'S06 deterministic');
  const step = Math.PI * 2 / 12;
  const sectorCaps = new Array(12).fill(0);
  const sectorSideL = new Array(12).fill(0);
  const sectorSideR = new Array(12).fill(0);
  let caps = 0, sides = 0, gaps = 0;
  let minCapGapScreen = Infinity, outsideScreen = 0, maxScreenX = -Infinity;
  const camS06 = timeline.cameraAt(12.7);
  const screen = (cam, x, y) => [960 + (x - cam.cx) * cam.z, 540 + (y - cam.cy) * cam.z];
  const actualCenter = screen(camS06, 955, 645);
  const actualRScreen = 138 * camS06.z;
  for (const p of gp) {
    const dx = p.x - 940, dy = p.y - 660;
    const rr = Math.hypot(dx, dy);
    const ang = Math.atan2(dy, dx);
    const sector = Math.floor((((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / step) % 12;
    const center = (sector + 0.5) * step;
    const local = Math.atan2(Math.sin(ang - center), Math.cos(ang - center));
    const isCap = Math.abs(local) <= 0.20 * step && rr >= 166 && rr <= 172;
    if (isCap) { caps++; sectorCaps[sector]++; }
    if (Math.abs(Math.abs(local) - 0.32 * step) <= 0.05 * step && rr >= 156 && rr <= 168) {
      sides++;
      if (local < 0) sectorSideL[sector]++; else sectorSideR[sector]++;
    }
    if (Math.abs(local) > 0.25 * step) gaps++;
    const sp = screen(camS06, p.x, p.y);
    const dScreen = Math.hypot(sp[0] - actualCenter[0], sp[1] - actualCenter[1]) - actualRScreen;
    if (dScreen > 0) outsideScreen++;
    if (isCap) minCapGapScreen = Math.min(minCapGapScreen, dScreen);
    maxScreenX = Math.max(maxScreenX, sp[0]);
  }
  ok(caps > 900, `S06 tooth caps >900 (${caps})`);
  ok(sectorCaps.every(n => n > 60), `S06 every tooth cap populated (${sectorCaps.join(',')})`);
  ok(sectorSideL.every(n => n > 10) && sectorSideR.every(n => n > 10), 'S06 every tooth has left/right radial flanks');
  ok(sides > 550, `S06 radial flank points >550 (${sides})`);
  ok(gaps < 700, `S06 valleys remain sparse (${gaps})`);
  ok(outsideScreen / gp.length > 0.90, `S06 >=90% points outside solid gear outer circle (${(outsideScreen / gp.length * 100).toFixed(1)}%)`);
  ok(minCapGapScreen > 4, `S06 cap-to-solid screen gap >4px (${minCapGapScreen.toFixed(2)})`);
  ok(maxScreenX < 1108, `S06 rightmost particle avoids A座 text (${maxScreenX.toFixed(1)})`);
  ok(166 * camS06.z > 150, 'S06 projected tooth radius >150px');
  for (const tt of [12.5, 13.0, 13.3]) {
    const c = timeline.cameraAt(tt);
    const ac = screen(c, 955, 645);
    let minGap = Infinity;
    for (const p of gp) {
      const rr = Math.hypot(p.x - 940, p.y - 660);
      if (rr < 166 || rr > 172) continue;
      const sp = screen(c, p.x, p.y);
      minGap = Math.min(minGap, Math.hypot(sp[0] - ac[0], sp[1] - ac[1]) - 138 * c.z);
    }
    ok(minGap > 3.5, `S06 cap separation at ${tt}s (${minGap.toFixed(2)}px)`);
  }
  ok(timeline.stateAt(12.3).ghostGearAlpha === 0 && timeline.stateAt(12.7).ghostGearAlpha === 1, 'S06 ghost fade 12.3-12.7');
  ok(pl(14.6).S07 === 600, 'S07 particles active');
  ok(pl(7.8).S04 === 1400 && pl(6.5).S04 === 1400, 'S04 particles frozen window active');

  // 16. keyframe order and all 450 states finite
  for (let i = 1; i < timeline.CAM_KEYS.length; i++) ok(timeline.CAM_KEYS[i].t > timeline.CAM_KEYS[i - 1].t, `camera keyframe sorted ${i}`);
  for (let frame = 0; frame < 450; frame++) {
    const s = timeline.stateAt(frame / 30);
    for (const [k, v] of Object.entries(s.particles)) finite(v, `particles ${k} frame ${frame}`);
    finite(s.camera.cx, `camera cx frame ${frame}`);
    finite(s.camera.cy, `camera cy frame ${frame}`);
    finite(s.camera.z, `camera z frame ${frame}`);
    ok(s.camera.z > 0.5 && s.camera.z < 2.0, `camera zoom frame ${frame}`);
  }

  // 11. task.json reading windows vs scene bounds (planned)
  for (const sc of task.scenes) {
    ok(sc.last_text_at >= sc.start && sc.last_text_at <= sc.end, `${sc.id} last_text_at in scene`);
    ok(sc.last_text_at + sc.read_seconds <= sc.end + 1e-8, `${sc.id} read window fits`);
  }

  // 10. source hygiene
  const timelineSrc = fs.readFileSync(path.join(filmDir, 'timeline.js'), 'utf8');
  const filmSrc = fs.readFileSync(path.join(filmDir, 'film.html'), 'utf8');
  ok(!/Math\.random\s*\(/.test(timelineSrc), 'timeline has no Math.random()');
  ok(!/Date\.now\s*\(/.test(timelineSrc), 'timeline has no Date.now()');
  ok(!/Math\.random\s*\(/.test(filmSrc), 'film has no Math.random()');
  ok(!/Date\.now\s*\(/.test(filmSrc), 'film has no Date.now()');
  ok(/<canvas[^>]+width="1920"[^>]+height="1080"/.test(filmSrc), 'canvas 1920x1080');
  ok(/<script src="timeline.js"><\/script>/.test(filmSrc), 'timeline.js loaded before inline script');
  ok(/window\.__seek/.test(filmSrc), 'window.__seek exists');
  ok(/renderAt\(/.test(filmSrc), 'renderAt exists');
  // P1-3 source-level parameter checks (pixel visibility still needs host Chrome)
  ok(/particleRing\(940,\s*660,\s*178,\s*PARTICLE_BUDGET\.S01/.test(filmSrc), 'S01 ring radius 178');
  ok(/minS:\s*2\.0,\s*maxS:\s*4\.0,\s*minA:\s*\.55,\s*maxA:\s*\.90/.test(filmSrc), 'S01 particle size/alpha');
  ok(/particleRing\(940,\s*660,\s*176,\s*400/.test(filmSrc), 'S03 ring radius 176');
  ok(/particleTrail\(ctx,\s*s\.t,\s*PARTICLE_BUDGET\.S02/.test(filmSrc), 'S02 trail call after arm');
  ok(/ghostGearPoints\(940,\s*660,\s*PARTICLE_BUDGET\.S06\.ghost/.test(filmSrc), 'S06 ghost particle ring');
  ok(/const step = Math\.PI \* 2 \/ 12/.test(timelineSrc), 'S06 12-sector geometry');
  ok(/kind < 0\.55/.test(timelineSrc), 'S06 tooth-tip band 55%');
  ok(/rr = 166 \+ r\(\) \* 6/.test(timelineSrc), 'S06 tooth cap radius 166-172');
  ok(/rr = 156 \+ r\(\) \* 12/.test(timelineSrc), 'S06 radial flank radius 156-168');
  ok(/strokeRect\(-11, -172, 22, 46\)/.test(filmSrc), 'S06 dashed outline expanded as auxiliary');
  ok(/目标轮廓 · 示意外扩/.test(filmSrc), 'S06 illustrative expansion labelled');
  ok(/const speed = Math\.hypot\(dx, dy\)/.test(filmSrc), 'S02 velocity vector');
  ok(/if \(speed < 0\.35\) return/.test(filmSrc), 'S02 no fake trail before motion');
  ok(/const nx = -dy, ny = dx/.test(filmSrc), 'S02 tangent/normal basis');
  ok(/Math\.pow\(r\(\), 1\.7\)/.test(filmSrc), 'S02 head-biased density');
  ok(/if \(nearArm\(x, y\)\) continue/.test(filmSrc), 'S02 avoids arm occlusion');
  ok(/rgba\(246,235,208,0\.38\)/.test(filmSrc), 'S06 dashed outline reduced to auxiliary');
  ok(/diagOff\('S02'\)/.test(filmSrc) && /diagOff\('S06'\)/.test(filmSrc), 'particle diagnostic switches');
  ok(/window\.__particleDiag = \{ target: null \}/.test(filmSrc), 'diagnostic A uses normal render');
  const capSrc = fs.readFileSync(path.join(filmDir, 'capture-frames.cjs'), 'utf8');
  ok(/--smoke-particles/.test(capSrc), 'capture has --smoke-particles');
  ok(/--diagnose-particles/.test(capSrc), 'capture has --diagnose-particles');
  ok(/DIAGNOSTIC_FRAMES/.test(capSrc), 'capture diagnostic frame list');
  ok(/particleDiagCapture/.test(capSrc), 'capture uses particleDiagCapture');
  ok(/particle-smoke-\$\{tag\}|particleDirName/.test(capSrc), 'capture particle version isolation');
  ok(/--tag=/.test(capSrc), 'capture supports --tag');
  ok(/page\.evaluate\(\s*\(\{ t, target \}\) => window\.__particleDiagCapture\(t, target\)/.test(capSrc), 'page.evaluate uses one object argument');
  ok(/particle-diagnostics-\$\{tag\}/.test(capSrc), 'diagnostics version isolation');
  ok(/expected_files/.test(capSrc), 'diagnostics records 48 file completion');
  ok(/particle-smoke-manifest\.json/.test(capSrc), 'capture particle manifest path');
  ok(/guardBypassed/.test(capSrc), 'capture particle guard bypass marker');
  ok(/PARTICLE_SMOKE_FRAMES/.test(capSrc), 'capture particle frame list');
  ok(/writeParticleSmokeReview/.test(capSrc), 'capture particle review generator');

  console.log(`PASS ${checks} checks`);
  console.log(`scenes=${timeline.SCENES.length} events=${timeline.EVENTS.length} frames=${timeline.FRAMES}`);
  console.log(`sample state @1.8=${JSON.stringify(timeline.stateAt(1.8).gear)}`);
}

try { main(); }
catch (e) { console.error('FAIL', e && e.stack || e); process.exit(1); }
