import React from 'react';
import { cx } from '../utils/format';

/** Segmented 3D ULPIN display with per-segment styling. */
export default function UlpinDisplay({
  ulpin,
  size = 'md',
  className,
  mono = true,
}: {
  ulpin: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  mono?: boolean;
}) {
  const segs = ulpin.split('-');
  const sizeCls =
    size === 'lg'
      ? 'text-base sm:text-lg'
      : size === 'sm'
        ? 'text-xs'
        : 'text-sm';
  return (
    <span
      className={cx(
        'inline-flex flex-wrap items-center gap-y-0.5 rounded-lg bg-slate-100 px-2.5 py-1.5 ring-1 ring-slate-200 dark:bg-slate-800/80 dark:ring-slate-700',
        mono ? 'font-mono' : '',
        sizeCls,
        className,
      )}
    >
      {segs.map((s, i) => (
        <span key={i} className="flex items-center">
          <span
            className={cx(
              'rounded px-1 py-px font-semibold tracking-tight',
              i === 0 ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-200',
              i === segs.length - 1 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : '',
            )}
          >
            {s}
          </span>
          {i < segs.length - 1 ? <span className="px-1 text-slate-400 dark:text-slate-500">-</span> : null}
        </span>
      ))}
    </span>
  );
}
