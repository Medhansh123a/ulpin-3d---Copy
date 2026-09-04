import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fingerprint, Menu, Moon, Search, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { findByUlpin, searchEntities } from '../data/mockData';

export default function Topbar() {
  const { theme, toggleTheme, setSidebarOpen, select, notify } = useApp();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const results = q.trim() ? searchEntities(q) : [];

  const pick = (kind: string, id: string) => {
    select({ kind: kind as 'parcel' | 'building' | 'unit' | 'utility', id });
    setQ('');
    setOpen(false);
    nav('/dashboard');
  };

  const submit = () => {
    if (!q.trim()) return;
    const exact = findByUlpin(q);
    if (exact) {
      const k = exact.kind === 'building' ? 'building' : exact.kind === 'parcel' ? 'parcel' : exact.kind === 'unit' ? 'unit' : 'utility';
      select({ kind: k, id: exact.entity.id });
      setQ('');
      setOpen(false);
      nav('/dashboard');
      return;
    }
    if (results.length > 0) {
      pick(results[0].kind, results[0].id);
    } else {
      notify('No parcel, building or ULPIN found for that query', 'warning');
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 md:hidden dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
        <Menu size={18} />
      </button>

      <div className="relative w-full max-w-md">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Search ULPIN, parcel, building…  e.g. 3DULPIN-IN-DL-NWD-R5-R5A0-12-A1"
          className="input pl-9"
        />
        {open && q.trim() && (
          <div className="absolute top-full mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
            {results.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-slate-400 dark:text-slate-500">No matches. Try a full ULPIN like 3DULPIN-IN-DL-NWD-R5-R5A0-12-A1.</p>
            ) : (
              results.map((r, i) => (
                <button
                  key={`${r.kind}-${r.id}-${i}`}
                  onMouseDown={() => pick(r.kind, r.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-slate-700 dark:text-slate-200">{r.label}</span>
                    <span className="block truncate font-mono text-[10px] text-slate-400">{r.sub}</span>
                  </span>
                  <span className="chip bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300">{r.kind}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button className="btn-secondary hidden lg:inline-flex" onClick={() => nav('/generator')}>
          <Fingerprint size={15} /> Generate 3D ULPIN
        </button>
        <button
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title="Toggle dark / light theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
}
