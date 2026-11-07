/* Minimal store-only ZIP writer. No external CDN, valid UTF-8 names. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.MotionAtlasZip = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const enc = new TextEncoder();
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function bytes(data) {
    if (data instanceof Uint8Array) return data;
    if (data instanceof ArrayBuffer) return new Uint8Array(data);
    if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    return enc.encode(String(data ?? ''));
  }
  function u16(v) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, v, true); return b; }
  function u32(v) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); return b; }
  function concat(parts) {
    let total = 0; for (const p of parts) total += p.length;
    const out = new Uint8Array(total); let off = 0;
    for (const p of parts) { out.set(p, off); off += p.length; }
    return out;
  }
  function buildZipBytes(entries) {
    const local = [], central = [];
    let offset = 0;
    for (const entry of entries) {
      const name = enc.encode(entry.name);
      const data = bytes(entry.data);
      const crc = crc32(data);
      const head = concat([
        u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0)
      ]);
      local.push(head, name, data);
      central.push({ name, crc, size: data.length, offset });
      offset += head.length + name.length + data.length;
    }
    const cdStart = offset;
    const cdParts = [];
    for (const c of central) {
      const h = concat([
        u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21),
        u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(c.offset)
      ]);
      cdParts.push(h, c.name);
    }
    const cd = concat(cdParts);
    const eocd = concat([
      u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length),
      u32(cd.length), u32(cdStart), u16(0)
    ]);
    return concat([...local, cd, eocd]);
  }
  function createZip(entries) {
    return new Blob([buildZipBytes(entries)], { type: 'application/zip' });
  }
  return { buildZipBytes, createZip, crc32 };
});
