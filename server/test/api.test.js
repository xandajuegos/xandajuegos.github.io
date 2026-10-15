// Pruebas de la API contra un PostgreSQL real (embebido, no hace falta instalar nada).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import { createApp } from '../src/app.js';

const dbDir = fileURLToPath(new URL('../../database/', import.meta.url));
let epg, pool, server, base;

before(async () => {
  epg = new EmbeddedPostgres({ databaseDir: '/tmp/xj-test-pg-' + process.pid, user: 'postgres', password: 'pw', port: 54331, persistent: false, onLog: () => {}, onError: () => {} });
  await epg.initialise(); await epg.start(); await epg.createDatabase('xj');
  pool = new pg.Pool({ connectionString: 'postgres://postgres:pw@localhost:54331/xj' });
  for (const f of ['schema.sql', 'seed.sql', 'migration-casino-fortuna.sql', 'migration-casino-fortuna.sql']) await pool.query(await readFile(dbDir + f, 'utf8'));
  const app = createApp(pool, { allowedOrigins: '*' });
  await new Promise((r) => { server = app.listen(0, r); });
  base = 'http://localhost:' + server.address().port;
});
after(async () => { server?.close(); await pool?.end(); await epg?.stop(); });

const call = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers };
};
const reg = (email, extra = {}) => call('POST', '/api/auth/register', { email, password: 'clave-segura-1', acceptTerms: true, ...extra });

const save = (over = {}) => ({
  v: 1, coins: 1200, chips: 700, escrow: 0,
  trophies: { blackjack: 120, poker: 40, ocho: 10, ruleta: 0 },
  stats: { played: 12, wins: 7 },
  characters: { unlocked: ['oveja', 'vaca'] },
  skins: { owned: ['oveja:chef', 'vaca:real'], equipped: { oveja: 'chef' } },
  achievements: { unlocked: { primeros_pasos: 1 } },
  selection: { game: 'poker', character: 'oveja' },
  profile: { name: 'NO-DEBE-GUARDARSE' }, settings: { music: 1 },
  ...over,
});

test('registro: validaciones', async () => {
  assert.equal((await reg('no-es-correo')).body.error.code, 'invalid_email');
  assert.equal((await call('POST', '/api/auth/register', { email: 'a@b.co', password: 'corta', acceptTerms: true })).body.error.code, 'weak_password');
  assert.equal((await call('POST', '/api/auth/register', { email: 'a@b.co', password: 'clave-segura-1', acceptTerms: false })).body.error.code, 'terms_required');
});

test('registro, correo repetido y login', async () => {
  const r = await reg('Ana@Ejemplo.com');
  assert.equal(r.status, 201);
  assert.ok(r.body.token && r.body.user.id);
  const dup = await reg('ana@ejemplo.COM');
  assert.equal(dup.status, 409); assert.equal(dup.body.error.code, 'email_taken');
  const hash = (await pool.query("SELECT password_hash, terms_accepted_at FROM users WHERE email = 'ana@ejemplo.com'")).rows[0];
  assert.match(hash.password_hash, /^scrypt\$/); assert.ok(hash.terms_accepted_at);
  assert.equal((await call('POST', '/api/auth/login', { email: 'ana@ejemplo.com', password: 'mala-clave-xx' })).body.error.code, 'invalid_credentials');
  assert.equal((await call('POST', '/api/auth/login', { email: 'nadie@ejemplo.com', password: 'clave-segura-1' })).status, 401);
  const ok = await call('POST', '/api/auth/login', { email: 'ANA@ejemplo.com', password: 'clave-segura-1' });
  assert.equal(ok.status, 200);
  assert.equal((await call('GET', '/api/me', null, ok.body.token)).body.user.email, 'Ana@Ejemplo.com');
});

test('guardado: sin sesión, primer guardado, lectura y espejo en tablas', async () => {
  assert.equal((await call('GET', '/api/games/casino-fortuna/save')).status, 401);
  const { body: { token, user } } = await reg('luis@ejemplo.com');
  assert.deepEqual((await call('GET', '/api/games/casino-fortuna/save', null, token)).body, { exists: false });

  const put = await call('PUT', '/api/games/casino-fortuna/save', { baseRevision: null, data: save(), profile: { name: 'Luis', avatar: { type: 'preset', id: 'av_corazon' } } }, token);
  assert.equal(put.status, 200); assert.equal(put.body.revision, 1); assert.equal(put.body.profile.name, 'Luis');

  const got = (await call('GET', '/api/games/casino-fortuna/save', null, token)).body;
  assert.equal(got.exists, true); assert.equal(got.revision, 1);
  assert.equal(got.profile.coins, 1200); assert.equal(got.profile.chips, 700);
  assert.deepEqual(got.profile.avatar, { type: 'preset', id: 'av_corazon' });
  assert.equal(got.data.trophies.blackjack, 120);
  assert.equal(got.data.profile, undefined); assert.equal(got.data.settings, undefined);

  const inv = (await pool.query(`SELECT it.item_type, it.slug FROM inventory i JOIN items it ON it.id = i.item_id JOIN player_profiles p ON p.id = i.profile_id WHERE p.user_id = $1 ORDER BY 1,2`, [user.id])).rows;
  assert.deepEqual(inv.map((r) => r.item_type + ':' + r.slug), ['character:oveja', 'character:vaca', 'skin:oveja:chef', 'skin:vaca:real']);
  const eq = (await pool.query(`SELECT it.item_type, it.slug FROM equipped_items e JOIN items it ON it.id = e.item_id JOIN player_profiles p ON p.id = e.profile_id WHERE p.user_id = $1 ORDER BY 1`, [user.id])).rows;
  assert.deepEqual(eq.map((r) => r.slug), ['oveja', 'oveja:chef']);
  const best = (await pool.query(`SELECT b.score FROM best_scores b JOIN player_profiles p ON p.id = b.profile_id WHERE p.user_id = $1`, [user.id])).rows[0];
  assert.equal(Number(best.score), 700);
  // ranking
  const lb = (await pool.query(`SELECT player_name, avatar, score FROM leaderboard_alltime WHERE game_id = (SELECT id FROM games WHERE slug='casino-fortuna')`)).rows;
  assert.ok(lb.some((r) => r.player_name === 'Luis' && r.avatar === 'av_corazon' && Number(r.score) === 700));
});

test('guardados siguientes suben la revisión y el ranking solo sube', async () => {
  const { body: { token, user } } = await reg('rev@ejemplo.com');
  const url = '/api/games/casino-fortuna/save';
  assert.equal((await call('PUT', url, { baseRevision: null, data: save({ chips: 900 }), profile: { name: 'Revisor' } }, token)).body.revision, 1);
  assert.equal((await call('PUT', url, { baseRevision: 1, data: save({ chips: 100 }), profile: { name: 'Revisor' } }, token)).body.revision, 2);
  const best = (await pool.query(`SELECT b.score FROM best_scores b JOIN player_profiles p ON p.id = b.profile_id WHERE p.user_id = $1`, [user.id])).rows[0];
  assert.equal(Number(best.score), 900);   // bajar fichas no baja el récord
  assert.equal((await pool.query(`SELECT chips FROM player_profiles WHERE user_id = $1`, [user.id])).rows[0].chips, '100');
});

test('conflicto entre dispositivos (409) y force', async () => {
  const { body: { token } } = await reg('conf@ejemplo.com');
  const url = '/api/games/casino-fortuna/save';
  await call('PUT', url, { baseRevision: null, data: save(), profile: { name: 'Conflicto' } }, token);   // dispositivo A → rev 1
  await call('PUT', url, { baseRevision: 1, data: save({ coins: 50 }), profile: { name: 'Conflicto' } }, token); // → rev 2
  const stale = await call('PUT', url, { baseRevision: 1, data: save({ coins: 9 }), profile: { name: 'Conflicto' } }, token); // dispositivo B desactualizado
  assert.equal(stale.status, 409); assert.equal(stale.body.error.code, 'conflict');
  assert.equal(stale.body.current.revision, 2); assert.equal(stale.body.current.profile.coins, 50);
  const forced = await call('PUT', url, { baseRevision: 1, force: true, data: save({ coins: 9 }), profile: { name: 'Conflicto' } }, token);
  assert.equal(forced.status, 200); assert.equal(forced.body.revision, 3);
  // primer guardado cuando ya existe → también conflicto
  assert.equal((await call('PUT', url, { baseRevision: null, data: save(), profile: { name: 'Conflicto' } }, token)).status, 409);
});

test('nombres únicos por juego (sin distinguir mayúsculas) y limpieza', async () => {
  const url = '/api/games/casino-fortuna/save';
  const a = (await reg('n1@ejemplo.com')).body.token, b = (await reg('n2@ejemplo.com')).body.token, c = (await reg('n3@ejemplo.com')).body.token;
  assert.equal((await call('PUT', url, { baseRevision: null, data: save(), profile: { name: 'Jugador' } }, a)).body.profile.name, 'Jugador');
  const nb = (await call('PUT', url, { baseRevision: null, data: save(), profile: { name: 'JUGADOR' } }, b)).body.profile.name;
  assert.match(nb, /^JUGADOR\d{3}$/);
  const nc = (await call('PUT', url, { baseRevision: null, data: save(), profile: { name: '<b>x</b>' } }, c)).body.profile.name;
  assert.ok(nc.length >= 3 && nc.length <= 16 && !/[<>]/.test(nc));
});

test('foto propia válida se guarda y una inválida se descarta; números sanos', async () => {
  const url = '/api/games/casino-fortuna/save';
  const { body: { token } } = await reg('foto@ejemplo.com');
  const jpg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBD';
  await call('PUT', url, { baseRevision: null, data: save({ coins: -50, chips: 'abc' }), profile: { name: 'Fotografo', avatar: { type: 'custom', data: jpg } } }, token);
  let g = (await call('GET', url, null, token)).body;
  assert.deepEqual(g.profile.avatar, { type: 'custom', data: jpg });
  assert.equal(g.profile.coins, 0); assert.equal(g.profile.chips, 0);
  await call('PUT', url, { baseRevision: 1, data: save(), profile: { name: 'Fotografo', avatar: { type: 'custom', data: 'javascript:alert(1)' } } }, token);
  g = (await call('GET', url, null, token)).body;
  assert.equal(g.profile.avatar.type, 'preset');
});

test('guardado inválido o enorme se rechaza', async () => {
  const { body: { token } } = await reg('malo@ejemplo.com');
  const url = '/api/games/casino-fortuna/save';
  assert.equal((await call('PUT', url, { baseRevision: null, data: [1, 2] }, token)).body.error.code, 'invalid_save');
  assert.equal((await call('PUT', url, { baseRevision: null, data: { x: 'a'.repeat(310000) } }, token)).status, 400);
});

test('ranking público: periodos, posición propia y juego inexistente', async () => {
  const { body: { token } } = await reg('rk1@ejemplo.com');
  const put = await call('PUT', '/api/games/casino-fortuna/save', { baseRevision: null, profile: { name: 'RankUno', avatar: { type: 'preset', id: 'oveja' } }, data: { coins: 0, chips: 90000000000, characters: { unlocked: ['oveja'] }, skins: { owned: [], equipped: {} } } }, token);
  assert.equal(put.status, 200);
  for (const period of ['siempre', 'semana', 'hoy']) {
    const r = await call('GET', `/api/leaderboard/casino-fortuna?period=${period}`);
    assert.equal(r.status, 200);
    assert.equal(r.body.entries[0].name, 'RankUno');
    assert.equal(r.body.me, null);
  }
  const mine = await call('GET', '/api/leaderboard/casino-fortuna', null, token);
  assert.equal(mine.body.me.position, 1);
  assert.equal(mine.body.me.score, 90000000000);
  assert.equal((await call('GET', '/api/leaderboard/casi-perfecto')).body.entries.length, 0);
  assert.equal((await call('GET', '/api/leaderboard/no-existe')).status, 404);
});

test('logout invalida la sesión y CORS responde', async () => {
  const { body: { token } } = await reg('out@ejemplo.com');
  assert.equal((await call('POST', '/api/auth/logout', null, token)).status, 204);
  assert.equal((await call('GET', '/api/me', null, token)).status, 401);
  const pre = await fetch(base + '/api/auth/login', { method: 'OPTIONS', headers: { Origin: 'https://xandajuegos.com' } });
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('access-control-allow-origin'), '*');
});

test('límite de intentos de login', async () => {
  await reg('lim@ejemplo.com');
  let last;
  for (let i = 0; i < 10; i++) last = await call('POST', '/api/auth/login', { email: 'lim@ejemplo.com', password: 'incorrecta-123' });
  assert.equal(last.status, 429);
});


// Instancia propia de la app (su limitador de registros es independiente del de las pruebas anteriores).
let server2, base2;
const call2 = async (method, path, body, token) => {
  if (!server2) {
    await new Promise((r) => { server2 = createApp(pool, { allowedOrigins: '*' }).listen(0, r); });
    base2 = 'http://localhost:' + server2.address().port;
  }
  const res = await fetch(base2 + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
};
const reg2 = (email) => call2('POST', '/api/auth/register', { email, password: 'clave-segura-1', acceptTerms: true });
after(() => { server2?.close(); });

test('PUT /api/me/profile: crea y edita nombre y foto sin tocar el progreso', async () => {
  const t = (await reg2('perfil1@ejemplo.com')).body.token;
  assert.ok(t);
  assert.equal((await call2('PUT', '/api/me/profile', { name: 'PixelZorro' })).status, 401);
  assert.equal((await call2('PUT', '/api/me/profile', { name: 'ab', avatar: { type: 'preset', id: 'zorro' } }, t)).status, 400);
  const a = await call2('PUT', '/api/me/profile', { name: 'PixelZorro', avatar: { type: 'preset', id: 'zorro' } }, t);
  assert.equal(a.status, 200);
  assert.equal(a.body.profile.name, 'PixelZorro');
  let g = await call2('GET', '/api/games/casino-fortuna/save', null, t);
  assert.equal(g.body.exists, false);
  assert.equal(g.body.profile.name, 'PixelZorro');
  assert.equal(g.body.profile.avatar.id, 'zorro');
  assert.equal((await call2('PUT', '/api/me/profile', { name: 'PixelPanda', avatar: { type: 'preset', id: 'panda' } }, t)).status, 200);
  g = await call2('GET', '/api/games/casino-fortuna/save', null, t);
  assert.equal(g.body.profile.name, 'PixelPanda');
  assert.equal(g.body.profile.avatar.id, 'panda');
  // el juego guarda después: el progreso se crea sin conflicto
  const s = await call2('PUT', '/api/games/casino-fortuna/save', { baseRevision: null, data: save(), profile: { name: 'PixelPanda', avatar: { type: 'preset', id: 'panda' } } }, t);
  assert.equal(s.status, 200);
  g = await call2('GET', '/api/games/casino-fortuna/save', null, t);
  assert.equal(g.body.exists, true);
  assert.equal(g.body.profile.coins, 1200);
  // editar el perfil después no borra monedas ni progreso
  await call2('PUT', '/api/me/profile', { name: 'PixelOveja', avatar: { type: 'preset', id: 'oveja' } }, t);
  g = await call2('GET', '/api/games/casino-fortuna/save', null, t);
  assert.equal(g.body.profile.name, 'PixelOveja');
  assert.equal(g.body.profile.coins, 1200);
  assert.equal(g.body.data.characters.unlocked.length, 2);
});

test('PUT /api/me/profile: nombre repetido devuelve 409', async () => {
  const t1 = (await reg2('perfil2@ejemplo.com')).body.token;
  const t2 = (await reg2('perfil3@ejemplo.com')).body.token;
  assert.equal((await call2('PUT', '/api/me/profile', { name: 'NombreUnico', avatar: { type: 'preset', id: 'rana' } }, t1)).status, 200);
  const dup = await call2('PUT', '/api/me/profile', { name: 'nombreunico', avatar: { type: 'preset', id: 'rana' } }, t2);
  assert.equal(dup.status, 409);
  assert.equal(dup.body.error.code, 'name_taken');
});
