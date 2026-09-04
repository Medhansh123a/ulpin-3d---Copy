// ---------- 3D ULPIN codec ----------
// Format: 3DULPIN-CC-ST-DDD-ZZ-PPPP-FF-UU-K
//   CC    country code           (2, alnum)
//   ST    state / province       (2, alnum)
//   DDD   district               (3, alnum)
//   ZZ    sector / zone          (2, alnum)
//   PPPP  parcel code            (4, alnum, base-34)
//   FF    floor key              (2: '00' land, '01'.., 'UG' underground, 'AR' air)
//   UU    vertical unit key      (2: '00' whole, 'A1'..)
//   K     check digit            (1, Luhn mod-34 over all previous segments)
// Check digit uses a readable 34-character alphabet; body fields may use standard A-Z/0-9 codes such as country IN.

const NUM = '0123456789';
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ALNUM = NUM + LETTERS; // 34 symbols

export function charVal(ch: string): number {
  // Use a stable base-36 value for every body character, including I/O in
  // the country/state codes. The check digit itself remains in the readable
  // 34-character alphabet below.
  const v = ch.toUpperCase().charCodeAt(0);
  if (v >= 48 && v <= 57) return v - 48;
  if (v >= 65 && v <= 90) return 10 + v - 65;
  return 0;
}

/** Deterministic weighted mod-34 checksum for the hackathon demo format. */
function checksum(body: string): number {
  let sum = 0;
  for (let i = 0; i < body.length; i += 1) {
    sum = (sum + charVal(body[i]) * (i % 7 + 1)) % ALNUM.length;
  }
  return sum;
}

export function checkChar(body: string): string {
  return ALNUM[(ALNUM.length - checksum(body)) % ALNUM.length];
}

export interface UlpinFields {
  country: string;
  state: string;
  district: string;
  zone: string;
  parcel: string;
  floor: string;
  unit: string;
}

export function buildUlpin(f: UlpinFields): string {
  const body = `${f.country}${f.state}${f.district}${f.zone}${f.parcel}${f.floor}${f.unit}`;
  return `3DULPIN-${f.country}-${f.state}-${f.district}-${f.zone}-${f.parcel}-${f.floor}-${f.unit}-${checkChar(body)}`;
}

export function validateUlpin(ulpin: string): boolean {
  const m = ulpin
    .toUpperCase()
    .trim()
    .match(/^3DULPIN-([A-Z0-9]{2})-([A-Z0-9]{2})-([A-Z0-9]{3})-([A-Z0-9]{2})-([A-Z0-9]{4})-([A-Z0-9]{2})-([A-Z0-9]{2})-([A-Z0-9])$/);
  if (!m) return false;
  const [, c, s, d, z, p, f, u, ck] = m;
  return checkChar(c + s + d + z + p + f + u) === ck;
}

export interface UlpinParts {
  country: { label: string; value: string };
  state: { label: string; value: string };
  district: { label: string; value: string };
  zone: { label: string; value: string };
  parcel: { label: string; value: string };
  floor: { label: string; value: string };
  unit: { label: string; value: string };
  check: { label: string; value: string };
}

export function ulpinParts(ulpin: string): UlpinParts {
  const s = ulpin.toUpperCase().split('-');
  return {
    country: { label: 'Country', value: s[1] ?? '' },
    state: { label: 'State / Province', value: s[2] ?? '' },
    district: { label: 'District', value: s[3] ?? '' },
    zone: { label: 'Sector / Zone', value: s[4] ?? '' },
    parcel: { label: 'Parcel code', value: s[5] ?? '' },
    floor: { label: 'Floor key', value: s[6] ?? '' },
    unit: { label: 'Vertical unit', value: s[7] ?? '' },
    check: { label: 'Check digit (weighted mod-34)', value: s[8] ?? '' },
  };
}

export function floorKeyLabel(key: string): string {
  switch (key) {
    case '00':
      return 'Land parcel (00)';
    case 'UG':
      return 'Underground (UG)';
    case 'AR':
      return 'Air-rights (AR)';
    default:
      return `Floor ${key}`;
  }
}
