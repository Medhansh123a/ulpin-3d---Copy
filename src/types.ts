// ---------- Domain types for 3D ULPIN ----------

export type PropertyType =
  | 'residential'
  | 'commercial'
  | 'mixed-use'
  | 'government'
  | 'utility';

export type OwnershipCategory =
  | 'freehold'
  | 'leasehold'
  | 'strata'
  | 'state-owned'
  | 'air-right'
  | 'underground';

export type UtilityType = 'water' | 'sewage' | 'power' | 'gas' | 'telecom' | 'storm';

export interface Unit {
  id: string;
  label: string;
  ulpin: string;
  type: string;
  floor: number; // 1-based
  areaM2: number;
  owner: string;
  rights: OwnershipCategory;
  vacant: boolean;
}

export interface Building {
  id: string;
  name: string;
  parcelId: string;
  ulpin: string; // parcel-level vertical extent
  type: PropertyType;
  floors: number;
  floorHeightM: number;
  footprintM2: number;
  areaM2: number;
  heightM: number;
  color: string;
  // grid geometry (units of 25 m)
  gx: number;
  gy: number;
  gw: number;
  gd: number;
  cx: number; // grid center
  cy: number;
  elevationBaseM: number;
  elevationTopM: number;
  owner: string;
  rights: OwnershipCategory;
  units: Unit[];
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface Parcel {
  id: string;
  ulpin: string;
  name: string;
  landUse: string;
  areaM2: number;
  gx: number;
  gy: number;
  gw: number;
  gd: number;
  cx: number;
  cy: number;
  owner: string;
  rights: OwnershipCategory;
  buildingId?: string;
  status: 'validated' | 'pending' | 'warning';
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface UtilityNode {
  id: string;
  ulpin: string;
  type: 'manhole' | 'chamber' | 'valve' | 'junction';
  utility: UtilityType;
  gridX: number;
  gridY: number;
  depthM: number;
  status: string;
}

export interface UtilityLine {
  id: string;
  ulpin: string;
  name: string;
  type: UtilityType;
  points: [number, number][]; // grid coords
  depthM: number;
  diameterMm: number;
  status: 'operational' | 'maintenance' | 'planned';
  lengthM: number;
}

export type DetectionStatus = 'completed' | 'processing' | 'queued';

export interface AiDetection {
  id: string;
  kind: 'building' | 'floor' | 'parcel' | 'topology' | 'ownership';
  title: string;
  description: string;
  confidence: number;
  status: DetectionStatus;
  metric: string;
  runId: string;
  date: string;
}

export interface Conflict {
  id: string;
  title: string;
  entities: string[];
  type: 'z-range-overlap' | 'duplicate-registration' | 'boundary-dispute' | 'air-right-clash';
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'resolving' | 'resolved';
  description: string;
}

export type Theme = 'dark' | 'light';
export type EntityRef = { kind: 'parcel' | 'building' | 'unit' | 'utility'; id: string };

export type ToastType = 'info' | 'success' | 'warning' | 'error';
export interface Toast {
  id: number;
  msg: string;
  type: ToastType;
}
