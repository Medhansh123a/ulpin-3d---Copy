import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle, Boxes, BrainCircuit, Building2, CheckCircle2, Cpu, Layers3, Loader2, Map,
  Network, Play, ShieldCheck,
} from 'lucide-react';
import { Badge, Card, CardHeader, DemoTag, Progress, Table, Td, Th, EmptyState } from '../components/ui';
import { useApp } from '../context/AppContext';
import { CONFLICTS, DETECTIONS } from '../data/mockData';
import type { DetectionStatus } from '../types';
import { cx } from '../utils/format';

type StepState = 'idle' | 'running' | 'done';
type Step = { state: StepState; pct: number };

const PIPELINE = [
  { id: 'acq', label: 'Data acquisition', desc: 'Drone orthophoto · LiDAR · parcel SHP · GNSS (simulated inputs)', icon: Map },
  { id: 'ext', label: 'Automated building extraction', desc: 'Deep-learning segmentation of footprints from orthophoto', icon: Building2 },
  { id: 'flr', label: 'Floor slab segmentation', desc: 'LiDAR point-density & facade window-line cues', icon: Layers3 },
  { id: 'vpd', label: 'Vertical parcel delineation', desc: '3D space partitioning into floor-level sub-parcels', icon: Boxes },
  { id: 'top', label: 'Intelligent topology validation', desc: 'Adjacency, containment & z-range continuity checks', icon: Network },
  { id: 'cfl', label: 'Ownership conflict detection', desc: 'Cross-layer registry comparison against extracted geometry', icon: AlertTriangle },
];

const KIND_META: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  building: { icon: Building2, cls: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300', label: 'Extraction' },
  floor: { icon: Layers3, cls: 'bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300', label: 'Segmentation' },
  parcel: { icon: Boxes, cls: 'bg-teal-100 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300', label: 'Delineation' },
  topology: { icon: Network, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300', label: 'Validation' },
  ownership: { icon: AlertTriangle, cls: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300', label: 'Conflicts' },
};

const STATUS_TONE: Record<DetectionStatus, 'green' | 'amber' | 'slate'> = {
  completed: 'green',
  processing: 'amber',
  queued: 'slate',
};

export default function AIAnalysis() {
  const { notify } = useApp();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>(PIPELINE.map(() => ({ state: 'idle' as StepState, pct: 0 })));
  const timers = useRef<number[]>([]);

  useEffect(() => () => {
    timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const runPipeline = () => {
    if (running) return;
    setRunning(true);
    setSteps(PIPELINE.map(() => ({ state: 'idle' as StepState, pct: 0 })));
    PIPELINE.forEach((_, i) => {
      const tStart = window.setTimeout(() => {
        setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, state: 'running' as StepState, pct: 8 } : x)));
        const iv = window.setInterval(() => {
          setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, pct: Math.min(100, x.pct + 6 + Math.random() * 8) } : x)));
        }, 90);
        timers.current.push(iv);
        const tDone = window.setTimeout(() => {
          window.clearInterval(iv);
          setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, state: 'done' as StepState, pct: 100 } : x)));
          if (i === PIPELINE.length - 1) {
            setRunning(false);
            notify('Demo pipeline finished — outputs are simulated, not from real ML inference', 'success');
          }
        }, 700 + i * 620);
        timers.current.push(tDone);
      }, i * 540);
      timers.current.push(tStart);
    });
  };

  const completedRuns = DETECTIONS.filter((d) => d.status === 'completed').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">AI Analysis</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Automated extraction, floor segmentation & topology validation</p>
        </div>
        <div className="flex items-center gap-2">
          <DemoTag />
          <button className="btn-primary" onClick={runPipeline} disabled={running}>
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? 'Processing…' : 'Run demo analysis'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* pipeline */}
        <Card className="lg:col-span-2">
          <CardHeader title="Processing pipeline" subtitle="Simulated job · stages advance in sequence" />
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {PIPELINE.map((s, i) => {
              const st = steps[i] ?? { state: 'idle' as StepState, pct: 0 };
              const Icon = s.icon;
              return (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', st.state === 'done' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : st.state === 'running' ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500')}>
                    {st.state === 'done' ? <CheckCircle2 size={17} /> : st.state === 'running' ? <Loader2 size={17} className="animate-spin" /> : <Icon size={17} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{s.label}</p>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {st.state === 'done' ? 'complete' : st.state === 'running' ? `${Math.round(st.pct)}%` : 'queued'}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-slate-400">{s.desc}</p>
                    <Progress value={st.pct} className="mt-1.5" color={st.state === 'done' ? 'bg-emerald-500' : 'bg-cyan-500'} />
                  </div>
                  <span className="w-10 text-right font-mono text-[10px] text-slate-300 dark:text-slate-600">S{i + 1}</span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* detection cards */}
        <div className="space-y-3">
          {DETECTIONS.map((d) => {
            const meta = KIND_META[d.kind];
            const Icon = meta.icon;
            return (
              <Card key={d.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cx('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.cls)}>
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{d.title}</p>
                      <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400">{d.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <ConfidenceRing value={d.confidence} running={d.status === 'processing'} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Confidence</p>
                        <p className="font-mono text-sm font-bold text-slate-800 dark:text-slate-100">{d.confidence.toFixed(1)}%</p>
                        <p className="truncate text-[10px] text-slate-400">{d.metric}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* outputs + conflicts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="AI output preview"
            subtitle={`${completedRuns} completed runs · figures are simulated`}
            right={<Cpu size={15} className="text-cyan-500" />}
          />
          <div className="grid gap-4 p-4 sm:grid-cols-3">
            {[
              { l: 'Footprints extracted', v: '382 / 390' },
              { l: 'Floors segmented', v: '216' },
              { l: 'Vertical parcels', v: '1,284' },
            ].map((x) => (
              <div key={x.l} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <p className="font-mono text-lg font-bold text-slate-800 dark:text-slate-100">{x.v}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{x.l}</p>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500" /> Topology validation summary
            </p>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {['4,278 adjacency rules passed', '186 containment checks passed', '48 z-range continuity passed', '0 hard failures'].map((t) => (
                <span key={t} className="chip bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{t}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Conflicts detected" subtitle="Ownership & geometry" right={<AlertTriangle size={15} className="text-amber-500" />} />
          <div className="max-h-72 overflow-y-auto p-2">
            {CONFLICTS.length === 0 ? (
              <EmptyState icon={ShieldCheck} title="No conflicts" body="Cross-layer comparison found no issues." />
            ) : (
              <Table head={<><Th>Case</Th><Th>Severity</Th><Th>Status</Th></>}>
                {CONFLICTS.map((c) => (
                  <tr key={c.id}>
                    <Td>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{c.title}</p>
                      <p className="text-[10px] text-slate-400">{c.id}</p>
                    </Td>
                    <Td><Badge tone={c.severity === 'high' ? 'rose' : c.severity === 'medium' ? 'amber' : 'cyan'}>{c.severity}</Badge></Td>
                    <Td><Badge tone={c.status === 'resolved' ? 'green' : c.status === 'resolving' ? 'amber' : 'rose'}>{c.status}</Badge></Td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ConfidenceRing({ value, running }: { value: number; running?: boolean }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative h-12 w-12 shrink-0">
      <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-200 dark:text-slate-700" />
        <circle
          cx="24" cy="24" r={r} fill="none" strokeWidth="4" strokeLinecap="round"
          stroke="#06b6d4"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * value) / 100}
          className={running ? 'animate-pulse' : undefined}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] font-bold text-slate-700 dark:text-slate-200">
        {running ? '…' : Math.round(value)}
      </span>
    </div>
  );
}
