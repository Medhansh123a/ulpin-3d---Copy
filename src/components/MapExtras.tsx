import { Box, Landmark, Building2, CircleDot, Map, Waves } from 'lucide-react';
import { TYPE_COLORS, UTILITY_COLORS } from '../data/mockData';
import { Card } from './ui';
import { cx } from '../utils/format';

const TYPE_LABELS: Record<string, string> = {
  residential: 'Residential',
  commercial: 'Commercial',
  'mixed-use': 'Mixed-use',
  government: 'Government',
  utility: 'Utility',
};

export function MapLegend() {
  return (
    <Card className="p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Legend</p>
      <div className="space-y-3 text-xs">
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300"><Building2 size={13} /> Building types</p>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.entries(TYPE_COLORS) as Array<[string, string]>).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: v }} /> {TYPE_LABELS[k] ?? k}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300"><Waves size={13} /> Underground utilities</p>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(UTILITY_COLORS).map(([k, v]) => (
              <span key={k} className="flex items-center gap-1.5 capitalize text-[11px] text-slate-500 dark:text-slate-400">
                <span className="h-0.5 w-3.5 rounded" style={{ background: v }} /> {k}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="inline-block h-2.5 w-2.5 rounded-xs border border-dashed border-slate-400" /> Parcel boundary (demo)
          <span className="ml-auto inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> selected</span>
        </div>
      </div>
    </Card>
  );
}

export function LayersPanel({ layers, onChange }: { layers: Record<string, boolean>; onChange: (k: string, v: boolean) => void }) {
  const items = [
    { k: 'parcels', label: 'Parcel boundaries', icon: Map },
    { k: 'roads', label: 'Roads', icon: Landmark },
    { k: 'underground', label: 'Underground utilities', icon: CircleDot },
    { k: 'buildings', label: 'Buildings', icon: Building2 },
  ];
  return (
    <Card className="p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <Box size={13} /> Layer controls
      </p>
      <div className="space-y-2">
        {items.map((it) => (
          <label key={it.k} className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
            <span className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <it.icon size={14} className="text-slate-400" /> {it.label}
            </span>
            <input
              type="checkbox"
              checked={layers[it.k]}
              onChange={(e) => onChange(it.k, e.target.checked)}
              className="h-4 w-4 rounded accent-cyan-600"
            />
          </label>
        ))}
      </div>
    </Card>
  );
}

export function ZoneChip({ zone, color, active, onClick }: { zone: string; color: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-cyan-500 bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'
          : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300',
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {zone}
    </button>
  );
}
