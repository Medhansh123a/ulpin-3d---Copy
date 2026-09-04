import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Crosshair, Layers3, Orbit, Pipette, RotateCcw, Waves, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildings, parcels, utilityLines, utilityNodes, TYPE_COLORS, UTILITY_COLORS } from '../data/mockData';
import type { Building } from '../types';
import { DEFAULT_MAP, GRID, clamp, depthKey, extrude, pointInPoly, project, toPath, type MapState } from '../utils/geometry';
import { cx, rgba, shade } from '../utils/format';

const VIEW_W = 1000;
const VIEW_H = 660;

export default function Map3D() {
  const { selected, select, notify } = useApp();
  const [view, setView] = useState<MapState>(DEFAULT_MAP);
  const [autoRotate, setAutoRotate] = useState(true);
  const [floorsOn, setFloorsOn] = useState(false);
  const [undergroundOn, setUndergroundOn] = useState(true);
  const [explode, setExplode] = useState(0.35);
  const [showParcels, setShowParcels] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; moved: number; yaw0: number; panX0: number; panY0: number } | null>(null);

  // auto-rotate
  useEffect(() => {
    if (!autoRotate) return;
    let raf = 0;
    const loop = () => {
      setView((v) => (drag.current ? v : { ...v, yaw: v.yaw + 0.0014 }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoRotate]);

  const selectedBuilding = selected?.kind === 'building' ? buildings.find((b) => b.id === selected.id) : undefined;
  const selectedParcel = selected?.kind === 'parcel' ? parcels.find((p) => p.id === selected.id) : undefined;

  // ---------- pointer interaction ----------
  const toSvg = (clientX: number, clientY: number) => {
    const rect = svgRef.current!.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * VIEW_W,
      y: ((clientY - rect.top) / rect.height) * VIEW_H,
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const p = toSvg(e.clientX, e.clientY);
    drag.current = { x: p.x, y: p.y, moved: 0, yaw0: view.yaw, panX0: view.panX, panY0: view.panY };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
  const d = drag.current;
  if (!d) return;

  const p = toSvg(e.clientX, e.clientY);
  const dx = p.x - d.x;
  const dy = p.y - d.y;

  d.moved += Math.abs(dx) + Math.abs(dy);

  setView((v) => ({
    ...v,
    yaw: d.yaw0 - dx * 0.005,
    panX: d.panX0 + dx,
    panY: d.panY0 + dy,
  }));
};

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.moved < 6) handleClick(e.clientX, e.clientY);
  };

  const onWheel = (e: React.WheelEvent) => {
    setView((v) => ({ ...v, zoom: clamp(v.zoom * (e.deltaY > 0 ? 0.94 : 1.06), 0.35, 2.2) }));
  };

  const handleClick = (clientX: number, clientY: number) => {
    const p = toSvg(clientX, clientY);
    // buildings first (topmost)
    for (let i = buildings.length - 1; i >= 0; i--) {
      const b = buildings[i];
      if (b === selectedBuilding && floorsOn) {
        // hit against exploded slabs
        const fh = b.floorHeightM * view.zoom;
        for (let f = 0; f < b.floors; f++) {
          const zTop = f * fh * (1 + b.floors * explode * 0.028) + fh;
          void zTop;
        }
      }
      const poly = [b.gx, b.gy, b.gx + b.gw, b.gy, b.gx + b.gw, b.gy + b.gd, b.gx, b.gy + b.gd]
        .reduce<Array<[number, number]>>((acc, _, i2, arr) => {
          if (i2 % 2 === 0) acc.push(project(arr[i2], arr[i2 + 1], 0, view));
          return acc;
        }, []);
      if (pointInPoly(p.x, p.y, poly)) {
        select({ kind: 'building', id: b.id });
        return;
      }
    }
    // utility nodes
    if (undergroundOn) {
      for (const n of utilityNodes) {
        const [sx, sy] = project(n.gridX, n.gridY, -n.depthM * 0.55, view);
        if (Math.hypot(p.x - sx, p.y - sy) < 10) {
          select({ kind: 'utility', id: n.id });
          return;
        }
      }
    }
    // parcels
    if (showParcels) {
      for (let i = parcels.length - 1; i >= 0; i--) {
        const pl = parcels[i];
        const poly = [pl.gx, pl.gy, pl.gx + pl.gw, pl.gy, pl.gx + pl.gw, pl.gy + pl.gd, pl.gx, pl.gy + pl.gd].reduce<Array<[number, number]>>(
          (acc, _, i2, arr) => {
            if (i2 % 2 === 0) acc.push(project(arr[i2], arr[i2 + 1], 0, view));
            return acc;
          },
          [],
        );
        if (pointInPoly(p.x, p.y, poly)) {
          select({ kind: 'parcel', id: pl.id });
          return;
        }
      }
    }
    select(null);
  };

  const resetView = () => {
    setView(DEFAULT_MAP);
    setAutoRotate(true);
    notify('View reset', 'success');
  };

  // ---------- scene elements ----------
  const ground = useMemo(() => {
    const corners: Array<[number, number, number]> = [
      [0, 0, 0], [GRID, 0, 0], [GRID, GRID, 0], [0, GRID, 0],
    ];
    const gearPts = corners.map(([x, y, z]) => project(x, y, z, view));
    const area = [0.5, 0.5, 33.5, 0.5, 33.5, 33.5, 0.5, 33.5];
    const areaPts = area.reduce<Array<[number, number]>>((acc, _, i, arr) => {
      if (i % 2 === 0) acc.push(project(arr[i], arr[i + 1], 0, view));
      return acc;
    }, []);
    return { gearPts, areaPts };
  }, [view]);

  const roads = useMemo(() => {
    const lines: Array<[number, number, number, number]> = [];
    for (let i = 0; i <= 4; i++) {
      const v = i * 8;
      lines.push([v, 0, v, GRID]);
      lines.push([0, v, GRID, v]);
    }
    // ring road
    lines.push([4, 0, 4, 4], [4, 4, 0, 4]);
    return lines;
  }, []);

  const parks = useMemo(() => {
    const p1 = [[8.6, 0.6], [15.4, 0.6], [15.4, 3.2], [8.6, 3.2]] as Array<[number, number]>;
    const p2 = [[1.6, 17.2], [7.4, 17.2], [7.4, 19.8], [1.6, 19.8]] as Array<[number, number]>;
    const draw = (pts: Array<[number, number]>) => toPath(pts.map(([x, y]) => project(x, y, 0.01, view)));
    return { p1: draw(p1), p2: draw(p2) };
  }, [view]);

  const river = useMemo(() => {
    const pts = [[32.6, 0], [34, 0], [34, 4.5], [31.8, 5.5], [34, 8], [34, 34], [32.6, 34], [30.4, 9.5], [31, 6]] as Array<[number, number]>;
    return toPath(pts.map(([x, y]) => project(x, y, 0.005, view)));
  }, [view]);

  const zoneLabels = useMemo(() => {
    const z = [
      { t: 'ZONE A · RESIDENTIAL', x: 13.5, y: 4.5 },
      { t: 'ZONE B · COMMERCIAL CORE', x: 19.5, y: 19.5 },
      { t: 'ZONE C · MIXED', x: 9, y: 29 },
      { t: 'ZONE D · INSTITUTIONAL / UTILITY', x: 30, y: 30.5 },
    ];
    return z.map((v) => {
      const [sx, sy] = project(v.x, v.y, 0.02, view);
      return { ...v, sx, sy };
    });
  }, [view]);

  // ---------- render helpers ----------
  const renderBuilding = (b: Building, extra: { isSel: boolean; isHov: boolean }) => {
    const { isSel, isHov } = extra;
    const base = b.elevationBaseM;
    if (isSel && floorsOn) {
      // stacked slabs with explode gap
      const slabs: React.ReactNode[] = [];
      const fh = b.floorHeightM;
      const gap = fh * explode * 1.6;
      for (let f = 0; f < b.floors; f++) {
        const z0 = base + f * (fh + gap);
        const { walls, top } = extrude(b.gx, b.gy, b.gw, b.gd, fh, view, z0);
        // walls: far->near; color darker for near-lit side
        slabs.push(
          <g key={f} opacity={isSel ? 1 : 0.86}>
            {walls.map((w, wi) => (
              <path
                key={wi}
                d={toPath(w.pts)}
                fill={wi === walls.length - 1 || wi === walls.length - 2 ? shade(b.color, 0.02) : shade(b.color, -0.22)}
                stroke={shade(b.color, -0.35)}
                strokeWidth={0.6}
              />
            ))}
            {f === b.floors - 1 ? <path d={toPath(top)} fill={shade(b.color, 0.3)} stroke={shade(b.color, -0.2)} strokeWidth={0.7} /> : null}
          </g>,
        );
      }
      return <g key={b.id} className="map-hover-raise" style={{ transform: isHov ? 'scale(1.02)' : undefined }}>{slabs}</g>;
    }
    const { walls, top } = extrude(b.gx, b.gy, b.gw, b.gd, b.heightM * (isSel ? 1.02 : 1), view);
    const fill = isSel ? shade(TYPE_COLORS[b.type], 0.12) : shade(b.color, 0);
    return (
      <g key={b.id} className="map-hover-raise" style={{ transform: isHov ? 'scale(1.015)' : undefined, pointerEvents: 'none' }}>
        {/* shadow */}
        <ellipse cx={project(b.cx, b.cy, 0, view)[0]} cy={project(b.cx, b.cy, 0, view)[1]} rx={b.gw * view.zoom * 7} ry={b.gd * view.zoom * 5.5} fill="rgba(15,23,42,0.13)" />
        {walls.map((w, wi) => (
          <path
            key={wi}
            d={toPath(w.pts)}
            fill={wi < walls.length / 2 ? shade(fill, -0.3) : shade(fill, 0.05)}
            stroke={shade(fill, -0.45)}
            strokeWidth={0.7}
            fillOpacity={isSel ? 0.95 : 0.92}
          />
        ))}
        <path d={toPath(top)} fill={shade(fill, 0.28)} stroke={shade(fill, -0.25)} strokeWidth={0.8} />
        {isSel ? (
          <g>
            <text x={project(b.cx, b.cy, b.heightM + 2, view)[0]} y={project(b.cx, b.cy, b.heightM + 2, view)[1]} textAnchor="middle" className="select-none" fontSize={11} fontWeight={700} fill="#f59e0b">
              {b.name}
            </text>
            <text x={project(b.cx, b.cy, b.heightM - 1.2, view)[0]} y={project(b.cx, b.cy, b.heightM - 1.2, view)[1]} textAnchor="middle" className="select-none" fontSize={8.5} fill="rgba(255,255,255,0.85)">
              {b.floors} F · {b.heightM} m
            </text>
          </g>
        ) : null}
      </g>
    );
  };

  const renderParcels = () => {
    return parcels.map((p) => {
      const isSel = selectedParcel?.id === p.id;
      const poly = [p.gx, p.gy, p.gx + p.gw, p.gy, p.gx + p.gw, p.gy + p.gd, p.gx, p.gy + p.gd]
        .reduce<Array<[number, number]>>((acc, _, i, arr) => {
          if (i % 2 === 0) acc.push(project(arr[i], arr[i + 1], 0.015, view));
          return acc;
        }, []);
      const area = p.gw * p.gd * 4 * 4 * 25 * 25;
      return (
        <path
          key={p.id}
          d={toPath(poly)}
          fill={isSel ? 'rgba(245,158,11,0.22)' : rgba('#0ea5e9', 0.045)}
          stroke={isSel ? '#f59e0b' : 'rgba(100,116,139,0.35)'}
          strokeWidth={isSel ? 1.6 : 0.8}
          strokeDasharray={isSel ? undefined : '5 4'}
          style={{ pointerEvents: 'none', cursor: 'pointer' }}
        />
      );
    });
  };

  const renderUnderground = () => {
    if (!undergroundOn) return null;
    return (
      <g>
        {utilityLines.map((l) => {
          const pts = l.points.map(([x, y]) => project(x, y, -l.depthM * 0.5, view));
          const d = pts.reduce((s, p, i) => s + (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`), '');
          const isSel = selected?.kind === 'utility' && selected.id === l.id;
          return (
            <g key={l.id}>
              <path d={d} fill="none" stroke={UTILITY_COLORS[l.type]} strokeWidth={isSel ? 4.5 : 3} strokeOpacity={0.55} strokeLinecap="round" />
              <path d={d} fill="none" stroke={UTILITY_COLORS[l.type]} strokeWidth={isSel ? 2 : 1.2} strokeOpacity={0.95} strokeDasharray="5 7" className="animate-dashFlow" strokeLinecap="round" />
            </g>
          );
        })}
        {utilityNodes.map((n) => {
          const [sx, sy] = project(n.gridX, n.gridY, -n.depthM * 0.5, view);
          const isSel = selected?.kind === 'utility' && selected.id === n.id;
          return (
            <g key={n.id} style={{ pointerEvents: 'none' }}>
              <circle cx={sx} cy={sy} r={isSel ? 8 : 5} fill={UTILITY_COLORS[n.utility]} fillOpacity={0.35} />
              <circle cx={sx} cy={sy} r={isSel ? 4 : 2.6} fill={UTILITY_COLORS[n.utility]} stroke="#0b1220" strokeWidth={0.8} />
            </g>
          );
        })}
      </g>
    );
  };

  const renderFloorGrid = () => {
    if (!selectedBuilding || !floorsOn) return null;
    const b = selectedBuilding;
    const fh = b.floorHeightM;
    const gap = fh * explode * 1.6;
    // horizontal lines at each slab on the two camera-facing walls
    const corners: Array<[number, number]> = [
      [b.gx, b.gy], [b.gx + b.gw, b.gy], [b.gx + b.gw, b.gy + b.gd], [b.gx, b.gy + b.gd],
    ];
    // sort by depth descending: front two are last
    const idx = corners
      .map((p, i) => ({ i, d: depthKey(p[0], p[1], view) + depthKey(corners[(i + 1) % 4][0], corners[(i + 1) % 4][1], view) / 2 }))
      .sort((a, b2) => b2.d - a.d);
    const frontWalls = idx.slice(0, 2).map((x) => [corners[x.i], corners[(x.i + 1) % 4]] as Array<[number, number]>);
    return (
      <g pointerEvents="none">
        {frontWalls.map(([a, c], wi) => {
          const lines: React.ReactNode[] = [];
          for (let f = 0; f < b.floors; f++) {
            const z0 = b.elevationBaseM + f * (fh + gap);
            const p0 = project(a[0], a[1], z0, view);
            const p1 = project(c[0], c[1], z0, view);
            lines.push(
              <line
                key={f}
                x1={p0[0]} y1={p0[1]} x2={p1[0]} y2={p1[1]}
                stroke={f === 0 ? '#f59e0b' : 'rgba(245,158,11,0.9)'}
                strokeWidth={f === 0 ? 1.6 : 0.8}
                strokeDasharray={f === 0 ? undefined : '3 3'}
              />,
            );
          }
          return <g key={wi}>{lines}</g>;
        })}
      </g>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-[var(--map-bg)] dark:border-slate-800" style={{ touchAction: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="h-full w-full select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={() => {
          drag.current = null;
          setHover(null);
        }}
        onWheel={onWheel}
        style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
      >
        {/* ground */}
        <path d={toPath(ground.gearPts)} fill="var(--map-bg)" />
        <path d={toPath(ground.areaPts)} fill="var(--map-bg)" stroke="var(--map-pcl)" strokeWidth={1} />
        {/* gis grid */}
        <g opacity={0.5} stroke="var(--map-grid)" strokeWidth={0.4}>
          {Array.from({ length: 35 }, (_, i) => (
            <line key={`v${i}`} x1={project(i, 0, 0.001, view)[0]} y1={project(i, 0, 0.001, view)[1]} x2={project(i, GRID, 0.001, view)[0]} y2={project(i, GRID, 0.001, view)[1]} />
          ))}
          {Array.from({ length: 35 }, (_, i) => (
            <line key={`h${i}`} x1={project(0, i, 0.001, view)[0]} y1={project(0, i, 0.001, view)[1]} x2={project(GRID, i, 0.001, view)[0]} y2={project(GRID, i, 0.001, view)[1]} />
          ))}
        </g>
        {/* river */}
        <path d={river} fill="var(--map-water)" stroke="var(--map-waterline)" strokeWidth={1} />
        {/* parks */}
        <path d={parks.p1} fill="var(--map-green)" stroke="var(--map-greendark)" strokeWidth={0.8} />
        <path d={parks.p2} fill="var(--map-green)" stroke="var(--map-greendark)" strokeWidth={0.8} />
        {/* roads */}
        <g stroke="var(--map-road)" strokeWidth={view.zoom * 5.2} strokeLinecap="square" opacity={0.92}>
          {roads.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={project(x1, y1, 0.01, view)[0]} y1={project(x1, y1, 0.01, view)[1]} x2={project(x2, y2, 0.01, view)[0]} y2={project(x2, y2, 0.01, view)[1]} />
          ))}
        </g>
        <g stroke="var(--map-roadline)" strokeWidth={0.5} strokeDasharray="4 5" opacity={0.7}>
          {roads.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={project(x1, y1, 0.015, view)[0]} y1={project(x1, y1, 0.015, view)[1]} x2={project(x2, y2, 0.015, view)[0]} y2={project(x2, y2, 0.015, view)[1]} />
          ))}
        </g>
        {/* parcels */}
        {showParcels ? renderParcels() : null}
        {/* zone labels */}
        <g pointerEvents="none" opacity={0.75}>
          {zoneLabels.map((z) => (
            <text key={z.t} x={z.sx} y={z.sy} textAnchor="middle" fontSize={8} letterSpacing={1.5} fill="var(--map-label-dim)" fontWeight={600}>
              {z.t}
            </text>
          ))}
        </g>
        {/* underground */}
        {renderUnderground()}
        {/* buildings */}
        {[...buildings]
          .sort((a, b2) => depthKey(b2.cx, b2.cy, view) - depthKey(a.cx, a.cy, view))
          .map((b) =>
            renderBuilding(b, {
              isSel: selectedBuilding?.id === b.id,
              isHov: hover === b.id,
            }),
          )}
        {/* floor level grid (on top of selected building) */}
        {renderFloorGrid()}
        {/* ground opacity when underground visible */}
        {undergroundOn ? (
          <path d={toPath(ground.areaPts)} fill="rgba(148,163,184,0.06)" pointerEvents="none" />
        ) : null}
        {/* north arrow */}
        {(() => {
          const [nx, ny] = project(GRID / 2, GRID / 2, 0, { ...view, yaw: 0 });
          const [cx2, cy2] = [0, 0];
          void nx; void ny; void cx2; void cy2;
          return null;
        })()}
      </svg>

      {/* ---------- overlays ---------- */}
      <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setAutoRotate((v) => !v)} title="Toggle auto rotation">
            <Orbit size={13} className={autoRotate ? 'text-cyan-500' : ''} /> {autoRotate ? 'Orbit ON' : 'Orbit OFF'}
          </button>
          <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={resetView} title="Reset camera">
            <RotateCcw size={13} /> Reset
          </button>
          <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => { setFloorsOn((v) => !v); if (!floorsOn) setAutoRotate(false); }} title="Show floor slabs for selected building">
            <Layers3 size={13} className={floorsOn ? 'text-amber-400' : ''} /> {floorsOn ? 'Floors ON' : 'Floors OFF'}
          </button>
          <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => { setUndergroundOn((v) => !v); if (!undergroundOn) setAutoRotate(false); }} title="Underground utilities">
            <Waves size={13} className={undergroundOn ? 'text-violet-400' : ''} /> {undergroundOn ? 'Underground ON' : 'Underground OFF'}
          </button>
          <button className="btn-secondary !px-2.5 !py-1.5 text-xs" onClick={() => setShowParcels((v) => !v)}>
            <Pipette size={13} className={showParcels ? 'text-cyan-400' : ''} /> Parcels {showParcels ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex items-end justify-between">
          <div className="pointer-events-auto flex items-center gap-2 rounded-lg bg-white/85 px-3 py-2 shadow ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/85 dark:ring-slate-700">
            <Compass size={15} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Simulated city · Rohini</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">Grid 34×34 · cell 25 m · 0.72 km²</span>
            </div>
            <Crosshair size={14} className="ml-2 text-cyan-500" />
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded bg-white/85 px-2 py-1 text-[10px] font-mono text-slate-500 shadow ring-1 ring-slate-200 dark:bg-slate-900/85 dark:text-slate-400 dark:ring-slate-700">
              Drag to rotate · wheel to zoom
            </span>
            <div className="rounded bg-white/85 px-2 py-1 shadow ring-1 ring-slate-200 dark:bg-slate-900/85 dark:ring-slate-700">
              <svg width="40" height="16" viewBox="0 0 40 16">
                <line x1="2" y1="14" x2="38" y2="14" stroke="#64748b" strokeWidth="1.5" />
                <line x1="2" y1="10" x2="2" y2="14" stroke="#64748b" />
                <line x1="38" y1="10" x2="38" y2="14" stroke="#64748b" />
                <text x="20" y="7" textAnchor="middle" fontSize="6.5" fill="#94a3b8">250 m</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
      {/* explode slider when floors on */}
      {floorsOn && selectedBuilding ? (
        <div className="absolute left-1/2 top-14 -translate-x-1/2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 shadow backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <Zap size={12} /> Floor explode
            <input type="range" min={0} max={1} step={0.01} value={explode} onChange={(e) => setExplode(parseFloat(e.target.value))} className="w-28 accent-amber-500" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
