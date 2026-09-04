import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CheckCircle2, ClipboardCopy, Fingerprint, Info, RefreshCcw, ShieldCheck, XCircle } from 'lucide-react';
import { Card, CardHeader, DemoTag, Seg } from '../components/ui';
import { useApp } from '../context/AppContext';
import { buildings, findByUlpin, getBuilding, parcels } from '../data/mockData';
import UlpinDisplay from '../components/UlpinDisplay';
import { buildUlpin, ulpinParts, validateUlpin } from '../utils/ulpin';
import { fmtArea } from '../utils/format';

type EntityKind = 'building' | 'parcel';

export default function UlpinGenerator() {
  const loc = useLocation();
  const { notify } = useApp();
  const preset = ((loc.state as { preset?: string } | null)?.preset ?? '');

  const [kind, setKind] = useState<EntityKind>('building');
  const [entityId, setEntityId] = useState(preset && getBuilding(preset) ? preset : buildings[0].id);
  const entityKindFromPreset = preset && !getBuilding(preset) && parcels.some((p) => p.id === preset) ? 'parcel' as EntityKind : kind;

  const effectiveKind = entityKindFromPreset !== kind ? entityKindFromPreset : kind;

  const entity = useMemo(() => {
    if (effectiveKind === 'building') return getBuilding(entityId);
    return parcels.find((p) => p.id === entityId);
  }, [effectiveKind, entityId]);

  const [fields, setFields] = useState(() => {
    const b = getBuilding(buildings[0].id);
    const seg = b!.ulpin.split('-');
    return { country: seg[1], state: seg[2], district: seg[3], zone: seg[4], parcel: seg[5], floor: '00', unit: '00' };
  });

  const [generated, setGenerated] = useState<string | null>(null);
  const [valid, setValid] = useState<boolean | null>(null);

  const deriveFrom = (k: EntityKind, id: string) => {
    if (k === 'building') {
      const b = getBuilding(id);
      if (!b) return;
      const seg = b.ulpin.split('-');
      setFields({ country: seg[1], state: seg[2], district: seg[3], zone: seg[4], parcel: seg[5], floor: '00', unit: '00' });
      setGenerated(b.ulpin);
      setValid(validateUlpin(b.ulpin));
    } else {
      const p = parcels.find((x) => x.id === id);
      if (!p) return;
      const seg = p.ulpin.split('-');
      setFields({ country: seg[1], state: seg[2], district: seg[3], zone: seg[4], parcel: seg[5], floor: '00', unit: '00' });
      setGenerated(p.ulpin);
      setValid(validateUlpin(p.ulpin));
    }
  };

  const onChangeKind = (k: EntityKind) => {
    setKind(k);
    setEntityId(k === 'building' ? buildings[0].id : parcels[0].id);
    deriveFrom(k, k === 'building' ? buildings[0].id : parcels[0].id);
  };

  const onPickEntity = (id: string) => {
    setEntityId(id);
    deriveFrom(effectiveKind, id);
  };

  const doGenerate = () => {
    const out = buildUlpin(fields);
    setGenerated(out);
    setValid(validateUlpin(out));
    notify(`3D ULPIN generated for ${entity?.name ?? entityId} (demo)`, 'success');
  };

  const doValidate = () => {
    if (!generated) return;
    const ok = validateUlpin(generated);
    setValid(ok);
    notify(ok ? 'Check digit verified — identifier is valid' : 'Check digit failed — identifier is malformed', ok ? 'success' : 'error');
  };

  const copy = async () => {
    if (!generated) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(generated);
      } else {
        const area = document.createElement('textarea');
        area.value = generated;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand('copy');
        area.remove();
        if (!copied) throw new Error('copy failed');
      }
      notify('Copied to clipboard', 'success');
    } catch {
      notify('Clipboard unavailable in this browser', 'warning');
    }
  };

  const parts = generated ? ulpinParts(generated) : null;
  const registered = generated ? findByUlpin(generated) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">3D ULPIN Generator</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Generate and validate the hackathon’s proposed 3D identifier format</p>
        </div>
        <DemoTag />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* form */}
        <Card className="lg:col-span-2">
          <CardHeader title="1 · Select the property" subtitle="Auto-fills the spatial segments" />
          <div className="space-y-4 p-4">
            <div>
              <p className="label">Object type</p>
              <Seg
                value={effectiveKind}
                onChange={onChangeKind}
                options={[
                  { v: 'building', label: 'Building' },
                  { v: 'parcel', label: 'Land parcel' },
                ]}
              />
            </div>
            <div>
              <p className="label">{effectiveKind === 'building' ? 'Building' : 'Parcel'}</p>
              <select className="input" value={entityId} onChange={(e) => onPickEntity(e.target.value)}>
                {(effectiveKind === 'building' ? buildings : parcels).map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name} · {x.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
              <SpatialSummary kind={effectiveKind} id={entityId} />
            </div>

            <div className="border-t border-slate-200 pt-4 dark:border-slate-800">
              <p className="label">2 · Confirm segments</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Country" value={fields.country} onChange={(v) => setFields({ ...fields, country: v })} max={2} />
                <Field label="State" value={fields.state} onChange={(v) => setFields({ ...fields, state: v })} max={2} />
                <Field label="District" value={fields.district} onChange={(v) => setFields({ ...fields, district: v })} max={3} />
                <Field label="Zone" value={fields.zone} onChange={(v) => setFields({ ...fields, zone: v })} max={2} />
                <Field label="Parcel code" value={fields.parcel} onChange={(v) => setFields({ ...fields, parcel: v })} max={4} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Floor" value={fields.floor} onChange={(v) => setFields({ ...fields, floor: v })} max={2} placeholder="00 / UG" />
                  <Field label="Unit" value={fields.unit} onChange={(v) => setFields({ ...fields, unit: v })} max={2} placeholder="00 / A1" />
                </div>
              </div>
            </div>

            <button className="btn-primary w-full" onClick={doGenerate}>
              <Fingerprint size={15} /> Generate 3D ULPIN
            </button>
            {generated && (
              <div className="flex gap-2">
                <button className="btn-secondary flex-1" onClick={doValidate}>
                  <ShieldCheck size={14} /> Validate
                </button>
                <button className="btn-secondary flex-1" onClick={copy}>
                  <ClipboardCopy size={14} /> Copy
                </button>
                <button className="btn-ghost" onClick={() => { setGenerated(null); setValid(null); }} title="Clear">
                  <RefreshCcw size={14} />
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* output */}
        <Card className="lg:col-span-3">
          <CardHeader title="3 · Issued identifier" subtitle="Proposed demo format · Luhn-mod-34 integrity check" right={<Fingerprint size={15} className="text-cyan-500" />} />
          <div className="p-5">
            {!generated ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-16 text-center dark:border-slate-700">
                <Fingerprint size={28} className="mb-3 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No identifier issued yet</p>
                <p className="mt-1 max-w-xs text-xs text-slate-400">Select a building or parcel and press “Generate 3D ULPIN”.</p>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <p className="label">Issued 3D ULPIN</p>
                  <UlpinDisplay ulpin={generated} size="lg" className="w-full justify-center py-2.5 shadow-sm" />
                </div>

                {valid !== null && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium ${valid ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                    {valid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    {valid ? 'Check digit verified — identifier is structurally valid.' : 'Check digit mismatch — identifier failed validation.'}
                  </div>
                )}

                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <Info size={13} /> Segment breakdown
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {parts &&
                      Object.values(parts).map((p) => (
                        <div key={p.label} className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                          <p className="font-mono text-base font-bold text-slate-800 dark:text-slate-100">{p.value}</p>
                          <p className="text-[9px] font-medium uppercase tracking-wide text-slate-400">{p.label}</p>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                  <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                    <ShieldCheck size={13} className="text-emerald-500" /> Registry status
                  </div>
                  {registered ? (
                    <p>
                      This identifier resolves to a registered record in the demo registry ({registered.kind} ·{' '}
                      <span className="font-mono">{registered.entity.id}</span>). Registration already exists — no action taken.
                    </p>
                  ) : (
                    <p>This identifier is not yet in the demo registry.</p>
                  )}
                  <button
                    className="btn-secondary mt-2 !py-1.5 text-xs"
                    onClick={() => notify('Record written to demo registry (simulated write — no persistence)', 'success')}
                  >
                    Register this ULPIN (demo)
                  </button>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
                  <strong className="text-slate-500 dark:text-slate-400">Demo note:</strong> This 3D ULPIN structure is a hackathon proposal, not a claim about the official Government of India ULPIN specification. <strong className="text-slate-500 dark:text-slate-400">How it works:</strong> horizontal segments (country → state → district → zone → parcel)
                  pin the object to the map; vertical segments (floor key · vertical unit) pin it inside the building or below ground (UG) or in the air
                  space (AR). A Luhn-mod-34 check digit, computed over all segments, lets the platform catch transcription errors before registry write.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, max, placeholder }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string }) {
  return (
    <div>
      <p className="label">{label}</p>
      <input
        className="input font-mono uppercase"
        value={value}
        maxLength={max}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
      />
    </div>
  );
}

function SpatialSummary({ kind, id }: { kind: EntityKind; id: string }) {
  if (kind === 'building') {
    const b = getBuilding(id);
    if (!b) return null;
    return (
      <>
        <p className="font-semibold text-slate-600 dark:text-slate-300">{b.name}</p>
        <p>Parcel {b.parcelId} · {b.floors} floors · {fmtArea(b.footprintM2)} footprint · {b.elevationBaseM} m → {b.elevationTopM} m elevation</p>
        <p>Owner: {b.owner} · {b.rights.replace('-', ' ')}</p>
      </>
    );
  }
  const p = parcels.find((x) => x.id === id);
  if (!p) return null;
  return (
    <>
      <p className="font-semibold text-slate-600 dark:text-slate-300">{p.name}</p>
      <p>{p.landUse} · {fmtArea(p.areaM2)} · status {p.status}</p>
      <p>Owner: {p.owner} · {p.rights.replace('-', ' ')}</p>
    </>
  );
}
