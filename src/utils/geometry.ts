// ---------- Isometric / dimetric projection math for the 3D map ----------

export interface MapState {
  yaw: number; // rotation around vertical axis (radians)
  pitch: number; // 0..1 vertical exaggeration (higher = see more walls)
  zoom: number;
  panX: number;
  panY: number;
}

export const DEFAULT_MAP: MapState = { yaw: -0.55, pitch: 0.42, zoom: 0.82, panX: 0, panY: 0 };

export const GRID = 34; // 34 x 34 cells, each cell = 25 m

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Project grid coords + elevation (meters, +up) to screen pixels. */
export function project(gx: number, gy: number, z: number, s: MapState): [number, number] {
  const c = Math.cos(s.yaw);
  const si = Math.sin(s.yaw);
  const rx = gx * c - gy * si;
  const ry = gx * si + gy * c;
  const S = s.zoom * 13;
  const x = (rx - ry) * S + s.panX;
  const y = (rx + ry) * S * 0.5 - z * s.zoom * (0.55 + s.pitch * 1.05) + s.panY;
  return [x, y];
}

/** Depth key for painter's-algorithm sorting (far first = ascending). */
export function depthKey(gx: number, gy: number, s: MapState): number {
  const c = Math.cos(s.yaw);
  const si = Math.sin(s.yaw);
  return gx * (c + si) + gy * (c - si);
}

export function toPath(pts: Array<[number, number]>): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ' Z';
}

/** Project a list of (gx, gy, z) tuples. */
export function projPts(pts: Array<[number, number, number]>, s: MapState): Array<[number, number]> {
  return pts.map(([gx, gy, z]) => project(gx, gy, z, s));
}

export function rectCorners(x: number, y: number, w: number, d: number): Array<[number, number, number]> {
  return [
    [x, y, 0],
    [x + w, y, 0],
    [x + w, y + d, 0],
    [x, y + d, 0],
  ];
}

/** Extrude a footprint into wall quads + top face, painter-sorted (far walls first), + top last. */
export function extrude(
  x: number,
  y: number,
  w: number,
  d: number,
  h: number,
  s: MapState,
  base = 0,
): { walls: Array<{ pts: Array<[number, number]>; depth: number; edge: string }>; top: Array<[number, number]> } {
  const corners: Array<[number, number]> = [
    [x, y],
    [x + w, y],
    [x + w, y + d],
    [x, y + d],
  ];
  const walls = corners.map((p, i) => {
    const q = corners[(i + 1) % 4];
    const b0 = project(p[0], p[1], base, s);
    const b1 = project(q[0], q[1], base, s);
    const t0 = project(p[0], p[1], base + h, s);
    const t1 = project(q[0], q[1], base + h, s);
    const depth = (depthKey(p[0], p[1], s) + depthKey(q[0], q[1], s)) / 2;
    return {
      pts: [b0, b1, t1, t0] as Array<[number, number]>,
      depth,
      edge: `${p[0]},${p[1]}|${q[0]},${q[1]}`,
    };
  });
  walls.sort((a, b) => b.depth - a.depth); // far first
  const top = projPts(
    corners.map(([gx, gy]) => [gx, gy, base + h] as [number, number, number]),
    s,
  );
  return { walls, top };
}

export function pointInPoly(px: number, py: number, poly: Array<[number, number]>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
