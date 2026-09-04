import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Award, Box, Building2, CheckCircle2, ChevronRight, Layers3, MapPin, Network,
  ShieldCheck, Sparkles, Target, Waves, XCircle, Sun, Moon,
} from 'lucide-react';
import { Badge, Card, DemoTag } from '../components/ui';
import { buildUlpin, ulpinParts } from '../utils/ulpin';
import { DEFAULT_MAP, extrude, project, toPath, type MapState } from '../utils/geometry';
import { shade } from '../utils/format';
import { buildings } from '../data/mockData';
import { useApp } from '../context/AppContext';

const FEATURES = [
  { icon: Box, t: '3D ULPIN identity', d: 'Every parcel, floor and underground asset gets one machine-readable, checksummed spatial ID.' },
  { icon: Layers3, t: 'Vertical cadastre', d: 'Floors, air-rights and sub-surface strata modelled as first-class 3D objects, not map footnotes.' },
  { icon: Network, t: 'Underground utility layer', d: 'Water, sewer, power, gas and telecom corridors visualised below the surface.' },
  { icon: Sparkles, t: 'AI-assisted mapping', d: 'Building extraction, floor segmentation and topology validation with confidence scoring.' },
  { icon: ShieldCheck, t: 'Conflict detection', d: 'Cross-layer checks catch duplicate registrations and z-range overlaps early.' },
  { icon: MapPin, t: 'GNSS-ready', d: 'Grid coordinates are tied to a local projected CRS for field survey integration.' },
];

const CAPABILITIES = [
  { t: 'Automated building extraction', v: 96, note: 'DL segmentation from drone orthophoto' },
  { t: 'Floor slab segmentation', v: 92, note: 'LiDAR point density + facade cues' },
  { t: 'Vertical parcel delineation', v: 93, note: '3D space partitioning with air envelopes' },
  { t: 'Topology validation', v: 98, note: 'Adjacency, containment, z-range checks' },
];

export default function Landing() {
  const { theme, toggleTheme } = useApp();
  const example = useMemo(
    () =>
      buildUlpin({
        country: 'IN', state: 'DL', district: 'NWD', zone: 'R5', parcel: 'R5A0', floor: '12', unit: 'A1',
      }),
    [],
  );
  const parts = useMemo(() => ulpinParts(example), [example]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 lg:px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950">
            <Box size={17} strokeWidth={2.2} />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            3D <span className="text-cyan-600 dark:text-cyan-400">ULPIN</span>
          </span>
          <nav className="ml-8 hidden items-center gap-6 text-sm font-medium text-slate-500 lg:flex dark:text-slate-400">
            <a href="#problem" className="hover:text-slate-800 dark:hover:text-slate-200">Problem</a>
            <a href="#how" className="hover:text-slate-800 dark:hover:text-slate-200">How it works</a>
            <a href="#features" className="hover:text-slate-800 dark:hover:text-slate-200">Capabilities</a>
            <a href="#benefits" className="hover:text-slate-800 dark:hover:text-slate-200">Benefits</a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/generator" className="btn-ghost hidden sm:inline-flex">Generate ULPIN</Link>
            <button className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700" onClick={toggleTheme} aria-label="Toggle light and dark theme" title="Toggle light / dark theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link to="/dashboard" className="btn-primary">Launch dashboard <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="gis-grid-bg pointer-events-none absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 dark:to-slate-950" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:px-6 lg:py-24">
          <div>
            <Badge tone="cyan" className="mb-4"><Sparkles size={11} /> Government-grade 3D cadastral platform</Badge>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              A unique spatial identity for{' '}
              <span className="text-cyan-600 dark:text-cyan-400">every property — in 3D</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              3D ULPIN gives land parcels, multi-storey properties and underground infrastructure a single,
              verifiable vertical identifier — replacing fragmented planar land records with one consistent,
              3D spatial registry for urban governance.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className="btn-primary"><Layers3 size={16} /> Explore 3D Map</Link>
              <a href="#how" className="btn-secondary">See how 3D ULPIN works <ChevronRight size={14} /></a>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              {[
                ['64', 'parcels mapped'],
                ['26', '3D properties'],
                ['86', 'underground assets'],
                ['92.6%', 'avg. AI confidence'],
              ].map(([v, l]) => (
                <div key={l}>
                  <dt className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{v}</dt>
                  <dd className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{l}</dd>
                </div>
              ))}
            </dl>
          </div>
          <HeroCity />
        </div>
      </section>

      {/* problem / solution */}
      <section id="problem" className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Problem</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Planar land records cannot see the third dimension</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: XCircle, t: 'Invisible floors', d: 'A 10-storey tower and a ground-floor shop under it share the same 2D parcel ID, so rights and revenue are ambiguous.' },
            { icon: Waves, t: 'Hidden infrastructure', d: 'Buried water, sewer, power and gas corridors are missing from ordinary cadastres — until a dig cuts one.' },
            { icon: Target, t: 'Duplicate identities', d: 'Departments issue their own codes for the same asset; reconciling them takes weeks of manual work.' },
          ].map((x) => (
            <Card key={x.t} className="card-hover p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400">
                <x.icon size={17} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{x.t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{x.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 lg:grid-cols-2 lg:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Solution</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">One 3D identifier end-to-end</h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              The 3D ULPIN is a compact, checksummed code that travels with a spatial object from survey to registry:
              horizontal parts locate it on the map; vertical parts locate it in the building — and underground assets
              get their own dedicated corridor space.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                'One ID per vertical object — parcel, floor, unit, utility corridor',
                'Luhn-mod-34 check digit catches transcription errors before they hit the registry',
                'Fits existing parcel systems: it extends, rather than replaces, today’s codes',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-500" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
              <DemoTag />
              <span>All platform data and pipelines are simulated for demonstration.</span>
            </div>
          </div>

          {/* ULPIN anatomy */}
          <Card id="how" className="p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">How it works</p>
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">3D ULPIN anatomy</h3>
            <div className="mb-4 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
              <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 font-bold text-cyan-700 dark:text-cyan-300">3DULPIN</span>
              {example.split('-').slice(1).map((s, i) => (
                <span key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {s}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.values(parts).map((p) => (
                <div key={p.label} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{p.value}</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{p.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Horizontal: country · state · district · zone · parcel. Vertical: floor key · vertical unit. The final digit is a Luhn-mod-34
              check digit used by the platform’s validator.
            </p>
          </Card>
        </div>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Capabilities</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Built for urban governance</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.t} className="card-hover p-5">
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300">
                <f.icon size={17} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{f.t}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{f.d}</p>
            </Card>
          ))}
        </div>

        {/* AI confidence */}
        <div className="mt-10 grid gap-6 lg:grid-cols-5">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-100">
                <BrainIcon /> AI / ML capabilities
              </div>
              <Badge tone="amber"><Sparkles size={11} /> demo models</Badge>
            </div>
            <div className="space-y-4">
              {CAPABILITIES.map((c) => (
                <div key={c.t}>
                  <div className="mb-1 flex items-baseline justify-between text-xs">
                    <span className="font-medium text-slate-600 dark:text-slate-300">{c.t}</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{c.v}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full rounded-full bg-cyan-500" style={{ width: `${c.v}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{c.note}</p>
                </div>
              ))}
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-3">
            {[
              { icon: Award, t: 'Confidence scoring', d: 'Every detection carries a transparent confidence estimate so operators know what to review.' },
              { icon: ShieldCheck, t: 'Validation first', d: 'Generated geometry is checked against topology rules before it reaches the registry.' },
              { icon: Network, t: 'Layered registry', d: 'Parcels, floors, units and utilities cross-reference each other through the same ULPIN family.' },
              { icon: Building2, t: 'Floor-wise transparency', d: 'Property tax, ownership and usage can be resolved per floor, not per footprint.' },
            ].map((x) => (
              <Card key={x.t} className="card-hover p-5">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <x.icon size={17} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{x.t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{x.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* benefits */}
      <section id="benefits" className="border-t border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">Benefits</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">What vertical identity unlocks</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              ['Revenue', 'Floor-level property tax and occupancy charges computed from a single source of truth.'],
              ['Disaster response', 'Emergency teams locate units and shutoff valves by depth and floor, not guesswork.'],
              ['Planning', 'Air-rights and underground envelopes become visible inputs for transit and utility planning.'],
              ['Dispute resolution', 'Z-range and registration conflicts are surfaced automatically, with evidence attached.'],
            ].map(([t, d]) => (
              <Card key={t} className="card-hover p-5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{t}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{d}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cyan-500/30 bg-cyan-50 p-6 dark:border-cyan-500/20 dark:bg-cyan-500/5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to inspect the demo district?</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Open the 3D dashboard, select a building, and switch floors or underground layers.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/dashboard" className="btn-primary"><Layers3 size={16} /> Explore 3D Map</Link>
              <Link to="/ai" className="btn-secondary">AI Analysis</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center lg:px-6">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">3D <span className="text-cyan-600 dark:text-cyan-400">ULPIN</span> · Smart Vertical Property Mapping System</p>
            <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
              Prototype for demonstration — simulated city dataset, simulated ML pipelines. No real survey or registry data is claimed.
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link to="/dashboard" className="hover:text-slate-800 dark:hover:text-slate-200">Dashboard</Link>
            <Link to="/data" className="hover:text-slate-800 dark:hover:text-slate-200">Data ingestion</Link>
            <Link to="/analytics" className="hover:text-slate-800 dark:hover:text-slate-200">Analytics</Link>
            <span className="text-slate-300 dark:text-slate-600">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BrainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-600 dark:text-cyan-400">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44A2.5 2.5 0 0 1 4 17.5v-1A2.5 2.5 0 0 1 2 14v-2a2.5 2.5 0 0 1 2-2.45V7.5A2.5 2.5 0 0 1 6.5 5h.25A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44A2.5 2.5 0 0 0 20 17.5v-1A2.5 2.5 0 0 0 22 14v-2a2.5 2.5 0 0 0-2-2.45V7.5A2.5 2.5 0 0 0 17.5 5h-.25A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

/** Static isometric city sketch for the hero (uses the same projection as the real map). */
function HeroCity() {
  const s: MapState = { ...DEFAULT_MAP, yaw: -0.5, pitch: 0.45, zoom: 0.85, panX: 0, panY: -10 };
  const W = 560;
  const H = 420;

  const elems = useMemo(() => {
    const grid: React.ReactNode[] = [];
    for (let i = 0; i <= 10; i++) {
      grid.push(<line key={`v${i}`} x1={project(i, 0, 0, s)[0]} y1={project(i, 0, 0, s)[1]} x2={project(i, 10, 0, s)[0]} y2={project(i, 10, 0, s)[1]} stroke="var(--map-grid)" strokeWidth={0.5} />);
      grid.push(<line key={`h${i}`} x1={project(0, i, 0, s)[0]} y1={project(0, i, 0, s)[1]} x2={project(10, i, 0, s)[0]} y2={project(10, i, 0, s)[1]} stroke="var(--map-grid)" strokeWidth={0.5} />);
    }
    const boxes = [
      { x: 0.8, y: 1.2, w: 2, d: 2, h: 4.2, c: '#38bdf8' },
      { x: 3.4, y: 1.2, w: 2, d: 2, h: 6.4, c: '#fbbf24' },
      { x: 0.8, y: 4.2, w: 2, d: 2, h: 3.4, c: '#a78bfa' },
      { x: 3.4, y: 4.2, w: 2, d: 2, h: 5.2, c: '#22d3ee' },
      { x: 6.2, y: 2.6, w: 2.6, d: 2.6, h: 7.8, c: '#34d399' },
      { x: 5.4, y: 6.4, w: 1.8, d: 1.8, h: 3.0, c: '#f472b6' },
      { x: 8.0, y: 6.2, w: 1.8, d: 1.8, h: 4.4, c: '#818cf8' },
      { x: 1.0, y: 7.0, w: 1.8, d: 1.8, h: 2.6, c: '#fb923c' },
    ];
    const city = boxes
      .map((b) => ({ ...b, ex: extrude(b.x, b.y, b.w, b.d, b.h, s) }))
      .sort((a, bb) => bb.ex.walls[0]?.depth ?? 0 - (a.ex.walls[0]?.depth ?? 0));
    return { grid, city };
  }, []);

  const ground = useMemo(() => {
    const pts = ([
      [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
    ] as Array<[number, number, number]>).map(([x, y, z]) => project(x, y, z, s));
    return toPath(pts);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[var(--map-bg)] shadow-lg dark:border-slate-800">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" style={{ minHeight: 340 }}>
        <path d={ground} fill="var(--map-bg)" stroke="var(--map-pcl)" strokeWidth={1} />
        {elems.grid}
        {/* river */}
        <path
          d={toPath(([[2.8, 10], [3.6, 7.6], [3.1, 5.4], [3.9, 3.2], [3.4, 0]] as Array<[number, number]>).map(([x, y]) => project(x, y, 0.02, s)))}
          fill="none" stroke="var(--map-water)" strokeWidth={6} strokeLinecap="round" opacity={0.9}
        />
        {/* road */}
        <line x1={project(5, 0, 0.01, s)[0]} y1={project(5, 0, 0.01, s)[1]} x2={project(5, 10, 0.01, s)[0]} y2={project(5, 10, 0.01, s)[1]} stroke="var(--map-road)" strokeWidth={3.4} />
        {elems.city.map((b, i) => (
          <g key={i}>
            <ellipse cx={project(b.x + b.w / 2, b.y + b.d / 2, 0, s)[0]} cy={project(b.x + b.w / 2, b.y + b.d / 2, 0, s)[1]} rx={b.w * s.zoom * 5.5} ry={b.d * s.zoom * 4.2} fill="var(--map-shadow)" />
            {b.ex.walls.map((w, wi) => (
              <path key={wi} d={toPath(w.pts)} fill={wi < b.ex.walls.length / 2 ? shade(b.c, -0.3) : shade(b.c, 0.05)} stroke={shade(b.c, -0.4)} strokeWidth={0.7} />
            ))}
            <path d={toPath(b.ex.top)} fill={shade(b.c, 0.3)} stroke={shade(b.c, -0.2)} strokeWidth={0.8} />
          </g>
        ))}
      </svg>
      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-white/85 px-2 py-1 text-[10px] font-semibold text-slate-500 shadow ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/85 dark:text-slate-400 dark:ring-slate-700">
        <MapPin size={11} className="text-cyan-500" /> Simulated New Delhi · Rohini Sector 5
      </div>
      <Link to="/dashboard" className="absolute bottom-3 right-3 btn-primary !px-3 !py-1.5 text-xs shadow-lg">
        Explore 3D Map <ArrowRight size={13} />
      </Link>
    </div>
  );
}
