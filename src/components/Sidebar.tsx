import React from 'react';
import { NavLink } from 'react-router-dom';
import { Box, Globe, BarChart3, BrainCircuit, Database, Layers, Fingerprint, X, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { cx } from '../utils/format';

const NAV = [
  { to: '/', label: 'Home', icon: Globe },
  { to: '/dashboard', label: '3D GIS Dashboard', icon: Layers },
  { to: '/ai', label: 'AI Analysis', icon: BrainCircuit },
  { to: '/floor/BLD-001/1', label: 'Floor View', icon: Building2 },
  { to: '/data', label: 'Data Ingestion', icon: Database },
  { to: '/generator', label: 'ULPIN Generator', icon: Fingerprint },
  { to: '/analytics', label: 'Analytics & Registry', icon: BarChart3 },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  return (
    <>
      {sidebarOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      ) : null}
      <aside
        className={cx(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white transition-transform duration-200 md:static md:translate-x-0 dark:border-slate-800 dark:bg-slate-900',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-600 text-white dark:bg-cyan-500 dark:text-slate-950">
            <Box size={19} strokeWidth={2.2} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight text-slate-800 dark:text-slate-100">
              3D <span className="text-cyan-600 dark:text-cyan-400">ULPIN</span>
            </p>
            <p className="truncate text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Smart Vertical Property Mapping
            </p>
          </div>
          <button className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                )
              }
            >
              <Icon size={17} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800/60">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Demo dataset</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
              Simulated New Delhi dataset · Rohini Sector 5. All geometries and pipelines are illustrative — no real survey or ML processing is performed.
            </p>
          </div>
          <p className="mt-2 text-center text-[10px] text-slate-400 dark:text-slate-600">Platform v1.0.0 · ULPIN v1.0</p>
        </div>
      </aside>
    </>
  );
}
