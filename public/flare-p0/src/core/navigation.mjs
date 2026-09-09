/** Grid positions are continuous tile coordinates. Cell (x,y) has centre (x+.5,y+.5). */
export const groundWalkable = value => value === 0 || value === 5 || value === 6;
export class Navigation {
  constructor(map) { this.map = map; this.width = map.width; this.height = map.height; }
  open(x, y, occupied = new Set()) {
    return Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < this.width && y < this.height &&
      groundWalkable(this.map.collision[y * this.width + x]) && !occupied.has(y * this.width + x);
  }
  id(p) { return Math.floor(p.y) * this.width + Math.floor(p.x); }
  /** Disc/AABB test prevents the hero's feet, not just their centre, clipping walls. */
  clearAt(p, radius = .22) {
    if (![p.x, p.y, radius].every(Number.isFinite) || radius < 0) return false;
    for (let y = Math.floor(p.y - radius); y <= Math.floor(p.y + radius); y++)
      for (let x = Math.floor(p.x - radius); x <= Math.floor(p.x + radius); x++) if (!this.open(x, y)) {
        const dx = p.x - Math.max(x, Math.min(x + 1, p.x)), dy = p.y - Math.max(y, Math.min(y + 1, p.y));
        if (dx * dx + dy * dy <= radius * radius + 1e-10) return false;
      }
    return true;
  }
  /** Swept segment test using exact segment versus radius-expanded blocked cells. Conservative at corners. */
  segment(a, b, radius = .22) {
    if (!this.clearAt(a, radius) || !this.clearAt(b, radius)) return false;
    const dx = b.x - a.x, dy = b.y - a.y;
    for (let y = Math.floor(Math.min(a.y, b.y) - radius); y <= Math.floor(Math.max(a.y, b.y) + radius); y++)
      for (let x = Math.floor(Math.min(a.x, b.x) - radius); x <= Math.floor(Math.max(a.x, b.x) + radius); x++) if (!this.open(x, y)) {
        let lo = 0, hi = 1;
        for (const [origin, delta, min, max] of [[a.x, dx, x - radius, x + 1 + radius], [a.y, dy, y - radius, y + 1 + radius]]) {
          if (Math.abs(delta) < 1e-12) { if (origin < min || origin > max) { lo = 2; break; } }
          else { const t1 = (min - origin) / delta, t2 = (max - origin) / delta; lo = Math.max(lo, Math.min(t1, t2)); hi = Math.min(hi, Math.max(t1, t2)); }
        }
        if (lo <= hi) return false;
      }
    return true;
  }
  /** A*, stable tie ordering, eight neighbours, no diagonal corner cutting. No path means null. */
  path(start, goal, occupied = new Set()) {
    const sx = Math.floor(start.x), sy = Math.floor(start.y), gx = Math.floor(goal.x), gy = Math.floor(goal.y);
    if (!this.clearAt(start) || !this.open(gx, gy, occupied) || !this.clearAt(goal)) return null;
    const first = sy * this.width + sx, end = gy * this.width + gx;
    if (first === end) return this.segment(start, goal) ? [goal] : null;
    const scores = new Map([[first, 0]]), parents = new Map(), closed = new Set();
    const heuristic = (x, y) => { const dx = Math.abs(x - gx), dy = Math.abs(y - gy); return 10 * Math.max(dx, dy) + 4 * Math.min(dx, dy); };
    const queue = [{id: first, x: sx, y: sy, g: 0, f: heuristic(sx, sy)}];
    const dirs = [[0,-1],[1,0],[0,1],[-1,0],[1,-1],[1,1],[-1,1],[-1,-1]];
    let expansions = 0;
    while (queue.length && expansions++ <= this.width * this.height * 8) {
      queue.sort((a,b) => a.f - b.f || a.id - b.id); const node = queue.shift();
      if (closed.has(node.id)) continue;
      if (node.id === end) {
        const path = []; let id = end;
        while (id !== first) { path.push({x: id % this.width + .5, y: Math.floor(id / this.width) + .5}); id = parents.get(id); }
        path.reverse();
        // Correct from any fractional start back to its own safe centre before following cell edges.
        const centre = {x: sx + .5, y: sy + .5};
        if (!this.segment(start, path[0])) path.unshift(centre);
        if (!this.segment(start, path[0])) return null;
        path[path.length - 1] = goal; return path;
      }
      closed.add(node.id);
      for (const [dx, dy] of dirs) {
        const x = node.x + dx, y = node.y + dy, id = y * this.width + x;
        if (!this.open(x, y, occupied) || closed.has(id)) continue;
        if (dx && dy && (!this.open(node.x + dx, node.y, occupied) || !this.open(node.x, node.y + dy, occupied))) continue;
        const g = node.g + (dx && dy ? 14 : 10);
        if (g >= (scores.get(id) ?? Infinity)) continue;
        scores.set(id, g); parents.set(id, node.id); queue.push({id, x, y, g, f: g + heuristic(x,y)});
      }
    }
    return null;
  }
  approach(start, target, range, occupied) {
    let best = null, bestLength = Infinity;
    const r = Math.ceil(range);
    for (let y = Math.floor(target.y) - r; y <= Math.floor(target.y) + r; y++)
      for (let x = Math.floor(target.x) - r; x <= Math.floor(target.x) + r; x++) {
        const p = {x:x+.5, y:y+.5};
        if (Math.hypot(p.x-target.x, p.y-target.y) > range || !this.open(x,y,occupied) || !this.segment(p,target,.01)) continue;
        const path = this.path(start,p,occupied); if (!path) continue;
        let distance = 0, prev = start;
        for (const step of path) { distance += Math.hypot(step.x-prev.x,step.y-prev.y); prev=step; }
        if (distance < bestLength) { best=path; bestLength=distance; }
      }
    return best;
  }
}
