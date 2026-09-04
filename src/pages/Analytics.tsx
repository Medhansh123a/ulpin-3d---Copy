import {
  AlertTriangle, BadgeCheck, BrainCircuit, Building2, Fingerprint, Layers3, MapPinned, TrendingUp, Waves,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { Badge, Card, CardHeader, Progress, StatTile, Table, Td, Th } from '../components/ui';
import { useApp } from '../context/AppContext';
import { ANALYTICS, buildings, CONFLICTS, CONFIDENCE_TREND, FLOOR_DIST, TYPE_COLORS, ZONE_STATS } from '../data/mockData';
import { fmtArea, fmtNum } from '../utils/format';
import { DemoTag } from '../components/ui';

const ZONE_SHORT = ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone U'];

const TYPE_ORDER = ['residential', 'commercial', 'mixed-use', 'government', 'utility'] as const;
const typeDist = TYPE_ORDER.map((t) => ({
  name: t.replace('-', ' '),
  value: buildings.filter((b) => b.type === t).length,
  color: TYPE_COLORS[t],
})).filter((d) => d.value > 0);

const zoneData = ZONE_STATS.map((z, i) => ({ ...z, short: ZONE_SHORT[i] }));

export default function Analytics() {
  const { notify } = useApp();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Analytics & Registry</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Platform coverage, AI accuracy and open conflicts · simulated demo metrics</p>
        </div>
        <DemoTag />
      </div>

      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile icon={MapPinned} label="Parcels mapped" value={fmtNum(ANALYTICS.totalParcels)} sub="incl. legacy pending" tone="cyan" />
        <StatTile icon={Building2} label="3D properties" value={fmtNum(ANALYTICS.mapped3d)} sub={`${ANALYTICS.units} vertical parcels`} tone="violet" />
        <StatTile icon={Waves} label="Underground assets" value={fmtNum(ANALYTICS.undergroundAssets)} sub="lines + chambers" tone="teal" />
        <StatTile icon={BadgeCheck} label="Validated parcels" value={fmtNum(ANALYTICS.validated)} sub={`/ ${fmtNum(ANALYTICS.totalParcels)} total`} tone="green" />
        <StatTile icon={BrainCircuit} label="AI detection accuracy" value={`${ANALYTICS.aiAccuracy}%`} sub={`avg conf. ${ANALYTICS.avgConfidence}%`} tone="amber" />
        <StatTile icon={AlertTriangle} label="Conflicts detected" value={fmtNum(ANALYTICS.conflicts)} sub={`${CONFLICTS.filter((c) => c.status === 'open').length} still open`} tone="rose" />
      </div>

      {/* charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Parcels per zone" subtitle="Mapped parcels by planning zone" right={<MapPinned size={15} className="text-cyan-500" />} />
          <div className="h-60 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="short" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(100,116,139,0.08)' }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)' }}
                />
                <Bar dataKey="parcels" name="Parcels" radius={[4, 4, 0, 0]}>
                  {zoneData.map((z) => (
                    <Cell key={z.zone} fill={z.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="AI confidence trend" subtitle="Across 6 demo model runs" right={<TrendingUp size={15} className="text-cyan-500" />} />
          <div className="h-60 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CONFIDENCE_TREND} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="run" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Avg confidence']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(100,116,139,0.3)' }}
                />
                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3, fill: '#06b6d4' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Property type distribution" subtitle="26 3D properties by use" right={<Building2 size={15} className="text-cyan-500" />} />
          <div className="grid h-64 grid-cols-1 items-center gap-2 p-3 sm:grid-cols-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeDist} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3} strokeWidth={1}>
                  {typeDist.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-xs">
              {typeDist.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 capitalize text-slate-500 dark:text-slate-400">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
                  </span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Building height distribution" subtitle="Number of buildings by floor count" right={<Layers3 size={15} className="text-cyan-500" />} />
          <div className="h-64 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FLOOR_DIST} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
                <XAxis dataKey="floors" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" name="Buildings" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* zone table + conflicts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Zone coverage" subtitle="Rohini Sector 5 demo area · simulated 0.72 km²" right={<Fingerprint size={15} className="text-cyan-500" />} />
          <div className="overflow-x-auto">
            <Table head={<><Th>Zone</Th><Th>Parcels</Th><Th>Area</Th><Th>Share</Th></>}>
              {ZONE_STATS.map((z) => (
                <tr key={z.zone}>
                  <Td>
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: z.color }} /> {z.zone}
                    </span>
                  </Td>
                  <Td>{z.parcels}</Td>
                  <Td>{fmtArea(z.areaM2)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Progress value={(z.areaM2 / 850000) * 100} color="bg-cyan-500" className="w-24" />
                      <span className="font-mono text-xs">{Math.round((z.areaM2 / 850000) * 100)}%</span>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
            <p className="px-4 pb-3 text-[11px] text-slate-400">Share of mapped area (850,000 m² demo extent). Data volume ingested: {ANALYTICS.dataVolumeGb} GB (simulated).</p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Open conflicts" subtitle="Registry cross-checks" right={<AlertTriangle size={15} className="text-amber-500" />} />
          <div className="max-h-80 overflow-y-auto p-2">
            <Table head={<><Th>Case</Th><Th>Severity</Th><Th>Status</Th></>}>
              {CONFLICTS.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <p className="max-w-[180px] truncate font-semibold text-slate-700 dark:text-slate-200" title={c.title}>{c.title}</p>
                    <p className="text-[10px] text-slate-400">{c.id} · {c.type.replace(/-/g, ' ')}</p>
                  </Td>
                  <Td><Badge tone={c.severity === 'high' ? 'rose' : c.severity === 'medium' ? 'amber' : 'cyan'}>{c.severity}</Badge></Td>
                  <Td><Badge tone={c.status === 'resolved' ? 'green' : c.status === 'resolving' ? 'amber' : 'rose'}>{c.status}</Badge></Td>
                </tr>
              ))}
            </Table>
          </div>
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <button className="btn-secondary w-full text-xs" onClick={() => notify('Re-running demo conflict detection… results would appear here (simulated)', 'info')}>
              Re-run conflict detection (demo)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
