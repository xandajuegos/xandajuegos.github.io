// Validación y limpieza de lo que manda el juego. Nunca se confía en el cliente.

export const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;
const MAX_INT = 1e12;

export const int = (v, max = MAX_INT) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), max) : 0;
};

/** Nombre de jugador: 3–16 caracteres, solo letras, números, espacio y . _ - */
export function cleanName(raw) {
  let s = String(raw ?? '').normalize('NFC').replace(/[^\p{L}\p{N} ._-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  if (s.length < 3) s = (s + 'Jugador').slice(0, 16);
  return s;
}

const DATA_URL_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/** { type:'preset', id } | { type:'custom', data } → { slug } | { custom } */
export function cleanAvatar(a) {
  if (a?.type === 'custom' && typeof a.data === 'string' && a.data.length <= 120000 && DATA_URL_RE.test(a.data)) return { custom: a.data };
  if (a?.type === 'preset' && typeof a.id === 'string' && /^[a-z0-9_-]{1,40}$/i.test(a.id)) return { slug: a.id };
  return { slug: 'oveja' };
}

/**
 * Revisa el guardado del juego. Devuelve { data, coins, chips, trophies, stats } o lanza Error con .code.
 * `data` es el objeto que se guarda tal cual (sin perfil ni ajustes: eso viaja aparte).
 */
export function cleanSave(data) {
  const bad = (m) => Object.assign(new Error(m), { code: 'invalid_save', status: 400 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw bad('Guardado inválido.');
  if (JSON.stringify(data).length > 300000) throw bad('El guardado es demasiado grande.');
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  const trophies = obj(data.trophies);
  const globalTrophies = Object.values(trophies).reduce((n, v) => n + int(v, 1e9), 0);
  const chars = obj(data.characters);
  const skins = obj(data.skins);
  const strs = (v, max = 200) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x.length <= 60))].slice(0, max) : []);
  const clean = {
    ...data,
    coins: int(data.coins),
    chips: int(data.chips),
    escrow: int(data.escrow),
    characters: { ...chars, unlocked: strs(chars.unlocked, 50) },
    skins: { ...skins, owned: strs(skins.owned, 500), equipped: obj(skins.equipped) },
  };
  delete clean.profile;
  delete clean.settings;
  return {
    data: clean,
    coins: clean.coins,
    chips: clean.chips + clean.escrow,   // las fichas apartadas en una partida cuentan como del jugador
    trophies: globalTrophies,
    played: int(obj(data.stats).played, 1e9),
  };
}
