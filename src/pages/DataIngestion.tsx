import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle, Box, Camera, CheckCircle2, Database, FileText, HardDrive, Loader2, Map as MapIcon,
  Mountain, Rocket, Satellite, Trash2, UploadCloud,
} from 'lucide-react';
import { Badge, Card, CardHeader, DemoTag, EmptyState, Progress, Table, Td, Th } from '../components/ui';
import { useApp } from '../context/AppContext';
import { cx } from '../utils/format';

type ZoneKind = 'ortho' | 'lidar' | 'parcel' | 'floors' | 'gnss' | 'dem';

interface ZoneState {
  file: { name: string; size: number } | null;
  status: 'idle' | 'validating' | 'uploading' | 'done' | 'error';
  pct: number;
  error?: string;
}

const ZONES: Array<{ kind: ZoneKind; label: string; desc: string; accept: string[]; icon: React.ElementType; maxMb: number }> = [
  { kind: 'ortho', label: 'Drone imagery', desc: 'Orthophoto / mosaic tiles · 0.05 m GSD', accept: ['.tif', '.tiff', '.jp2', '.png'], icon: Camera, maxMb: 150 },
  { kind: 'lidar', label: 'LiDAR / point cloud', desc: 'Classified LAS/LAZ point clouds', accept: ['.las', '.laz', '.e57', '.ply'], icon: Box, maxMb: 500 },
  { kind: 'parcel', label: 'GIS parcel layer', desc: 'Polygon layer · EPSG:4326', accept: ['.shp', '.geojson', '.json', '.gml'], icon: MapIcon, maxMb: 100 },
  { kind: 'floors', label: 'Building floor plans', desc: 'CAD or PDF drawing sets', accept: ['.pdf', '.dwg', '.dxf'], icon: FileText, maxMb: 200 },
  { kind: 'gnss', label: 'GNSS / CORS survey', desc: 'Ground control points CSV', accept: ['.csv', '.txt', '.gps'], icon: Satellite, maxMb: 25 },
  { kind: 'dem', label: 'DEM / DSM', desc: 'Elevation rasters', accept: ['.tif', '.img', '.asc'], icon: Mountain, maxMb: 400 },
];

const STATUS_BADGE: Record<ZoneState['status'], { tone: 'green' | 'amber' | 'rose' | 'slate'; label: string }> = {
  idle: { tone: 'slate', label: 'Not started' },
  validating: { tone: 'amber', label: 'Validating' },
  uploading: { tone: 'amber', label: 'Processing' },
  done: { tone: 'green', label: 'Staged' },
  error: { tone: 'rose', label: 'Rejected' },
};

export default function DataIngestion() {
  const { notify } = useApp();
  const [zones, setZones] = useState<Record<ZoneKind, ZoneState>>(() =>
    Object.fromEntries(ZONES.map((z) => [z.kind, { file: null, status: 'idle' as const, pct: 0 }])) as Record<ZoneKind, ZoneState>,
  );
  const timers = useRef<number[]>([]);
  const [processing, setProcessing] = useState(false);
  const [procPct, setProcPct] = useState(0);
  const [procStage, setProcStage] = useState('');

  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const onFile = (kind: ZoneKind, f: File | undefined) => {
    if (!f) return;
    const zone = ZONES.find((z) => z.kind === kind)!;
    const ext = '.' + (f.name.split('.').pop() ?? '').toLowerCase();
    setZones((prev) => ({ ...prev, [kind]: { ...prev[kind], file: { name: f.name, size: f.size }, status: 'validating', pct: 0 } }));

    if (!zone.accept.includes(ext)) {
      window.setTimeout(() => {
        setZones((prev) => ({
          ...prev,
          [kind]: { ...prev[kind], status: 'error', error: `Unsupported format "${ext}". Expected: ${zone.accept.join(', ')}` },
        }));
        notify(`Rejected ${f.name} — unsupported format (demo validation)`, 'error');
      }, 700);
      return;
    }
    if (f.size > zone.maxMb * 1024 * 1024) {
      window.setTimeout(() => {
        setZones((prev) => ({
          ...prev,
          [kind]: { ...prev[kind], status: 'error', error: `File exceeds ${zone.maxMb} MB demo limit` },
        }));
        notify(`Rejected ${f.name} — exceeds ${zone.maxMb} MB (demo)`, 'error');
      }, 700);
      return;
    }
    notify(`Validating ${f.name}… (simulated checks: format, CRS, footprint)`, 'info');
    const iv = window.setInterval(() => {
      setZones((prev) => {
        const z = prev[kind];
        if (z.status !== 'uploading' && z.status !== 'validating') return prev;
        const next = Math.min(100, z.pct + 7 + Math.random() * 9);
        const done = next >= 100;
        if (done) {
          window.clearInterval(iv);
          notify(`${f.name} validated & staged to workspace (demo — no real processing)`, 'success');
        }
        return { ...prev, [kind]: { ...z, status: done ? 'done' : 'uploading' as const, pct: done ? 100 : next } };
      });
    }, 110);
    timers.current.push(iv);
  };

  const removeFile = (kind: ZoneKind) => {
    setZones((prev) => ({ ...prev, [kind]: { file: null, status: 'idle', pct: 0 } }));
    notify(`Removed dataset from ${ZONES.find((z) => z.kind === kind)!.label} (demo)`, 'info');
  };

  const processAll = () => {
    if (processing) return;
    const staged = Object.values(zones).filter((z) => z.status === 'done').length;
    if (staged === 0) {
      notify('Stage at least one dataset first (upload a file to any zone)', 'warning');
      return;
    }

    setProcessing(true);
    setProcPct(0);
    setProcStage('Registering assets');

    const stages = ['Registering assets', 'Extracting geometry', 'Validating topology', 'Publishing to registry'];
    const totalMs = 3600;
    const started = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const pct = Math.min(100, (elapsed / totalMs) * 100);
      const stageIndex = Math.min(stages.length - 1, Math.floor((pct / 100) * stages.length));
      setProcPct(pct);
      setProcStage(stages[stageIndex]);
      if (pct >= 100) {
        window.clearInterval(timer);
        setProcessing(false);
        setProcStage('Published to registry');
        notify('Demo job complete — assets added to registry (simulated)', 'success');
      }
    }, 80);
    timers.current.push(timer);
  };

  const stagedCount = Object.values(zones).filter((z) => z.status === 'done').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Data Ingestion</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upload survey data → validate → run the demo processing job</p>
        </div>
        <DemoTag />
      </div>

      {/* drop zones */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ZONES.map((z) => {
          const st = zones[z.kind];
          const Icon = z.icon;
          return (
            <Card key={z.kind} className={cx('p-4', st.status === 'error' && 'border-rose-300 dark:border-rose-900/60')}>
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{z.label}</p>
                    <p className="text-[11px] text-slate-400">{z.desc}</p>
                  </div>
                </div>
                <Badge tone={STATUS_BADGE[st.status].tone}>{STATUS_BADGE[st.status].label}</Badge>
              </div>

              {st.status === 'error' ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  <p className="flex items-start gap-1.5"><AlertCircle size={13} className="mt-0.5 shrink-0" /> {st.error}</p>
                </div>
              ) : st.file ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">{st.file.name}</p>
                      <p className="text-[10px] text-slate-400">{(st.file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    {st.status === 'done' ? (
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    ) : (
                      <button onClick={() => removeFile(z.kind)} className="shrink-0 text-slate-400 hover:text-rose-500" aria-label="Remove">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {(st.status === 'validating' || st.status === 'uploading') && (
                    <div className="mt-2">
                      <Progress value={st.pct} color={st.status === 'uploading' ? 'bg-cyan-500' : 'bg-amber-500'} />
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                        <Loader2 size={10} className="animate-spin" />
                        {st.status === 'validating' ? 'Validating format, CRS & geometry…' : `${Math.round(st.pct)}% staged`}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <label
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 px-3 py-6 text-center transition-colors hover:border-cyan-400 hover:bg-cyan-50/40 dark:border-slate-700 dark:hover:border-cyan-500 dark:hover:bg-cyan-500/5"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onFile(z.kind, e.dataTransfer.files?.[0]); }}
                >
                  <UploadCloud size={20} className="mb-2 text-slate-400" />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Drop file or click to browse</p>
                  <p className="mt-1 font-mono text-[10px] text-slate-400">{z.accept.join(' ')} · ≤ {z.maxMb} MB</p>
                  <input type="file" className="hidden" accept={z.accept.join(',')} onChange={(e) => onFile(z.kind, e.target.files?.[0])} />
                </label>
              )}
            </Card>
          );
        })}
      </div>

      {/* processing + queue */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Ingestion queue"
            subtitle={`${stagedCount} dataset(s) staged in demo workspace`}
            right={<Database size={15} className="text-cyan-500" />}
          />
          <div className="overflow-x-auto">
            {stagedCount === 0 ? (
              <EmptyState
                icon={HardDrive}
                title="Queue is empty"
                body="Upload a file to any zone above. Validation and staging are simulated — no real data leaves your browser."
              />
            ) : (
              <Table head={<><Th>Dataset</Th><Th>Kind</Th><Th>Size</Th><Th>Status</Th></>}>
                {ZONES.filter((z) => zones[z.kind].file).map((z) => {
                  const st = zones[z.kind];
                  return (
                    <tr key={z.kind}>
                      <Td className="max-w-[220px] truncate font-semibold">{st.file!.name}</Td>
                      <Td>{z.label}</Td>
                      <Td>{(st.file!.size / 1024 / 1024).toFixed(1)} MB</Td>
                      <Td>
                        <Badge tone={STATUS_BADGE[st.status].tone}>{STATUS_BADGE[st.status].label}</Badge>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Processing job" subtitle="Register → validate → publish" right={<Rocket size={15} className="text-cyan-500" />} />
          <div className="p-4">
            <button className="btn-primary w-full" onClick={processAll} disabled={processing || stagedCount === 0}>
              {processing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
              {processing ? 'Running job…' : 'Process staged datasets'}
            </button>
            {processing ? (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">{procStage || 'Starting…'}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{Math.round(procPct)}%</span>
                </div>
                <Progress value={procPct} />
                <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                  Simulated pipeline: assets are registered with generated 3D ULPINs, topology-validated, then published to the registry.
                </p>
              </div>
            ) : stagedCount > 0 ? (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                {stagedCount} dataset(s) ready. The demo job generates 3D ULPINs, runs topology checks and publishes records — all simulated.
              </p>
            ) : (
              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                Stage at least one dataset to enable the processing job.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
