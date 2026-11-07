/* MotionAtlas MA341-DEMO-001 — pure timeline core.
 * No DOM, no Canvas, no Date.now, no Math.random.
 * Usable from film.html (window.FILM_TIMELINE) and Node tests (module.exports).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FILM_TIMELINE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FPS = 30;
  const DURATION = 15;
  const FRAMES = 450;
  const W = 1920;
  const H = 1080;

  const SCENES = [
    { id: 'S01', start: 0.0, end: 2.0 },
    { id: 'S02', start: 2.0, end: 4.4 },
    { id: 'S03', start: 4.4, end: 6.4 },
    { id: 'S04', start: 6.4, end: 8.4 },
    { id: 'S05', start: 8.4, end: 11.5 },
    { id: 'S06', start: 11.5, end: 13.6 },
    { id: 'S07', start: 13.6, end: 15.0 }
  ];

  const EVENTS = [
    { id: 'E01', scene: 'S01', at: 0.60, role: 'wash_arrives' },
    { id: 'E02', scene: 'S01', at: 1.65, role: 'task_ink_lands' },
    { id: 'E03', scene: 'S02', at: 2.35, role: 'arm_enters' },
    { id: 'E04', scene: 'S02', at: 3.10, role: 'gripper_closes' },
    { id: 'E05', scene: 'S02', at: 4.20, role: 'gear_lifts' },
    { id: 'E06', scene: 'S03', at: 5.50, role: 'gear_seats' },
    { id: 'E07', scene: 'S03', at: 5.95, role: 'false_done_stamp' },
    { id: 'E08', scene: 'S03', at: 6.30, role: 'gap_first_visible' },
    { id: 'E09', scene: 'S04', at: 6.65, role: 'inspection_freeze_ends' },
    { id: 'E10', scene: 'S04', at: 7.55, role: 'spec_ghost_gathers' },
    { id: 'E11', scene: 'S04', at: 8.20, role: 'caliper_gap' },
    { id: 'E12', scene: 'S05', at: 8.60, role: 'scan_starts' },
    { id: 'E13', scene: 'S05', at: 9.05, role: 'position_evidence' },
    { id: 'E14', scene: 'S05', at: 9.45, role: 'rotation_evidence' },
    { id: 'E15', scene: 'S05', at: 9.85, role: 'contact_evidence' },
    { id: 'E16', scene: 'S05', at: 10.95, role: 'false_stamp_dissolves' },
    { id: 'E17', scene: 'S05', at: 11.15, role: 'fail_seal' },
    { id: 'E18', scene: 'S05', at: 11.35, role: 'vlm_label' },
    { id: 'E19', scene: 'S06', at: 11.75, role: 'correction_path' },
    { id: 'E20', scene: 'S06', at: 12.70, role: 'ghost_gear_locks' },
    { id: 'E21', scene: 'S06', at: 13.20, role: 'gripper_reenters' },
    { id: 'E22', scene: 'S07', at: 13.65, role: 'closing_line_begins' },
    { id: 'E23', scene: 'S07', at: 14.30, role: 'particle_settles' },
    { id: 'E24', scene: 'S07', at: 14.40, role: 'correction_subline' }
  ];

  const CAM_KEYS = [
    { t: 0.0, cx: 960, cy: 540, z: 1.00 },
    { t: 2.0, cx: 930, cy: 560, z: 1.06 },
    { t: 4.4, cx: 1000, cy: 620, z: 1.00 },
    { t: 6.4, cx: 1000, cy: 620, z: 1.00 },
    { t: 6.65, cx: 1000, cy: 620, z: 1.00 },
    { t: 7.8, cx: 870, cy: 830, z: 1.35 },
    { t: 8.4, cx: 860, cy: 840, z: 1.40 },
    { t: 8.7, cx: 960, cy: 620, z: 1.18 },
    { t: 9.0, cx: 960, cy: 600, z: 1.05 },
    { t: 11.5, cx: 960, cy: 540, z: 1.00 },
    { t: 13.6, cx: 960, cy: 560, z: 0.92 },
    { t: 15.0, cx: 960, cy: 540, z: 0.90 }
  ];

  const ARM_KEYS = [
    { t: 2.0, base: [1500, 262], elbow: [1600, 320], wrist: [1680, 380], tip: [1720, 420], a: 0.0 },
    { t: 2.4, base: [1500, 262], elbow: [1450, 340], wrist: [1490, 470], tip: [1460, 570], a: 1.0 },
    { t: 3.1, base: [1500, 262], elbow: [1380, 360], wrist: [1400, 520], tip: [1415, 610], a: 1.0 },
    { t: 4.0, base: [1500, 262], elbow: [1330, 380], wrist: [1250, 480], tip: [1180, 540], a: 1.0 },
    { t: 4.6, base: [1500, 262], elbow: [1300, 400], wrist: [1150, 520], tip: [1050, 580], a: 1.0 },
    { t: 5.2, base: [1500, 262], elbow: [1280, 430], wrist: [1080, 560], tip: [980, 620], a: 1.0 },
    { t: 5.8, base: [1500, 262], elbow: [1320, 380], wrist: [1180, 480], tip: [1120, 520], a: 1.0 },
    { t: 6.2, base: [1500, 262], elbow: [1340, 352], wrist: [1230, 458], tip: [1175, 500], a: 1.0 },
    { t: 6.4, base: [1500, 262], elbow: [1340, 352], wrist: [1230, 458], tip: [1175, 500], a: 0.0 },
    { t: 6.5, base: [1500, 262], elbow: [1340, 352], wrist: [1230, 458], tip: [1175, 500], a: 0.0 },
    { t: 12.8, base: [1500, 262], elbow: [1340, 352], wrist: [1230, 458], tip: [1175, 500], a: 0.0 },
    { t: 13.2, base: [1500, 262], elbow: [1380, 330], wrist: [1290, 405], tip: [1240, 455], a: 0.9 },
    { t: 15.0, base: [1500, 262], elbow: [1380, 330], wrist: [1290, 405], tip: [1240, 455], a: 0.9 }
  ];

  const FREEZE = { start: 6.4, end: 6.65, at: 6.4 };

  const PARTICLE_BUDGET = {
    S01: 500,
    S02: 300,
    S03: { ring: 400, contact: 80 },
    S04: 1400,
    S05: { scan: 2600, contact: 1800, dissolve: 900 },
    S06: { ghost: 1800, path: 600 },
    S07: 600
  };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function clamp01(v) { return clamp(v, 0, 1); }
  function lerp(a, b, u) { return a + (b - a) * u; }
  function invLerp(a, b, v) { return b === a ? 0 : clamp01((v - a) / (b - a)); }
  function rndRange(r, a, b) { return a + (b - a) * r(); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function smoothstep(a, b, v) {
    if (a === b) return v >= b ? 1 : 0;
    const x = clamp01((v - a) / (b - a));
    return x * x * (3 - 2 * x);
  }
  function lerpPoint(p, q, u) { return [lerp(p[0], q[0], u), lerp(p[1], q[1], u)]; }

  function cameraAt(t) {
    const tt = clamp(t, 0, DURATION);
    let i = 0;
    while (i < CAM_KEYS.length - 2 && tt > CAM_KEYS[i + 1].t) i++;
    const a = CAM_KEYS[i], b = CAM_KEYS[i + 1];
    const u = smoothstep(a.t, b.t, tt);
    return { cx: lerp(a.cx, b.cx, u), cy: lerp(a.cy, b.cy, u), z: lerp(a.z, b.z, u) };
  }

  function effectiveTime(t) {
    const tt = clamp(t, 0, DURATION);
    return (tt >= FREEZE.start && tt < FREEZE.end) ? FREEZE.at : tt;
  }

  function ticketAlpha(t) {
    if (t < 6.15) return 1;
    if (t < 6.35) return 1 - smoothstep(6.15, 6.35, t);
    if (t < 8.95) return 0;
    if (t < 9.2) return smoothstep(8.95, 9.2, t);
    return 1;
  }

  function gearAt(t) {
    if (t < 3.1) return { x: 1420, y: 660, angle: 0, u: 0 };
    if (t < 5.2) {
      const a = armAt(t);
      const u = smoothstep(3.1, 5.2, t);
      // keep the gear visually attached to the gripper
      const ox = lerp(5, -25, u);
      const oy = lerp(50, 25, u);
      return {
        x: a.tip[0] + ox,
        y: a.tip[1] + oy,
        angle: (-23 * Math.PI / 180) * smoothstep(4.4, 5.2, t),
        u
      };
    }
    if (t < 5.5) {
      const a52 = armAt(5.2).tip;
      const q = smoothstep(5.2, 5.5, t);
      return {
        x: lerp(a52[0] - 25, 955, q),
        y: lerp(a52[1] + 25, 645, q),
        angle: -23 * Math.PI / 180,
        u: 1
      };
    }
    return { x: 955, y: 645, angle: -23 * Math.PI / 180, u: 1 };
  }

  function armAt(t) {
    const tt = clamp(t, ARM_KEYS[0].t, ARM_KEYS[ARM_KEYS.length - 1].t);
    let i = 0;
    while (i < ARM_KEYS.length - 2 && tt > ARM_KEYS[i + 1].t) i++;
    const a = ARM_KEYS[i], b = ARM_KEYS[i + 1];
    const u = smoothstep(a.t, b.t, tt);
    return {
      base: lerpPoint(a.base, b.base, u),
      elbow: lerpPoint(a.elbow, b.elbow, u),
      wrist: lerpPoint(a.wrist, b.wrist, u),
      tip: lerpPoint(a.tip, b.tip, u),
      alpha: lerp(a.a, b.a, u)
    };
  }

  function ghostGearPoints(cx, cy, count, seed) {
    const r = mulberry32(seed);
    const pts = [];
    const step = Math.PI * 2 / 12;
    for (let i = 0; i < count; i++) {
      const sector = Math.floor(r() * 12);
      const kind = r();
      const center = (sector + 0.5) * step;
      let a, rr;
      if (kind < 0.55) {
        // separated tooth caps, outside the real gear's maximum radius
        a = center + (r() - .5) * 0.40 * step;
        rr = 166 + r() * 6;
      } else if (kind < 0.90) {
        // left/right radial tooth flanks: one fixed side angle per sample
        const side = r() < .5 ? -1 : 1;
        a = center + side * (0.32 + (r() - .5) * 0.04) * step;
        rr = 156 + r() * 12;
      } else {
        // sparse root connection, still outside the solid gear body
        a = center + (r() - .5) * 0.36 * step;
        rr = 152 + r() * 8;
      }
      pts.push({
        x: cx + Math.cos(a) * rr,
        y: cy + Math.sin(a) * rr,
        s: rndRange(r, 2.2, 4.2),
        a: rndRange(r, .50, .85),
        c: r() > .72 ? 'gold' : (r() > .90 ? 'rust' : 'ivory')
      });
    }
    return pts;
  }

  function doneStampAlpha(t) {
    if (t < 5.95) return 0;
    if (t < 6.3) return 0.94;
    if (t < 6.4) return lerp(0.94, 0.58, smoothstep(6.3, 6.4, t));
    if (t < 8.4) return 0.58;
    if (t < 8.8) return lerp(0.58, 0.12, smoothstep(8.4, 8.8, t));
    if (t < 10.95) return 0.12;
    if (t < 11.15) return lerp(0.12, 0, smoothstep(10.95, 11.15, t));
    return 0;
  }

  function failStampAlpha(t) {
    if (t < 11.15) return 0;
    return 0.97;
  }

  function gapAlpha(t) {
    if (t < 6.25) return 0;
    if (t < 6.4) return smoothstep(6.25, 6.4, t);
    return 1;
  }

  function specGhostAlpha(t) {
    if (t < 7.3) return 0;
    if (t < 7.9) return smoothstep(7.3, 7.9, t);
    if (t < 8.4) return 1;
    if (t < 8.8) return lerp(1, 0.35, smoothstep(8.4, 8.8, t));
    if (t < 11.5) return 0.35;
    if (t < 11.8) return lerp(0.35, 0, smoothstep(11.5, 11.8, t));
    return 0;
  }

  function caliperAlpha(t) {
    if (t < 7.1) return 0;
    if (t < 7.5) return smoothstep(7.1, 7.5, t);
    if (t < 8.2) return 1;
    if (t < 8.4) return 1 - smoothstep(8.2, 8.4, t);
    return 0;
  }

  function scanAt(t) {
    if (t < 8.6 || t > 10.4) return { x: -80, a: 0 };
    const u = (t - 8.6) / 1.8;
    return { x: lerp(-80, 2000, u), a: 1 };
  }

  function panelAlpha(t) {
    if (t < 8.9) return 0;
    if (t < 9.05) return smoothstep(8.9, 9.05, t);
    if (t < 11.5) return 1;
    if (t < 11.8) return 1 - smoothstep(11.5, 11.8, t);
    return 0;
  }

  function rowAlpha(t, i) {
    const at = [9.05, 9.45, 9.85][i];
    if (t < at) return 0;
    return smoothstep(at, at + 0.25, t);
  }

  function particleLayersAt(t) {
    return {
      S01: t < 2.0 ? PARTICLE_BUDGET.S01 : 0,
      S02: (t >= 2.8 && t < 4.4) ? PARTICLE_BUDGET.S02 : 0,
      S03ring: (t >= 4.4 && t < 6.4) ? PARTICLE_BUDGET.S03.ring : 0,
      S03contact: (t >= 4.4 && t < 6.4) ? PARTICLE_BUDGET.S03.contact : 0,
      S04: (t >= 6.4 && t < 8.4) ? PARTICLE_BUDGET.S04 : 0,
      S05scan: (t >= 8.6 && t <= 10.4) ? PARTICLE_BUDGET.S05.scan : 0,
      S05contact: (t >= 9.7 && t < 11.8) ? PARTICLE_BUDGET.S05.contact : 0,
      S05dissolve: (t >= 10.95 && t < 11.5) ? PARTICLE_BUDGET.S05.dissolve : 0,
      S06ghost: t >= 12.3 ? PARTICLE_BUDGET.S06.ghost : 0,
      S06path: t >= 12.3 ? PARTICLE_BUDGET.S06.path : 0,
      S07: t >= 14.05 ? PARTICLE_BUDGET.S07 : 0
    };
  }

  function contactAlpha(t) {
    if (t < 9.7) return 0;
    if (t < 10.4) return smoothstep(9.7, 10.4, t);
    if (t < 11.5) return 1;
    if (t < 11.8) return 1 - smoothstep(11.5, 11.8, t);
    return 0;
  }

  function correctionAlpha(t) {
    if (t < 11.75) return 0;
    if (t < 12.3) return smoothstep(11.75, 12.3, t);
    if (t < 13.6) return 0.95;
    return lerp(0.95, 0.55, smoothstep(13.6, 14.2, t));
  }

  function ghostGearAlpha(t) {
    if (t < 12.3) return 0;
    if (t < 12.7) return smoothstep(12.3, 12.7, t);
    return 1;
  }

  function correctionLabelAlpha(t) {
    if (t < 11.9) return 0;
    if (t < 12.4) return smoothstep(11.9, 12.4, t);
    if (t < 13.6) return 1;
    return lerp(1, 0.78, smoothstep(13.6, 14.2, t));
  }

  function closingAt(t) {
    return {
      line: t < 13.65 ? 0 : smoothstep(13.65, 13.85, t),
      neq: t < 13.95 ? 0 : smoothstep(13.95, 14.05, t),
      underline: t < 14.05 ? 0 : smoothstep(14.05, 14.30, t),
      subline: t < 14.40 ? 0 : smoothstep(14.40, 14.60, t)
    };
  }

  function darkAt(t) {
    if (t < 8.4) return 1;
    if (t < 9.0) return lerp(1, 0.62, smoothstep(8.4, 9.0, t));
    if (t < 11.5) return 0.62;
    if (t < 11.8) return lerp(0.62, 1, smoothstep(11.5, 11.8, t));
    return 1;
  }

  function headerAt(t) {
    return {
      s04: smoothstep(6.65, 6.9, t) * (1 - smoothstep(8.2, 8.4, t)),
      s05: smoothstep(8.5, 8.8, t) * (1 - smoothstep(11.35, 11.5, t)),
      s06: smoothstep(11.55, 11.8, t) * (1 - smoothstep(13.6, 13.8, t))
    };
  }

  function sceneAt(t) {
    const tt = clamp(t, 0, DURATION - 1e-9);
    return SCENES.find(s => tt >= s.start && tt < s.end) || SCENES[SCENES.length - 1];
  }

  function stateAt(t) {
    const tt = clamp(t, 0, DURATION);
    const ft = effectiveTime(tt);
    return {
      t: tt,
      frame: Math.round(tt * FPS),
      frozen: tt >= FREEZE.start && tt < FREEZE.end,
      effectiveT: ft,
      scene: sceneAt(ft),
      camera: cameraAt(ft),
      ticketAlpha: ticketAlpha(ft),
      gear: gearAt(ft),
      arm: armAt(ft),
      doneStampAlpha: doneStampAlpha(ft),
      failStampAlpha: failStampAlpha(ft),
      gapAlpha: gapAlpha(ft),
      specGhostAlpha: specGhostAlpha(ft),
      caliperAlpha: caliperAlpha(ft),
      scan: scanAt(ft),
      panelAlpha: panelAlpha(ft),
      rowAlpha: [rowAlpha(ft, 0), rowAlpha(ft, 1), rowAlpha(ft, 2)],
      contactAlpha: contactAlpha(ft),
      correctionAlpha: correctionAlpha(ft),
      ghostGearAlpha: ghostGearAlpha(ft),
      correctionLabelAlpha: correctionLabelAlpha(ft),
      closing: closingAt(ft),
      dark: darkAt(ft),
      header: headerAt(ft),
      particles: particleLayersAt(ft)
    };
  }

  return {
    FPS, DURATION, FRAMES, W, H,
    SCENES, EVENTS, CAM_KEYS, ARM_KEYS, FREEZE, PARTICLE_BUDGET,
    clamp, clamp01, lerp, smoothstep, invLerp, effectiveTime,
    cameraAt, ticketAlpha, gearAt, armAt, ghostGearPoints, particleLayersAt,
    doneStampAlpha, failStampAlpha, gapAlpha, specGhostAlpha, caliperAlpha,
    scanAt, panelAlpha, rowAlpha, contactAlpha,
    correctionAlpha, ghostGearAlpha, correctionLabelAlpha,
    closingAt, darkAt, headerAt, sceneAt, stateAt
  };
});
