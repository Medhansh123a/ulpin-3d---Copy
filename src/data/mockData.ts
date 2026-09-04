// ---------- Deterministic demo data layer ----------
// Everything here is SIMULATED demo data for a simulated New Delhi — Rohini Sector 5.
// No real cadastral or survey data is represented.

import type {
  AiDetection,
  Building,
  Conflict,
  Parcel,
  PropertyType,
  Unit,
  UtilityLine,
  UtilityNode,
  UtilityType,
} from '../types';
import { buildUlpin } from '../utils/ulpin';

export const CELL = 25; // meters per grid cell
export const GRID = 34;

// ---------- deterministic RNG ----------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260903);

const pick = <T,>(arr: T[]): T => arr[Math.floor(rng() * arr.length)];

// ULPIN base fields for the demo jurisdiction
const COUNTRY = 'IN';
const STATE = 'DL';
const DISTRICT = 'NWD';
const BASE_E = 704100; // simulated local easting near Rohini Sector 5
const BASE_N = 3180600; // simulated local northing near Rohini Sector 5
const ELEV_BASE = 214; // illustrative ground elevation in metres // mean ground elevation (m, from simulated DEM)

const ZONE_A = 'R5'; // residential pockets
const ZONE_B = 'CC'; // commercial corridor
const ZONE_C = 'MX'; // mixed-use / institutional
const ZONE_D = 'PK'; // parks / civic
const ZONE_U = 'UT'; // underground utility corridor

function base34(n: number): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (n < chars.length) return chars[n];
  return base34(Math.floor(n / chars.length)) + chars[n % chars.length];
}

// ---------- parcels ----------
// 4 district blocks (A..D), each split into 2x2 parcels of 4x4 cells.
interface ParcelGen {
  id: string;
  block: string;
  zone: string;
  landUse: string;
  gx: number;
  gy: number;
  gw: number;
  gd: number;
  owner: string;
  rights: Parcel['rights'];
}

const LAND_USE: Record<string, string> = {
  R5: 'Residential',
  CC: 'Commercial Core',
  MX: 'Mixed Residential / Mixed Use',
  PK: 'Parks / Civic',
};

const OWNERS = [
  'Delhi Development Authority (Demo Record)',
  'Rohini Residential Cooperative (Demo Record)',
  'North West Delhi Property Trust (Demo Record)',
  'Rohini Sector 5 Commercial Association (Demo Record)',
  'Delhi Urban Infrastructure Group (Demo Record)',
  'Civic Facilities Division — Demo Record',
  'Rohini Apartment Owners Association (Demo Record)',
];

const parcelsGen: ParcelGen[] = [];
for (let bx = 0; bx < 4; bx++) {
  for (let by = 0; by < 4; by++) {
    const block = String.fromCharCode(65 + bx * 4 + by); // A..P
    const zone = bx === 1 && by === 1 ? ZONE_B : bx >= 0 && by >= 0 ? (bx <= 1 && by <= 1 ? ZONE_A : ZONE_C) : ZONE_D;
    for (let sx = 0; sx < 2; sx++) {
      for (let sy = 0; sy < 2; sy++) {
        const gx = bx * 8 + sx * 4;
        const gy = by * 8 + sy * 4;
        const idx = bx * 16 + by * 4 + sx * 2 + sy;
        parcelsGen.push({
          id: `R5-P-${base34(idx).padStart(3, '0')}`,
          block,
          zone,
          landUse: LAND_USE[zone] ?? 'Residential',
          gx,
          gy,
          gw: 4,
          gd: 4,
          owner: OWNERS[idx % OWNERS.length],
          rights: idx % 5 === 0 ? 'leasehold' : idx % 7 === 0 ? 'state-owned' : 'freehold',
        });
      }
    }
  }
}

// ---------- buildings ----------
interface BGen {
  name: string;
  type: PropertyType;
  x: number;
  y: number;
  w: number;
  d: number;
  floors: number;
}

const B_COLORS = [
  '#38bdf8', '#0ea5e9', '#22d3ee', '#2dd4bf', '#34d399', '#a3e635', '#fbbf24', '#fb923c', '#f472b6', '#a78bfa', '#818cf8', '#c084fc',
];

const BUILDINGS_GEN: BGen[] = [
  { name: 'Rohini Central Heights', type: 'commercial', x: 13, y: 13, w: 3, d: 3, floors: 18 },
  { name: 'Rohini Sector 5 One', type: 'mixed-use', x: 17, y: 13, w: 3, d: 3, floors: 24 },
  { name: 'Rithala Road Business Centre', type: 'commercial', x: 21, y: 13, w: 3, d: 3, floors: 15 },
  { name: 'Sector 5 Civic Centre', type: 'commercial', x: 13, y: 17, w: 3, d: 3, floors: 14 },
  { name: 'Pocket 5 Mixed-Use Plaza', type: 'mixed-use', x: 19, y: 19, w: 3, d: 3, floors: 22 },
  { name: 'A-Block Heights', type: 'residential', x: 6, y: 6, w: 4, d: 3, floors: 12 },
  { name: 'B-Block Greens', type: 'residential', x: 10, y: 4, w: 3, d: 4, floors: 9 },
  { name: 'C-Block Residency', type: 'residential', x: 24, y: 6, w: 3, d: 3, floors: 11 },
  { name: 'D-Block Towers', type: 'residential', x: 28, y: 10, w: 3, d: 4, floors: 8 },
  { name: 'E-Block Homes', type: 'residential', x: 6, y: 24, w: 3, d: 3, floors: 13 },
  { name: 'F-Block Enclave', type: 'residential', x: 10, y: 28, w: 4, d: 3, floors: 10 },
  { name: 'G-Block Residency', type: 'residential', x: 24, y: 26, w: 3, d: 3, floors: 7 },
  { name: 'H-Block Skyline', type: 'residential', x: 28, y: 24, w: 4, d: 3, floors: 9 },
  { name: 'Pocket 5 Heights', type: 'residential', x: 16, y: 8, w: 3, d: 3, floors: 6 },
  { name: 'Rohini Cooperative Apartments', type: 'residential', x: 8, y: 16, w: 3, d: 3, floors: 5 },
  { name: 'Sector 5 Civic Services Building', type: 'government', x: 3, y: 27, w: 4, d: 4, floors: 6 },
  { name: 'Rohini Property Records Centre', type: 'government', x: 27, y: 3, w: 4, d: 4, floors: 5 },
  { name: 'Sector 5 Electrical Substation (Demo)', type: 'utility', x: 2, y: 2, w: 4, d: 4, floors: 3 },
  { name: 'Rohini Utility Facility (Demo)', type: 'utility', x: 28, y: 28, w: 4, d: 4, floors: 2 },
  { name: 'Sector 5 Commercial Arcade', type: 'commercial', x: 11, y: 11, w: 3, d: 3, floors: 9 },
  { name: 'Rohini Main Market Arcade', type: 'commercial', x: 22, y: 18, w: 3, d: 3, floors: 8 },
  { name: 'Pocket 5 Shanti Apartments', type: 'mixed-use', x: 16, y: 22, w: 3, d: 3, floors: 10 },
  { name: 'Rohini Nila Residency', type: 'residential', x: 12, y: 26, w: 3, d: 3, floors: 8 },
  { name: 'Sector 5 Iskcon Heights (Demo)', type: 'residential', x: 20, y: 22, w: 3, d: 3, floors: 9 },
  { name: 'Rohini Vardaan Tower', type: 'mixed-use', x: 26, y: 12, w: 2, d: 4, floors: 7 },
  { name: 'Sector 5 Community Hall (Demo)', type: 'government', x: 6, y: 30, w: 3, d: 2, floors: 2 },
];

const UNIT_TYPES = ['1 BHK Apartment', '2 BHK Apartment', '3 BHK Apartment', 'Retail Shop', 'Office Suite', 'Penthouse'];
const RESIDENTS = [
  'R. Krishnan', 'S. Priya', 'V. Anand', 'M. Lakshmi', 'K. Rajesh', 'A. Meena', 'P. Suresh', 'T. Divya',
  'G. Karthik', 'N. Deepa', 'S. Vikram', 'L. Kavitha', 'B. Murugan', 'J. Fathima', 'D. Arul', 'H. Rani',
];

function ulpinKey(zone: string, block: string, idx: number): { parcel: string; zone: string } {
  return { zone, parcel: `${block}${base34(idx).padStart(3, '0')}` };
}

export const parcels: Parcel[] = [];
export const buildings: Building[] = [];
export const allUnits: Unit[] = [];

const buildingZoneOf = (bx: number, by: number): string => {
  if (bx <= 1 && by <= 1) return ZONE_D; // institutional corner band
  if (bx >= 2 && by <= 1) return ZONE_A;
  if (bx <= 1 && by >= 2) return ZONE_C;
  if (bx === 2 && by === 2) return ZONE_B;
  return ZONE_C;
};

// parcel lookup by containment
function parcelFor(x: number, y: number, w: number, d: number): ParcelGen {
  const cx = x + w / 2;
  const cy = y + d / 2;
  let best = parcelsGen[0];
  let bestDist = Infinity;
  for (const p of parcelsGen) {
    const inX = cx >= p.gx - 1 && cx <= p.gx + p.gw + 1;
    const inY = cy >= p.gy - 1 && cy <= p.gy + p.gd + 1;
    if (inX && inY) return p;
    const dist = Math.abs(cx - (p.gx + p.gw / 2)) + Math.abs(cy - (p.gy + p.gd / 2));
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best;
}

BUILDINGS_GEN.forEach((b, i) => {
  const pg = parcelFor(b.x, b.y, b.w, b.d);
  const key = ulpinKey(pg.zone, pg.block, i);
  const floorH = b.type === 'residential' ? 3.1 : b.type === 'utility' ? 4.6 : 3.9;
  const height = Math.round(b.floors * floorH);
  const cx = b.x + b.w / 2;
  const cy = b.y + b.d / 2;
  const color = B_COLORS[i % B_COLORS.length];
  const buildingIdx = buildings.length;

  // generate units
  const units: Unit[] = [];
  const perFloor = b.w * b.d >= 9 ? 4 : 3;
  const totalArea = b.w * b.d * 25 * b.floors;
  for (let f = 1; f <= b.floors; f++) {
    for (let u = 0; u < perFloor; u++) {
      const isGround = f === 1;
      const type =
        b.type === 'commercial'
          ? isGround && u % 2 === 0
            ? 'Retail Shop'
            : 'Office Suite'
          : b.type === 'mixed-use'
            ? isGround
              ? u % 2 === 0
                ? 'Retail Shop'
                : 'Commercial Unit'
              : UNIT_TYPES[Math.floor(rng() * 4)]
            : b.type === 'government'
              ? 'Government Office'
              : b.type === 'utility'
                ? 'Utility Space'
                : UNIT_TYPES[Math.floor(rng() * (perFloor <= 3 ? 3 : 4))];
      const letter = String.fromCharCode(65 + u);
      const area = Math.round((totalArea / (b.floors * perFloor)) * (0.8 + rng() * 0.4));
      const vacant = rng() < 0.14;
      const unitKey = `${letter}1`;
      const floorKey = String(f).padStart(2, '0');
      units.push({
        id: `U-${buildingIdx + 1}-${f}-${u + 1}`,
        label: `${f}${letter}`,
        ulpin: buildUlpin({
          country: COUNTRY, state: STATE, district: DISTRICT,
          zone: key.zone, parcel: key.parcel, floor: floorKey, unit: unitKey,
        }),
        type,
        floor: f,
        areaM2: area,
        owner: vacant ? '— Vacant —' : RESIDENTS[Math.floor(rng() * RESIDENTS.length)],
        rights: b.type === 'commercial' ? 'leasehold' : b.type === 'government' || b.type === 'utility' ? 'state-owned' : 'strata',
        vacant,
      });
    }
  }

  const bid = `BLD-${String(buildingIdx + 1).padStart(3, '0')}`;
  const bldg: Building = {
    id: bid,
    name: b.name,
    parcelId: pg.id,
    ulpin: buildUlpin({
      country: COUNTRY, state: STATE, district: DISTRICT,
      zone: key.zone, parcel: key.parcel, floor: '00', unit: `${String.fromCharCode(65 + buildingIdx % 26)}0`,
    }),
    type: b.type,
    floors: b.floors,
    floorHeightM: floorH,
    footprintM2: b.w * b.d * 25,
    areaM2: totalArea,
    heightM: height,
    color,
    gx: b.x,
    gy: b.y,
    gw: b.w,
    gd: b.d,
    cx,
    cy,
    elevationBaseM: ELEV_BASE,
    elevationTopM: ELEV_BASE + height,
    owner: pg.owner,
    rights: b.type === 'government' || b.type === 'utility' ? 'state-owned' : 'freehold',
    units,
    address: coordsOf(cx, cy).address,
    latitude: coordsOf(cx, cy).latitude,
    longitude: coordsOf(cx, cy).longitude,
  };
  buildings.push(bldg);
  allUnits.push(...units);

  parcels.push({
    id: pg.id,
    ulpin: buildUlpin({
      country: COUNTRY, state: STATE, district: DISTRICT,
      zone: key.zone, parcel: key.parcel, floor: '00', unit: '00',
    }),
    name: `Parcel ${pg.id.replace('R5-P-', '')} · ${pg.landUse}`,
    landUse: pg.landUse,
    areaM2: pg.gw * pg.gd * 25 * 25,
    gx: pg.gx,
    gy: pg.gy,
    gw: pg.gw,
    gd: pg.gd,
    cx: pg.gx + pg.gw / 2,
    cy: pg.gy + pg.gd / 2,
    owner: pg.owner,
    rights: pg.rights,
    buildingId: bldg.id,
    status: i % 9 === 3 ? 'pending' : i % 11 === 5 ? 'warning' : 'validated',
    address: coordsOf(pg.gx + pg.gw / 2, pg.gy + pg.gd / 2).address,
    latitude: coordsOf(pg.gx + pg.gw / 2, pg.gy + pg.gd / 2).latitude,
    longitude: coordsOf(pg.gx + pg.gw / 2, pg.gy + pg.gd / 2).longitude,
  });
});

// ---------- utilities ----------
const UTILITY_META: Array<{ name: string; type: UtilityType; pts: Array<[number, number]>; depth: number; dia: number; status: UtilityLine['status'] }> = [
  { name: 'Primary Water Main', type: 'water', pts: [[2, 16], [12, 16], [20, 16], [32, 16]], depth: 2.5, dia: 900, status: 'operational' },
  { name: 'Sewage Trunk Line', type: 'sewage', pts: [[3, 24], [10, 21], [18, 20], [27, 20], [32, 20]], depth: 4.1, dia: 1200, status: 'operational' },
  { name: 'HV Power Feeder 110kV', type: 'power', pts: [[6, 2], [6, 10], [6, 18], [6, 26], [6, 32]], depth: 1.2, dia: 200, status: 'operational' },
  { name: 'City Gas Distribution', type: 'gas', pts: [[4, 29], [9, 28], [14, 27], [20, 27], [26, 28]], depth: 1.8, dia: 300, status: 'operational' },
  { name: 'Fibre Backbone', type: 'telecom', pts: [[27, 2], [27, 9], [27, 16], [27, 24], [27, 32]], depth: 1.5, dia: 120, status: 'operational' },
  { name: 'Storm Drain Network', type: 'storm', pts: [[2, 12], [8, 13], [15, 12], [22, 13], [31, 12]], depth: 3.2, dia: 800, status: 'maintenance' },
];

export const utilityLines: UtilityLine[] = UTILITY_META.map((u, i) => ({
  id: `UT-${String(i + 1).padStart(3, '0')}`,
  ulpin: buildUlpin({ country: COUNTRY, state: STATE, district: DISTRICT, zone: ZONE_U, parcel: `T${String(i + 1).padStart(3, '0')}`, floor: 'UG', unit: '00' }),
  name: u.name,
  type: u.type,
  points: u.pts,
  depthM: u.depth,
  diameterMm: u.dia,
  status: u.status,
  lengthM: Math.round(u.pts.reduce((acc, p, i2) => (i2 === 0 ? acc : acc + Math.hypot(p[0] - u.pts[i2 - 1][0], p[1] - u.pts[i2 - 1][1])), 0) * 25),
}));

export const utilityNodes: UtilityNode[] = [];
const NODE_TYPES: Array<UtilityNode['type']> = ['manhole', 'chamber', 'valve', 'junction'];
let ni = 0;
for (const l of utilityLines) {
  for (let i = 0; i < l.points.length; i++) {
    if (i === 0 || i === l.points.length - 1 || i % 2 === 0) {
      const [px, py] = l.points[i];
      utilityNodes.push({
        id: `UN-${String(ni + 1).padStart(3, '0')}`,
        ulpin: buildUlpin({ country: COUNTRY, state: STATE, district: DISTRICT, zone: ZONE_U, parcel: `N${String(ni + 1).padStart(3, '0')}`, floor: 'UG', unit: '00' }),
        type: NODE_TYPES[(ni + i) % NODE_TYPES.length],
        utility: l.type,
        gridX: px + (i === 0 ? 0.2 : 0),
        gridY: py,
        depthM: l.depthM + 0.4,
        status: l.status,
      });
      ni++;
    }
  }
}

// ---------- AI detections + conflicts ----------
export const DETECTIONS: AiDetection[] = [
  { id: 'D1', kind: 'building', title: 'Automated Building Extraction', description: 'Deep learning segmentation of buildings from drone orthophoto (0.05 m GSD).', confidence: 96.4, status: 'completed', metric: '382 / 390 footprints', runId: 'RUN-8f3a21', date: '2026-08-28' },
  { id: 'D2', kind: 'floor', title: 'Floor Segmentation', description: 'Facade & window-line cues combined with LiDAR point density to detect slab levels.', confidence: 91.8, status: 'completed', metric: '216 floors segmented', runId: 'RUN-8f3a22', date: '2026-08-28' },
  { id: 'D3', kind: 'parcel', title: 'Vertical Parcel Delineation', description: '3D space partitioning into floor-level sub-parcels with air-rights envelopes.', confidence: 93.1, status: 'completed', metric: '1,284 vertical parcels', runId: 'RUN-8f3a23', date: '2026-08-29' },
  { id: 'D4', kind: 'topology', title: 'Intelligent Topology Validation', description: 'Graph consistency check: adjacency, containment and z-range continuity.', confidence: 98.2, status: 'completed', metric: '4,512 rules passed', runId: 'RUN-8f3a24', date: '2026-08-29' },
  { id: 'D5', kind: 'ownership', title: 'Ownership Conflict Detection', description: 'Cross-layer comparison of registry entries vs extracted 3D geometry.', confidence: 87.6, status: 'processing', metric: '6 conflicts flagged', runId: 'RUN-8f3a25', date: '2026-08-30' },
  { id: 'D6', kind: 'topology', title: 'Underground Asset Mapping', description: 'Ground-penetrating radar + as-built CAD fusion for utility corridors.', confidence: 84.9, status: 'queued', metric: '—', runId: 'RUN-8f3a26', date: '—' },
];

export const CONFLICTS: Conflict[] = [
  { id: 'CF-101', title: 'Z-range overlap B4-0172 / B4-0173', entities: ['BLD-005', 'BLD-021'], type: 'z-range-overlap', severity: 'high', status: 'open', description: 'Air-rights envelope of two adjacent towers overlaps between levels 14–15.' },
  { id: 'CF-102', title: 'Duplicate registration P-00F', entities: ['R5-P-00F'], type: 'duplicate-registration', severity: 'high', status: 'resolving', description: 'Same parcel code registered twice in the legacy ledger (2007, 2019).' },
  { id: 'CF-103', title: 'Boundary dispute D2 / D3 sector edge', entities: ['D2-GRID-09', 'D3-GRID-11'], type: 'boundary-dispute', severity: 'medium', status: 'open', description: 'Drone survey boundary differs 1.4 m from SHP parcel layer.' },
  { id: 'CF-104', title: 'Utility easement vs building footing', entities: ['UT-002', 'BLD-014'], type: 'air-right-clash', severity: 'medium', status: 'resolved', description: 'Sewer easement zone intersects basement footing of Cedar Residency.' },
];

// ---------- analytics ----------
export const ANALYTICS = {
  totalParcels: parcels.length + 9, // + legacy not yet digitised
  mapped3d: buildings.length,
  units: allUnits.length,
  undergroundAssets: utilityNodes.length + utilityLines.length,
  validated: parcels.filter((p) => p.status === 'validated').length,
  aiAccuracy: 94.2,
  conflicts: CONFLICTS.length,
  avgConfidence: 92.6,
  dataVolumeGb: 14.8,
  areaKm2: 0.72,
};

export const ZONE_STATS = [
  { zone: 'R5 · Residential', parcels: 6, areaM2: 150000, color: '#22d3ee' },
  { zone: 'CC · Commercial Core', parcels: 4, areaM2: 100000, color: '#fbbf24' },
  { zone: 'MX · Mixed Use', parcels: 10, areaM2: 250000, color: '#a78bfa' },
  { zone: 'PK · Parks / Civic', parcels: 8, areaM2: 200000, color: '#34d399' },
  { zone: 'UT · Underground Utilities', parcels: 6, areaM2: 150000, color: '#f472b6' },
];

export const FLOOR_DIST = [0, 4, 6, 5, 4, 3, 2, 1, 1, 0].map((n, i) => ({ floors: `${i * 3 + 1}-${i * 3 + 3}`, count: n }));

export const CONFIDENCE_TREND = [
  { run: 'R1', value: 86.1 }, { run: 'R2', value: 89.4 }, { run: 'R3', value: 90.2 },
  { run: 'R4', value: 91.8 }, { run: 'R5', value: 92.5 }, { run: 'R6', value: 94.2 },
];

// ---------- lookups ----------
export function getBuilding(id: string): Building | undefined {
  return buildings.find((b) => b.id === id);
}
export function getParcel(id: string): Parcel | undefined {
  return parcels.find((p) => p.id === id);
}
export function getUnit(id: string): Unit | undefined {
  return allUnits.find((u) => u.id === id);
}

export function findByUlpin(ulpin: string): { kind: 'parcel' | 'building' | 'unit' | 'utility'; entity: Parcel | Building | Unit | UtilityLine | UtilityNode } | null {
  const q = ulpin.trim().toUpperCase();
  const hit = (x: { ulpin: string }) => x.ulpin.toUpperCase() === q;
  const u = allUnits.find(hit);
  if (u) return { kind: 'unit', entity: u };
  const b = buildings.find(hit);
  if (b) return { kind: 'building', entity: b };
  const p = parcels.find(hit);
  if (p) return { kind: 'parcel', entity: p };
  const l = utilityLines.find(hit);
  if (l) return { kind: 'utility', entity: l };
  const n = utilityNodes.find(hit);
  if (n) return { kind: 'utility', entity: n };
  return null;
}

export function searchEntities(q: string): Array<{ kind: string; id: string; label: string; sub: string }> {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  const out: Array<{ kind: string; id: string; label: string; sub: string }> = [];
  for (const b of buildings) {
    if (b.name.toLowerCase().includes(query) || b.id.toLowerCase().includes(query) || b.ulpin.toLowerCase().includes(query)) {
      out.push({ kind: 'building', id: b.id, label: b.name, sub: b.ulpin });
    }
  }
  for (const p of parcels) {
    if (p.id.toLowerCase().includes(query) || p.ulpin.toLowerCase().includes(query) || p.landUse.toLowerCase().includes(query)) {
      out.push({ kind: 'parcel', id: p.id, label: p.name, sub: p.ulpin });
    }
  }
  for (const u of allUnits) {
    if (u.ulpin.toLowerCase().includes(query)) {
      out.push({ kind: 'unit', id: u.id, label: `${u.label} · ${u.type}`, sub: u.ulpin });
    }
  }
  return out.slice(0, 12);
}

export function coordsOf(cx: number, cy: number): { east: number; north: number; latitude: number; longitude: number; address: string } {
  const east = BASE_E + cx * CELL;
  const north = BASE_N + (GRID - cy) * CELL;
  // Approximate local georeferencing around the Rohini Sector 5 centroid.
  // These coordinates are for visualization only and are not cadastral survey data.
  const latitude = 28.7156 + (cy - GRID / 2) * 0.000225;
  const longitude = 77.1058 + (cx - GRID / 2) * 0.000265;
  const pocket = String.fromCharCode(65 + Math.max(0, Math.min(7, Math.floor(cx / 4))));
  return { east, north, latitude, longitude, address: `${pocket} Block, Sector 5, Rohini, New Delhi — 110085` };
}

export const TYPE_COLORS: Record<PropertyType, string> = {
  residential: '#22d3ee',
  commercial: '#fbbf24',
  'mixed-use': '#a78bfa',
  government: '#34d399',
  utility: '#f472b6',
};

export const UTILITY_COLORS: Record<UtilityType, string> = {
  water: '#38bdf8',
  sewage: '#a16207',
  power: '#f59e0b',
  gas: '#ef4444',
  telecom: '#a78bfa',
  storm: '#0ea5e9',
};
