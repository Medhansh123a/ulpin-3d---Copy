import { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ClipboardCopy, Layers3, MapPin, Waves, Maximize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Badge, Card, CardHeader, Seg, Table, Td, Th, DemoTag, EmptyState } from '../components/ui';
import { buildings, coordsOf, getBuilding, parcels, utilityLines, utilityNodes } from '../data/mockData';
import type { Building, EntityRef } from '../types';
import { fmtArea, fmtNum, shade } from '../utils/format';
import UlpinDisplay from '../components/UlpinDisplay';

function guessKind(id: string): 'building' | 'parcel' | 'unit' | 'utility' {
  if (id.startsWith('BLD-')) return 'building';
  if (id.startsWith('R5-P')) return 'parcel';
  if (id.startsWith('U-')) return 'unit';
  return 'utility';
}

export default function PropertyDetail() {
  const { id = '' } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const { select, notify } = useApp();
  const kind = ((loc.state as { kind?: string } | null)?.kind as EntityRef['kind']) ?? guessKind(id);
  const [floor, setFloor] = useState(1);

  const building: Building | undefined = useMemo(() => getBuilding(id) ?? (kind === 'building' ? getBuilding(id) : undefined), [id, kind]);

  if (!building) {
    // parcel / unit / utility fallback view
    const parcel = parcels.find((p) => p.id === id);
    const line = utilityLines.find((l) => l.id === id);
    const node = utilityNodes.find((n) => n.id === id);
    return (
      <div className="space-y-4">
        <button onClick={() => nav('/dashboard')} className="btn-ghost -ml-2"><ArrowLeft size={15} /> Back to map</button>
        {parcel ? (
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{parcel.name}</h1>
                <p className="text-xs text-slate-400">{parcel.id}</p>
              </div>
              <Badge tone={parcel.status === 'validated' ? 'green' : parcel.status === 'pending' ? 'amber' : 'rose'}>{parcel.status}</Badge>
            </div>
            <div className="mb-4"><p className="label">3D ULPIN</p><UlpinDisplay ulpin={parcel.ulpin} size="lg" /></div>
            <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {(
                [
                  ['Land use', parcel.landUse],
                  ['Area', fmtArea(parcel.areaM2)],
                  ['Owner', parcel.owner],
                  ['Rights', parcel.rights.replace('-', ' ')],
                  ['Ground level', '+214.0 m (simulated DEM)'],
                  ['Coordinates', `${parcel.latitude?.toFixed(6) ?? coordsOf(parcel.cx, parcel.cy).latitude.toFixed(6)} N · ${parcel.longitude?.toFixed(6) ?? coordsOf(parcel.cx, parcel.cy).longitude.toFixed(6)} E`],
                  ['Address', parcel.address ?? coordsOf(parcel.cx, parcel.cy).address],
                ] as Array<[string, string]>
              ).map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between border-b border-slate-100 py-1.5 text-xs dark:border-slate-800">
                  <span className="font-medium uppercase tracking-wide text-slate-400">{k}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{v}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => { select({ kind: 'parcel', id: parcel.id }); nav('/dashboard'); }}>
                <MapPin size={14} /> Show in 3D map
              </button>
            </div>
          </Card>
        ) : line || node ? (
          <Card className="p-5">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">{line ? line.name : `Chamber ${node!.id}`}</h1>
            <p className="text-xs text-slate-400">{line ? 'Underground utility corridor' : `Utility node · ${node!.type}`}</p>
            <div className="mt-3"><UlpinDisplay ulpin={(line ?? node!).ulpin} size="lg" /></div>
            <div className="mt-3 space-y-2 text-xs">
              {line ? (
                <>
                  <DetailRow k="Utility" v={line.type} />
                  <DetailRow k="Depth" v={`${line.depthM} m below surface`} />
                  <DetailRow k="Diameter" v={`${line.diameterMm} mm`} />
                  <DetailRow k="Length" v={`${fmtNum(line.lengthM)} m`} />
                  <DetailRow k="Status" v={line.status} />
                </>
              ) : (
                <>
                  <DetailRow k="Utility" v={node!.utility} />
                  <DetailRow k="Depth" v={`${node!.depthM} m`} />
                  <DetailRow k="Grid position" v={`(${node!.gridX.toFixed(1)}, ${node!.gridY.toFixed(1)})`} />
                </>
              )}
            </div>
            <button className="btn-primary mt-4" onClick={() => { select({ kind: 'utility', id: (line ?? node!).id }); nav('/dashboard'); }}>
              <Waves size={14} /> Show in 3D map
            </button>
          </Card>
        ) : (
          <Card><EmptyState icon={MapPin} title="Record not found" body={`No parcel, building or utility asset matches "${id}".`} action={<button className="btn-secondary" onClick={() => nav('/dashboard')}>Back to dashboard</button>} /></Card>
        )}
      </div>
    );
  }

  const floorUnits = building.units.filter((u) => u.floor === floor);
  const coords = coordsOf(building.cx, building.cy);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => nav('/dashboard')} className="btn-ghost -ml-2"><ArrowLeft size={15} /> Back to map</button>
        <div className="flex items-center gap-2"><DemoTag /></div>
      </div>

      {/* header card */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{building.name}</h1>
            <p className="mt-0.5 text-xs text-slate-400">{building.id} · {building.type.replace('-', ' ')} · {building.floors} floors</p>
          </div>
          <button className="btn-secondary" onClick={() => { select({ kind: 'building', id: building.id }); nav('/dashboard'); }}>
            <Building2 size={14} /> Open in 3D map
          </button>
        </div>
        <div className="mt-4">
          <p className="label">3D ULPIN</p>
          <UlpinDisplay ulpin={building.ulpin} size="lg" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          <DetailRow k="Parcel ID" v={building.parcelId} mono />
          <DetailRow k="Building ID" v={building.id} mono />
          <DetailRow k="Floors" v={`${building.floors} (${Math.round(building.heightM)} m)`} />
          <DetailRow k="Floor area" v={fmtArea(building.footprintM2)} />
          <DetailRow k="Total area" v={fmtArea(building.areaM2)} />
          <DetailRow k="Property type" v={building.type.replace('-', ' ')} />
          <DetailRow k="Rights category" v={building.rights.replace('-', ' ')} />
          <DetailRow k="Elevation range" v={`${building.elevationBaseM} m → ${building.elevationTopM} m`} />
          <DetailRow k="Easting" v={fmtNum(coords.east)} mono />
          <DetailRow k="Northing" v={fmtNum(coords.north)} mono />
          <DetailRow k="Latitude" v={(building.latitude ?? coords.latitude).toFixed(6)} mono />
          <DetailRow k="Longitude" v={(building.longitude ?? coords.longitude).toFixed(6)} mono />
          <DetailRow k="Address" v={building.address ?? coords.address} />
          <DetailRow k="Air space" v="Strata above roof (demo)" />
          <DetailRow k="Underground" v="Basement + utility easement" />
        </div>
      </Card>

      {/* floor view */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={`Floor view · Level ${floor}`}
            subtitle={`${floorUnits.length} vertical parcels on this level`}
            right={
              <div className="flex flex-wrap items-center gap-1.5">
                {Array.from({ length: building.floors }, (_, i) => i + 1).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFloor(f)}
                    className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${
                      f === floor
                        ? 'bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    {f}
                  </button>
                ))}
                <button
                  onClick={() => setFloor(0)}
                  className={`h-8 rounded-md px-2 text-[10px] font-bold transition-colors ${floor === 0 ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}
                >
                  UG
                </button>
              </div>
            }
          />
          {floor === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Waves}
                title="Basement & utility level"
                body="This demo building includes two basement levels with parking and utility rooms. Floor-by-floor unit partitioning below ground is generated on request (simulated)."
              />
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2">
              <FloorPlanSVG building={building} floor={floor} />
              <div className="overflow-x-auto">
                <Table head={<><Th>Unit</Th><Th>ULPIN</Th><Th>Type</Th><Th>Area</Th><Th>Status</Th></>}>
                  {floorUnits.map((u) => (
                    <tr key={u.id}>
                      <Td className="font-bold">{u.label}</Td>
                      <Td><UlpinDisplay ulpin={u.ulpin} size="sm" /></Td>
                      <Td>{u.type}</Td>
                      <Td>{fmtArea(u.areaM2)}</Td>
                      <Td><Badge tone={u.vacant ? 'slate' : 'teal'}>{u.vacant ? 'Vacant' : 'Occupied'}</Badge></Td>
                    </tr>
                  ))}
                </Table>
                <button
                  className="btn-ghost mt-3 w-full border border-slate-200 text-xs dark:border-slate-700"
                  onClick={() => { notify(`ULPINs for level ${floor} exported to registry bundle (demo)`, 'success'); }}
                >
                  <ClipboardCopy size={13} /> Copy level ULPIN list (demo)
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* vertical parceling summary */}
        <Card>
          <CardHeader title="Vertical parceling" subtitle="Per-level summary" right={<Layers3 size={15} className="text-cyan-500" />} />
          <div className="max-h-[420px] overflow-y-auto p-4">
            <Table head={<><Th>Level</Th><Th>Parcels</Th><Th>Area</Th></>}>
              {Array.from({ length: building.floors }, (_, i) => i + 1)
                .map((f) => {
                  const us = building.units.filter((u) => u.floor === f);
                  return { f, n: us.length, a: us.reduce((s, u) => s + u.areaM2, 0) };
                })
                .reverse()
                .map(({ f, n, a }) => (
                  <tr key={f} onClick={() => setFloor(f)} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <Td className="font-bold">L{f}</Td>
                    <Td>{n}</Td>
                    <Td>{fmtArea(a)}</Td>
                  </tr>
                ))}
              <tr>
                <Td className="font-bold text-amber-600 dark:text-amber-400">UG</Td>
                <Td>2</Td>
                <Td>Parking / utility</Td>
              </tr>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 text-xs dark:border-slate-800">
      <span className="shrink-0 font-medium uppercase tracking-wide text-slate-400">{k}</span>
      <span className={`text-right font-semibold text-slate-700 dark:text-slate-200 ${mono ? 'font-mono' : ''}`}>{v}</span>
    </div>
  );
}

/** Simple floor-plan schematic of unit partitions. */
function FloorPlanSVG({ building, floor }: { building: Building; floor: number }) {
  const us = building.units.filter((u) => u.floor === floor);
  const cols = 2;
  const rows = Math.max(1, Math.ceil(us.length / cols));
  const W = 280;
  const H = 220;
  const m = 22;
  const cellW = (W - m * 2 - (cols - 1) * 8) / cols;
  const cellH = (H - m * 2 - (rows - 1) * 8) / rows;
  const fillA = shade(building.color, 0.55);
  const fillB = shade(building.color, 0.35);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40">
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const i = r * cols + c;
          if (i >= us.length) return null;
          const u = us[i];
          const x = m + c * (cellW + 8);
          const y = m + r * (cellH + 8);
          return (
            <g key={u.id}>
              <rect x={x} y={y} width={cellW} height={cellH} rx={4} fill={i % 2 === 0 ? fillA : fillB} stroke={shade(building.color, -0.35)} strokeWidth={1.4} />
              <text x={x + cellW / 2} y={y + cellH / 2 - 4} textAnchor="middle" fontSize={15} fontWeight={800} fill={shade(building.color, -0.55)}>
                {u.label}
              </text>
              <text x={x + cellW / 2} y={y + cellH / 2 + 14} textAnchor="middle" fontSize={9} fill="#64748b">
                {u.type} · {fmtArea(u.areaM2)}
              </text>
            </g>
          );
        }),
      )}
      <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="#94a3b8">
        Schematic floor plan · demo geometry · not to scale
      </text>
    </svg>
  );
}
