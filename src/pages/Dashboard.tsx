import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge, Card, Progress, Seg, Skeleton, Table, Td, Th, EmptyState, CardHeader, DemoTag } from '../components/ui';
import Map3D from '../components/Map3D';
import EntityInfoPanel from '../components/EntityInfoPanel';
import { Building2, Layers3, MapPinned, Waves, MousePointerClick } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildings, parcels, ANALYTICS } from '../data/mockData';
import { fmtArea } from '../utils/format';

export default function Dashboard() {
  const { selected, select } = useApp();
  const location = useLocation();
  const [tiles, setTiles] = useState(false);
  const [bld, setBld] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const entity = (location.state as { entity?: { kind: 'parcel' | 'building' | 'unit' | 'utility'; id: string } } | null)?.entity;
    if (entity) select(entity);
  }, [location.state, select]);

  const flt = bld === 'all' ? buildings : buildings.filter((b) => b.type === bld);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">3D GIS Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Interactive 3D cadastre · Rohini Sector 5, New Delhi · simulated demo dataset</p>
        </div>
        <div className="flex items-center gap-2">
          <Seg
            value={bld}
            onChange={setBld}
            options={[
              { v: 'all', label: 'All' },
              { v: 'residential', label: 'Residential' },
              { v: 'commercial', label: 'Commercial' },
              { v: 'mixed-use', label: 'Mixed' },
              { v: 'government', label: 'Govt' },
            ]}
          />
          <Seg
            value={tiles ? 't' : 'm'}
            onChange={(v) => setTiles(v === 't')}
            options={[
              { v: 'm', label: '3D' },
              { v: 't', label: 'Tiles' },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="relative min-h-[480px] overflow-hidden lg:col-span-2">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
              <div className="flex flex-col items-center gap-3">
                <svg className="h-8 w-8 animate-spin text-cyan-500" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-slate-400">Loading 3D scene…</p>
              </div>
            </div>
          ) : (
            <Map3D />
          )}
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full bg-slate-900/70 px-3 py-1.5 text-[11px] text-slate-200 backdrop-blur md:flex">
            <MousePointerClick size={12} className="text-cyan-400" /> Click any building or parcel to inspect · use layer buttons for floors & underground
          </div>
        </Card>

        <div className="space-y-4">
          {selected ? (
            <div className="max-h-[560px] overflow-y-auto pr-1">
              <EntityInfoPanel entity={selected} compact />
            </div>
          ) : (
            <Card>
              <EmptyState
                icon={MapPinned}
                title="Nothing selected yet"
                body="Click a building, parcel or utility asset on the 3D map to load its spatial identity, 3D ULPIN and vertical profile here."
              />
            </Card>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader title="Parcels" subtitle={`${ANALYTICS.totalParcels} mapped`} right={<MapPinned size={15} className="text-cyan-500" />} />
          <div className="p-4">
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
            ) : (
              <Table head={<><Th>Parcel</Th><Th>Use</Th><Th>Area</Th><Th>Status</Th></>}>
                {parcels.slice(0, 6).map((p) => (
                  <tr key={p.id}>
                    <Td className="font-mono text-xs">{p.id}</Td>
                    <Td>{p.landUse.split(' ')[0]}</Td>
                    <Td>{fmtArea(p.areaM2)}</Td>
                    <Td><Badge tone={p.status === 'validated' ? 'green' : p.status === 'pending' ? 'amber' : 'rose'}>{p.status}</Badge></Td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Buildings" subtitle={`${buildings.length} extruded`} right={<Building2 size={15} className="text-cyan-500" />} />
          <div className="p-4">
            {loading ? (
              <div className="space-y-2"><Skeleton className="h-8" /><Skeleton className="h-8" /></div>
            ) : (
              <Table head={<><Th>Building</Th><Th>Type</Th><Th>Floors</Th></>}>
                {flt.slice(0, 7).map((b) => (
                  <tr key={b.id}>
                    <Td>{b.name}</Td>
                    <Td><Badge tone="cyan">{b.type.replace('-', ' ')}</Badge></Td>
                    <Td>{b.floors}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </Card>
        <Card>
          <CardHeader title="Coverage" subtitle="Detection confidence" right={<Layers3 size={15} className="text-cyan-500" />} />
          <div className="space-y-3 p-4">
            {[
              { label: 'Parcels digitised', v: 96 },
              { label: 'Buildings extracted', v: 98 },
              { label: 'Floors segmented', v: 91 },
              { label: 'Topology validated', v: 98 },
              { label: 'Underground mapped', v: 86 },
            ].map((x) => (
              <div key={x.label}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{x.label}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{x.v}%</span>
                </div>
                <Progress value={x.v} color={x.v >= 95 ? 'bg-emerald-500' : x.v >= 90 ? 'bg-cyan-500' : 'bg-amber-500'} />
              </div>
            ))}
            <div className="pt-1"><DemoTag /></div>
          </div>
        </Card>
        <Card>
          <CardHeader title="Underground assets" subtitle="Simulated survey" right={<Waves size={15} className="text-cyan-500" />} />
          <div className="space-y-2 p-4 text-xs">
            <p className="rounded-lg bg-slate-50 p-3 leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              {ANALYTICS.undergroundAssets} mapped assets · utility corridors shown in dashed lines. Depth values are illustrative (−1.2 m to −4.1 m).
            </p>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <li className="flex justify-between"><span>Water · 900 mm</span><span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">−2.5 m</span></li>
              <li className="flex justify-between"><span>Sewage · 1200 mm</span><span className="font-mono text-xs text-amber-600 dark:text-amber-400">−4.1 m</span></li>
              <li className="flex justify-between"><span>Power · 110 kV</span><span className="font-mono text-xs text-yellow-600 dark:text-yellow-400">−1.2 m</span></li>
              <li className="flex justify-between"><span>Gas · 300 mm</span><span className="font-mono text-xs text-rose-600 dark:text-rose-400">−1.8 m</span></li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
