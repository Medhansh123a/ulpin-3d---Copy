import { useMemo, useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, DoorOpen, ArrowUpDown, Layers3, MapPin, Ruler, ShieldCheck, ChevronUp, Warehouse } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { buildings, coordsOf, getBuilding } from '../data/mockData';
import { Badge, Card, CardHeader, DemoTag } from '../components/ui';
import UlpinDisplay from '../components/UlpinDisplay';
import { fmtArea, fmtNum } from '../utils/format';

export default function FloorView() {
  const { id = '', floor: floorParam = '1' } = useParams();
  const nav = useNavigate();
  const building = getBuilding(id);
  const safeBuilding = building ?? buildings[0];
  const requestedFloor = Number.parseInt(floorParam, 10) || 1;
  const floor = Math.max(1, Math.min(safeBuilding.floors, requestedFloor));
  const units = safeBuilding.units.filter((u) => u.floor === floor);
  const [selectedUnitId, setSelectedUnitId] = useState(units[0]?.id ?? '');
  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? units[0];
  const center = coordsOf(safeBuilding.cx, safeBuilding.cy);

  const plan = useMemo(() => buildFloorPlan(safeBuilding.gw, safeBuilding.gd, units.length), [safeBuilding.gw, safeBuilding.gd, units.length]);

  if (!building) {
    return (
      <Card className="p-6">
        <button className="btn-ghost -ml-2" onClick={() => nav('/dashboard')}><ArrowLeft size={15} /> Back to map</button>
        <p className="mt-6 text-sm font-semibold text-slate-700 dark:text-slate-200">Building record not found</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No Rohini Sector 5 demo building matches “{id}”.</p>
      </Card>
    );
  }

  const selectFloor = (f: number) => {
    const first = safeBuilding.units.find((u) => u.floor === f);
    setSelectedUnitId(first?.id ?? '');
    nav(`/floor/${safeBuilding.id}/${f}`, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <button className="btn-ghost -ml-2 mb-1" onClick={() => nav(`/property/${safeBuilding.id}`)}><ArrowLeft size={15} /> Back to property</button>
          <div className="flex items-center gap-2">
            <Building2 size={19} className="text-cyan-500" />
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{safeBuilding.name} · Floor {floor}</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Architectural floor plan · Rohini Sector 5, New Delhi · simulated demo dataset</p>
        </div>
        <DemoTag />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <CardHeader
            title={`Architectural floor plan · Level ${String(floor).padStart(2, '0')}`}
            subtitle="Apartment/unit boundaries, circulation core and shared areas"
            right={<Badge tone="cyan"><Layers3 size={12} /> {units.length} units</Badge>}
          />
          <div className="border-y border-slate-200 bg-slate-100/80 p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="relative overflow-auto rounded-xl border border-slate-300 bg-white shadow-inner dark:border-slate-700 dark:bg-slate-900">
              <svg viewBox="0 0 1000 650" className="min-h-[520px] min-w-[760px] w-full" role="img" aria-label={`Architectural floor plan for ${safeBuilding.name}, floor ${floor}`}>
                <defs>
                  <pattern id="plan-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M20 0H0V20" fill="none" stroke="#94a3b8" strokeOpacity=".12" strokeWidth="1" />
                  </pattern>
                  <filter id="plan-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="8" stdDeviation="10" floodOpacity=".12" />
                  </filter>
                </defs>
                <rect width="1000" height="650" fill="#f8fafc" className="dark:fill-slate-950" />
                <rect x="24" y="24" width="952" height="602" rx="12" fill="url(#plan-grid)" />
                <rect x={plan.outer.x} y={plan.outer.y} width={plan.outer.w} height={plan.outer.h} rx="4" fill="#fff" stroke="#334155" strokeWidth="5" filter="url(#plan-shadow)" className="dark:fill-slate-900 dark:stroke-slate-300" />

                {/* exterior dimensions */}
                <Dimension x1={plan.outer.x} y1={plan.outer.y - 24} x2={plan.outer.x + plan.outer.w} y2={plan.outer.y - 24} label={`${Math.round(safeBuilding.gw * 25)} m`} />
                <Dimension x1={plan.outer.x - 24} y1={plan.outer.y} x2={plan.outer.x - 24} y2={plan.outer.y + plan.outer.h} label={`${Math.round(safeBuilding.gd * 25)} m`} vertical />

                {/* apartments */}
                {units.map((unit, i) => {
                  const r = plan.units[i] ?? plan.units[0];
                  const selected = unit.id === selectedUnit?.id;
                  return (
                    <g key={unit.id} onClick={() => setSelectedUnitId(unit.id)} className="cursor-pointer">
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="2" fill={selected ? '#cffafe' : '#f1f5f9'} stroke={selected ? '#0891b2' : '#64748b'} strokeWidth={selected ? 4 : 2} className="dark:fill-slate-800" />
                      <rect x={r.x + 10} y={r.y + 10} width={r.w - 20} height={r.h - 20} rx="2" fill="none" stroke={selected ? '#06b6d4' : '#cbd5e1'} strokeDasharray="4 3" strokeWidth="1" opacity=".8" />
                      <text x={r.x + r.w / 2} y={r.y + 34} textAnchor="middle" fontSize="18" fontWeight="800" fill={selected ? '#0e7490' : '#334155'} className="dark:fill-slate-100">{unit.label}</text>
                      <text x={r.x + r.w / 2} y={r.y + 55} textAnchor="middle" fontSize="11" fill="#64748b">{unit.type}</text>
                      <text x={r.x + r.w / 2} y={r.y + r.h - 18} textAnchor="middle" fontSize="11" fontFamily="monospace" fill="#0f766e">{fmtArea(unit.areaM2)}</text>
                      {selected ? <circle cx={r.x + r.w - 16} cy={r.y + 16} r="6" fill="#06b6d4" /> : null}
                    </g>
                  );
                })}

                {/* central circulation corridor */}
                <rect x={plan.corridor.x} y={plan.corridor.y} width={plan.corridor.w} height={plan.corridor.h} fill="#e2e8f0" stroke="#475569" strokeWidth="2" className="dark:fill-slate-700 dark:stroke-slate-400" />
                <text x={plan.corridor.x + plan.corridor.w / 2} y={plan.corridor.y + plan.corridor.h / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="700" letterSpacing="1.5" fill="#475569" transform={`rotate(-90 ${plan.corridor.x + plan.corridor.w / 2} ${plan.corridor.y + plan.corridor.h / 2})`}>COMMON CORRIDOR</text>

                {/* lift lobby + lifts */}
                <rect x={plan.core.x} y={plan.core.y} width={plan.core.w} height={plan.core.h} fill="#fef3c7" stroke="#92400e" strokeWidth="2" className="dark:fill-amber-950" />
                <text x={plan.core.x + plan.core.w / 2} y={plan.core.y + 18} textAnchor="middle" fontSize="10" fontWeight="700" fill="#92400e">CORE</text>
                <rect x={plan.core.x + 14} y={plan.core.y + 28} width="48" height="62" fill="#fff" stroke="#475569" strokeWidth="2" className="dark:fill-slate-900" />
                <rect x={plan.core.x + 70} y={plan.core.y + 28} width="48" height="62" fill="#fff" stroke="#475569" strokeWidth="2" className="dark:fill-slate-900" />
                <text x={plan.core.x + 38} y={plan.core.y + 62} textAnchor="middle" fontSize="10" fontWeight="700">LIFT</text>
                <text x={plan.core.x + 94} y={plan.core.y + 62} textAnchor="middle" fontSize="10" fontWeight="700">LIFT</text>

                {/* stairs */}
                <rect x={plan.stair.x} y={plan.stair.y} width={plan.stair.w} height={plan.stair.h} fill="#e0f2fe" stroke="#0369a1" strokeWidth="2" className="dark:fill-sky-950" />
                {Array.from({ length: 8 }, (_, i) => <line key={i} x1={plan.stair.x + 10} y1={plan.stair.y + 12 + i * 12} x2={plan.stair.x + plan.stair.w - 10} y2={plan.stair.y + 12 + i * 12} stroke="#0369a1" strokeWidth="1" />)}
                <text x={plan.stair.x + plan.stair.w / 2} y={plan.stair.y + plan.stair.h / 2 + 5} textAnchor="middle" fontSize="10" fontWeight="700" fill="#075985">STAIR</text>

                {/* common area / services */}
                <rect x={plan.common.x} y={plan.common.y} width={plan.common.w} height={plan.common.h} fill="#ecfdf5" stroke="#047857" strokeWidth="2" className="dark:fill-emerald-950" />
                <text x={plan.common.x + plan.common.w / 2} y={plan.common.y + 24} textAnchor="middle" fontSize="11" fontWeight="800" fill="#047857">COMMON / SERVICES</text>
                <text x={plan.common.x + plan.common.w / 2} y={plan.common.y + 47} textAnchor="middle" fontSize="10" fill="#047857">Electrical · Fire · Housekeeping</text>

                {/* doors and windows */}
                {plan.doors.map((d, i) => <path key={`d${i}`} d={`M${d.x1} ${d.y1} L${d.x2} ${d.y2}`} stroke="#b45309" strokeWidth="5" strokeLinecap="round" />)}
                {plan.windows.map((w, i) => <line key={`w${i}`} x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke="#38bdf8" strokeWidth="5" strokeLinecap="round" />)}

                {/* title block */}
                <g transform="translate(710 545)">
                  <rect width="245" height="62" fill="#fff" stroke="#475569" strokeWidth="1.5" className="dark:fill-slate-900" />
                  <text x="12" y="20" fontSize="10" fontWeight="800" letterSpacing="1.2" fill="#475569">3D CADASTRAL FLOOR PLAN</text>
                  <text x="12" y="38" fontSize="11" fontWeight="700" fill="#0f172a" className="dark:fill-slate-100">{safeBuilding.name} · L{String(floor).padStart(2, '0')}</text>
                  <text x="12" y="53" fontSize="9" fill="#64748b">SIMULATED / DEMO · NOT A SURVEY DRAWING</text>
                </g>
              </svg>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap gap-3">
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-slate-500 bg-slate-100" />Unit boundary</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-cyan-200 ring-1 ring-cyan-600" />Selected unit</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-700" />Vertical core</span>
              <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-700" />Common/service</span>
            </div>
            <span><DoorOpen size={12} className="mr-1 inline" />Doors · <span className="text-sky-500">Windows</span></span>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Floor selector" subtitle={`${safeBuilding.floors} levels in building`} right={<Layers3 size={15} className="text-cyan-500" />} />
            <div className="grid grid-cols-6 gap-1.5 p-4 sm:grid-cols-8 xl:grid-cols-6">
              {Array.from({ length: safeBuilding.floors }, (_, i) => i + 1).map((f) => (
                <button key={f} onClick={() => selectFloor(f)} className={`h-9 rounded-md text-xs font-semibold transition ${f === floor ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>L{f}</button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="label">Selected vertical unit</p><h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedUnit?.label ?? '—'}</h2><p className="text-xs text-slate-400">{selectedUnit?.type ?? 'No unit data'}</p></div>
              <Badge tone={selectedUnit?.vacant ? 'slate' : 'green'}>{selectedUnit?.vacant ? 'Vacant' : 'Registered'}</Badge>
            </div>
            {selectedUnit ? <>
              <div className="mt-4 space-y-2">
                <InfoRow icon={Ruler} label="Floor area" value={fmtArea(selectedUnit.areaM2)} />
                <InfoRow icon={Warehouse} label="Rights" value={selectedUnit.rights.replace('-', ' ')} />
                <InfoRow icon={ShieldCheck} label="Owner / holder" value={selectedUnit.owner} />
                <InfoRow icon={MapPin} label="Floor elevation" value={`${(safeBuilding.elevationBaseM + (floor - 1) * safeBuilding.floorHeightM).toFixed(1)} m`} />
              </div>
              <div className="mt-4"><p className="label">Unit ULPIN</p><UlpinDisplay ulpin={selectedUnit.ulpin} size="sm" /></div>
            </> : null}
          </Card>

          <Card className="p-5">
            <p className="label">Building context</p>
            <div className="mt-3 space-y-2 text-xs">
              <InfoRow icon={Building2} label="Building" value={safeBuilding.id} />
              <InfoRow icon={MapPin} label="Location" value={safeBuilding.address ?? center.address} />
              <InfoRow icon={MapPin} label="Coordinates" value={`${center.latitude.toFixed(6)}, ${center.longitude.toFixed(6)}`} />
              <InfoRow icon={ArrowUpDown} label="Vertical stack" value={`${safeBuilding.floors} floors · ${fmtNum(safeBuilding.heightM)} m`} />
              <InfoRow icon={ChevronUp} label="Circulation" value="2 lifts · protected stair · common corridor" />
              <InfoRow icon={CheckCircle2} label="Registry" value="Demo registry record" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60"><Icon size={13} className="mt-0.5 shrink-0 text-cyan-500" /><div className="min-w-0"><p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p><p className="truncate font-medium capitalize text-slate-700 dark:text-slate-200">{value}</p></div></div>;
}

function Dimension({ x1, y1, x2, y2, label, vertical = false }: { x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  return <g stroke="#64748b" fill="#64748b" strokeWidth="1"><line x1={x1} y1={y1} x2={x2} y2={y2} /><line x1={x1} y1={y1 - (vertical ? 0 : 5)} x2={x1} y2={y1 + (vertical ? 0 : 5)} /><line x1={x2} y1={y2 - (vertical ? 0 : 5)} x2={x2} y2={y2 + (vertical ? 0 : 5)} /><text x={mx} y={my - 6} textAnchor="middle" fontSize="10" fill="#475569" transform={vertical ? `rotate(-90 ${mx} ${my})` : undefined}>{label}</text></g>;
}

function buildFloorPlan(gw: number, gd: number, count: number) {
  const outer = { x: 130, y: 90, w: 610, h: 400 };
  const corridor = { x: 382, y: 105, w: 92, h: 370 };
  const core = { x: 382, y: 250, w: 145, h: 130 };
  const stair = { x: 560, y: 390, w: 140, h: 80 };
  const common = { x: 165, y: 405, w: 190, h: 65 };
  const units: Array<{ x: number; y: number; w: number; h: number }> = [];
  const left = { x: 145, y: 105, w: 220, h: 135 };
  const right = { x: 495, y: 105, w: 220, h: 135 };
  const lowerLeft = { x: 145, y: 255, w: 220, h: 135 };
  const lowerRight = { x: 495, y: 255, w: 220, h: 125 };
  [left, right, lowerLeft, lowerRight].slice(0, Math.min(4, Math.max(1, count))).forEach((r) => units.push(r));
  if (count > 4) {
    // Keep additional units legible by splitting the large apartment bays.
    units.splice(0, units.length, ...[left, right, lowerLeft, lowerRight].flatMap((r) => [
      { x: r.x, y: r.y, w: r.w / 2 - 3, h: r.h },
      { x: r.x + r.w / 2 + 3, y: r.y, w: r.w / 2 - 3, h: r.h },
    ]).slice(0, count));
  }
  const doors = units.map((r) => ({ x1: r.x + r.w / 2 - 12, y1: r.y + r.h, x2: r.x + r.w / 2 + 12, y2: r.y + r.h }));
  const windows = units.flatMap((r) => [
    { x1: r.x + 35, y1: r.y, x2: r.x + 90, y2: r.y },
    { x1: r.x + r.w - 90, y1: r.y, x2: r.x + r.w - 35, y2: r.y },
  ]);
  void gw; void gd;
  return { outer, corridor, core, stair, common, units, doors, windows };
}
