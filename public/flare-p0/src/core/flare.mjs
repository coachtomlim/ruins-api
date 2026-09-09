/** Strict, data-only Flare 1.15 adapters. No source game events are executed. */
export function sections(text) {
  if (typeof text !== 'string' || text.length > 2_000_000) throw Error('Invalid Flare input');
  const out = []; let current = {name: '', entries: []}; out.push(current);
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    if (/^\[.*\]$/.test(line)) { current = {name: line.slice(1, -1), entries: []}; out.push(current); }
    else { const p = line.indexOf('='); current.entries.push(p < 0 ? ['', line] : [line.slice(0, p), line.slice(p + 1)]); }
  }
  return out;
}
export function parseMap(text) {
  const ss = sections(text), header = Object.fromEntries(ss.find(s => s.name === 'header')?.entries || []);
  const width = Number(header.width), height = Number(header.height);
  if (![width, height].every(n => Number.isInteger(n) && n > 0 && n <= 128)) throw Error('Map dimensions outside 1..128');
  if (header.orientation !== 'isometric') throw Error('Only isometric maps supported');
  const tileWidth = Number(header.tilewidth), tileHeight = Number(header.tileheight);
  if (!(tileWidth > 0 && tileHeight > 0)) throw Error('Invalid tile dimensions');
  const layers = ss.filter(s => s.name === 'layer').map(s => {
    const type = s.entries.find(([k]) => k === 'type')?.[1];
    const format = s.entries.find(([k]) => k === 'format')?.[1];
    if (format && format !== 'dec') throw Error('Only decimal tile data supported');
    const dataAt = s.entries.findIndex(([k]) => k === 'data');
    if (dataAt < 0) throw Error('Missing layer data');
    const values = [s.entries[dataAt][1], ...s.entries.slice(dataAt + 1).filter(([k]) => !k).map(([, v]) => v)]
      .join(',').split(',').filter(x => x.trim() !== '').map(Number);
    if (values.length !== width * height || values.some(n => !Number.isInteger(n) || n < 0)) throw Error(`Invalid ${type} layer dimensions`);
    return {type, data: values};
  });
  const collisionLayers = layers.filter(l => l.type === 'collision');
  if (collisionLayers.length !== 1) throw Error('Exactly one collision layer is required');
  if (collisionLayers[0].data.some(n => n > 6)) throw Error('Unsupported collision tile');
  return {width, height, tileWidth, tileHeight, tileset: header.tileset, layers, collision: collisionLayers[0].data};
}
export function parseTiles(text) {
  const tiles = {}, images = [];
  for (const s of sections(text)) {
    let image;
    for (const [k, v] of s.entries) {
      if (k === 'img') { image = v; if (!images.includes(v)) images.push(v); }
      if (k === 'tile') {
        const a = v.split(',').map(Number); if (a.length !== 7 || a.some(n => !Number.isFinite(n)) || !image) throw Error('Malformed tile definition');
        const [id, x, y, w, h, ox, oy] = a; tiles[id] = {image, x, y, w, h, ox, oy};
      }
    }
  }
  if (!images.length || !Object.keys(tiles).length) throw Error('Empty tileset');
  return {tiles, images};
}
export function parseAnimation(text) {
  let image; const animations = {};
  for (const s of sections(text)) {
    const vals = Object.fromEntries(s.entries.filter(([k]) => k !== 'frame'));
    if (vals.image) image = vals.image;
    if (!vals.frames) continue;
    const durationText = vals.duration || '800ms';
    const duration = parseFloat(durationText) / (durationText.endsWith('ms') ? 1000 : 1);
    const frames = Number(vals.frames), entries = {};
    for (const [k, v] of s.entries) if (k === 'frame') {
      const a = v.split(',').map(Number);
      if (a.length !== 8 || a.some(n => !Number.isFinite(n))) throw Error('Invalid packed animation frame');
      const [f, d, x, y, w, h, ox, oy] = a; entries[`${f}:${d}`] = {x, y, w, h, ox, oy};
    }
    if (!Object.keys(entries).length) throw Error('Only packed animations supported');
    animations[s.name] = {frames, duration, type: vals.type || 'looped', entries};
  }
  if (!image || !animations.stance) throw Error('Missing sprite image or stance');
  return {image, animations};
}
export function frameIndex(animation, elapsed) {
  const f = Math.floor(Math.max(0, elapsed) / Math.max(.001, animation.duration) * animation.frames);
  if (animation.type === 'play_once') return Math.min(animation.frames - 1, f);
  if (animation.type === 'back_forth') { const period = Math.max(1, animation.frames * 2 - 2), n = f % period; return n < animation.frames ? n : period - n; }
  return f % animation.frames;
}
