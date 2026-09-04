import { useNavigate, type NavigateFunction} from 'react-router-dom';
import { Building2, Fingerprint, Layers3, MapPin, Maximize2 } from 'lucide-react';
import type { Building, EntityRef, Parcel, Unit, UtilityLine, UtilityNode } from '../types';
import { buildings, coordsOf, getBuilding, getParcel, getUnit, utilityLines, utilityNodes } from '../data/mockData';
import UlpinDisplay from './UlpinDisplay';
import { Badge, Card, statusTone } from './ui';
import { fmtArea, fmtNum } from '../utils/format';

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{k}</span>
      <span className="text-right text-xs font-semibold text-slate-700 dark:text-slate-200">{v}</span>
    </div>
  );
}

export default function EntityInfoPanel({ entity, compact = false }: { entity: EntityRef; compact?: boolean }) {
  const nav = useNavigate();
  let title = '';
  let sub = '';
  let ulpin = '';
  let badge: React.ReactNode = null;
  let body: React.ReactNode = null;
  let building: Building | undefined;

  if (entity.kind === 'building') {
    const b = getBuilding(entity.id);
    if (!b) return null;
    building = b;
    title = b.name;
    sub = `Building · ${b.id} · ${b.floors} floors`;
    ulpin = b.ulpin;
    badge = <Badge tone={statusTone(b.type)}>{b.type.replace('-', ' ')}</Badge>;
    body = (
      <>
        <Row k="Parcel" v={b.parcelId} />
        <Row k="Footprint" v={fmtArea(b.footprintM2)} />
        <Row k="Total area" v={fmtArea(b.areaM2)} />
        <Row k="Floors" v={b.floors} />
        <Row k="Height" v={`${b.heightM} m`} />
        <Row k="Elevation range" v={`${b.elevationBaseM} m → ${b.elevationTopM} m`} />
        <Row k="Address" v={b.address ?? coordsOf(b.cx, b.cy).address} />
        <Row k="Latitude / Longitude" v={<span className="font-mono">{(b.latitude ?? coordsOf(b.cx, b.cy).latitude).toFixed(6)} / {(b.longitude ?? coordsOf(b.cx, b.cy).longitude).toFixed(6)}</span>} />
        <Row k="Rights" v={b.rights.replace('-', ' ')} />
      </>
    );
  } else if (entity.kind === 'parcel') {
    const p = getParcel(entity.id);
    if (!p) return null;
    const c = coordsOf(p.cx, p.cy);
    title = p.name;
    sub = `Parcel · ${p.id}`;
    ulpin = p.ulpin;
    badge = <Badge tone={statusTone(p.status)}>{p.status}</Badge>;
    body = (
      <>
        <Row k="Land use" v={p.landUse} />
        <Row k="Area" v={fmtArea(p.areaM2)} />
        <Row k="Owner" v={<span className="normal-case">{p.owner}</span>} />
        <Row k="Rights" v={p.rights.replace('-', ' ')} />
        <Row k="Easting / Northing" v={<span className="font-mono">{fmtNum(c.east)} / {fmtNum(c.north)}</span>} />
        <Row k="Address" v={p.address ?? c.address} />
        <Row k="Latitude / Longitude" v={<span className="font-mono">{(p.latitude ?? c.latitude).toFixed(6)} / {(p.longitude ?? c.longitude).toFixed(6)}</span>} />
        <Row k="Ground level" v="+214.0 m (simulated DEM)" />
      </>
    );
  } else if (entity.kind === 'unit') {
    const u = getUnit(entity.id);
    if (!u) return null;
    const b = buildings.find((x) => x.units.some((z) => z.id === u.id));
    const top = b ? b.elevationBaseM + u.floor * b.floorHeightM : 0;
    title = `${b?.name ?? 'Unit'} · ${u.label}`;
    sub = `Vertical parcel · Floor ${u.floor}`;
    ulpin = u.ulpin;
    badge = <Badge tone={u.vacant ? 'slate' : 'teal'}>{u.vacant ? 'Vacant' : u.rights.replace('-', ' ')}</Badge>;
    body = (
      <>
        <Row k="Type" v={u.type} />
        <Row k="Floor area" v={fmtArea(u.areaM2)} />
        <Row k="Occupant" v={u.owner} />
        <Row k="Floor height" v={`${b?.floorHeightM ?? 3.1} m`} />
        <Row k="Elevation" v={`~${top.toFixed(1)} m → ~${(top + (b?.floorHeightM ?? 3.1)).toFixed(1)} m`} />
      </>
    );
  } else {
    const line = utilityLines.find((l) => l.id === entity.id);
    const node = line ? undefined : utilityNodes.find((n) => n.id === entity.id);
    const u = line ?? node;
    if (!u) return null;
    title = line ? line.name : `Chamber ${(node as UtilityNode).id}`;
    sub = line ? `Utility · ${line.type}` : `Utility node · ${(node as UtilityNode).type}`;
    ulpin = u.ulpin;
    badge = <Badge tone={statusTone(u.status)}>{u.status}</Badge>;
    body = (
      <>
        {line ? (
          <>
            <Row k="Type" v={line.type} />
            <Row k="Depth" v={`${line.depthM} m below surface`} />
            <Row k="Diameter" v={`${line.diameterMm} mm`} />
            <Row k="Length" v={`${fmtNum(line.lengthM)} m`} />
          </>
        ) : (
          <>
            <Row k="Utility" v={(node as UtilityNode).utility} />
            <Row k="Depth" v={`${(node as UtilityNode).depthM} m`} />
            <Row k="Grid" v={`(${(node as UtilityNode).gridX.toFixed(1)}, ${(node as UtilityNode).gridY.toFixed(1)})`} />
          </>
        )}
      </>
    );
  }

  if (compact) {
    return (
      <Card className="overflow-hidden p-4 animate-fadeIn">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{title}</p>
            <p className="truncate text-[11px] text-slate-400">{sub}</p>
          </div>
          {badge}
        </div>
        <div className="mb-3">
          <UlpinDisplay ulpin={ulpin} size="sm" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">{body}</div>
        <div className="mt-3 flex gap-2">
          <button className="btn-primary flex-1" onClick={() => nav(`/property/${building ? building.id : entity.id}`, { state: { kind: entity.kind } })}>
            <Building2 size={14} /> Open details
          </button>
          <button className="btn-secondary" onClick={() => nav('/generator', { state: { preset: entity.id } })} title="Generate ULPIN for this entity">
            <Fingerprint size={14} />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="text-xs text-slate-400">{sub}</p>
          </div>
          {badge}
        </div>
        <div className="mb-4">
          <p className="label">3D ULPIN</p>
          <UlpinDisplay ulpin={ulpin} size="lg" />
        </div>
        <div className="grid gap-x-6 sm:grid-cols-2">{body}</div>
      </Card>
      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <MapPin size={15} className="text-cyan-600 dark:text-cyan-400" /> Spatial context
        </div>
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          <p>
            The 3D ULPIN encodes <strong className="text-slate-800 dark:text-slate-100">horizontal</strong> (country → state → district → zone → parcel) and{' '}
            <strong className="text-slate-800 dark:text-slate-100">vertical</strong> (floor key → unit key) identity, plus a Luhn-mod-34 check digit for integrity
            validation.
          </p>
          <p className="font-mono text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {ulpin.split('-').slice(1, -1).join('-')} ▸ check digit
          </p>
          <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed dark:bg-slate-800/60">
            <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
              <Layers3 size={13} /> Vertical extent
            </p>
            Ground elevation +8.0 m (simulated DEM). {building ? `${building.floors} floors, roof at ${building.heightM} m, plus ${building.rights === 'air-right' ? 'air-rights envelope' : 'strata air-space'}.` : 'Land parcel with air-rights envelope above and sub-surface rights below.'}
          </div>
          <button
            className="btn-secondary w-full"
            onClick={() => {
              selectAndGo(entity, nav);
            }}
          >
            <Maximize2 size={14} /> View in 3D map
          </button>
        </div>
      </Card>
    </div>
  );
}

function selectAndGo(entity: EntityRef, nav: NavigationFunction){
  // Preserve the current selection so the dashboard can focus the same entity.
  // The dashboard owns the 3D camera state; this action only changes the route.
  nav('/dashboard', { state: { entity } });
}

export type { Parcel, Unit, UtilityLine, UtilityNode };
