// API de cuentas y progreso de XandA Juegos (corregido: incluye PUT /api/me/profile).
import express from 'express';
import { randomInt } from 'node:crypto';
import { hashPassword, verifyPassword, burnPasswordCheck, newToken, tokenHash } from './auth.js';
import { EMAIL_RE, cleanName, cleanAvatar, cleanSave } from './validate.js';

const GAME_SLUG = 'casino-fortuna';

const fail = (status, code, message, extra = {}) => Object.assign(new Error(message), { status, code, extra });

/** Limitador sencillo en memoria: max peticiones por ventana, por clave. */
function limiter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => { const t = Date.now(); for (const [k, v] of hits) if (v.reset < t) hits.delete(k); }, 60000).unref();
  return (keyFn) => (req, res, next) => {
    const k = keyFn(req), t = Date.now();
    const e = hits.get(k);
    if (!e || e.reset < t) { hits.set(k, { n: 1, reset: t + windowMs }); return next(); }
    if (++e.n > max) {
      res.set('Retry-After', String(Math.ceil((e.reset - t) / 1000)));
      return next(fail(429, 'too_many_requests', 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'));
    }
    next();
  };
}

export function createApp(pool, { allowedOrigins = '*', sessionDays = 90, trustProxy = false } = {}) {
  const app = express();
  if (trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '400kb' }));

  // CORS (autenticación por token Bearer, sin cookies)
  const origins = String(allowedOrigins).split(',').map((s) => s.trim()).filter(Boolean);
  app.use((req, res, next) => {
    const o = req.headers.origin;
    if (origins.includes('*')) res.set('Access-Control-Allow-Origin', '*');
    else if (o && origins.includes(o)) { res.set('Access-Control-Allow-Origin', o); res.set('Vary', 'Origin'); }
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.set('Access-Control-Max-Age', '86400');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  const authLimit = limiter({ max: 15, windowMs: 60000 });
  const loginLimit = limiter({ max: 8, windowMs: 60000 });
  const profileLimit = limiter({ max: 20, windowMs: 60000 });
  const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

  /* ---------- Sesiones ---------- */
  async function openSession(client, userId, req) {
    const token = newToken();
    const expires = new Date(Date.now() + sessionDays * 86400000);
    await client.query('INSERT INTO sessions (user_id, token_hash, user_agent, expires_at) VALUES ($1,$2,$3,$4)',
      [userId, tokenHash(token), String(req.headers['user-agent'] || '').slice(0, 300), expires]);
    return { token, expiresAt: expires.toISOString() };
  }

  const requireAuth = wrap(async (req, res, next) => {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
    if (!m) throw fail(401, 'unauthorized', 'Inicia sesión para continuar.');
    const { rows } = await pool.query(
      `SELECT u.id, u.email, s.id AS session_id FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active'`, [tokenHash(m[1])]);
    if (!rows[0]) throw fail(401, 'unauthorized', 'Tu sesión expiró. Vuelve a iniciar sesión.');
    req.user = rows[0];
    next();
  });

  app.get('/api/health', (req, res) => res.json({ ok: true }));

  /* ---------- Registro ---------- */
  app.post('/api/auth/register', authLimit((r) => 'reg:' + r.ip), wrap(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    if (!EMAIL_RE.test(email) || email.length > 254) throw fail(400, 'invalid_email', 'Escribe un correo válido.');
    if (password.length < 8) throw fail(400, 'weak_password', 'La contraseña debe tener al menos 8 caracteres.');
    if (password.length > 128) throw fail(400, 'weak_password', 'La contraseña es demasiado larga (máximo 128).');
    if (req.body?.acceptTerms !== true) throw fail(400, 'terms_required', 'Debes aceptar los términos de uso y el aviso de privacidad.');
    const hash = await hashPassword(password);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let user;
      try {
        user = (await client.query(
          `INSERT INTO users (email, password_hash, terms_accepted_at, last_login_at) VALUES ($1,$2,now(),now()) RETURNING id, email`, [email, hash])).rows[0];
      } catch (e) {
        if (e.code === '23505') { await client.query('ROLLBACK'); throw fail(409, 'email_taken', 'Ese correo ya tiene una cuenta. Inicia sesión.'); }
        throw e;
      }
      const session = await openSession(client, user.id, req);
      await client.query('COMMIT');
      res.status(201).json({ user: { id: user.id, email: user.email }, ...session });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally { client.release(); }
  }));

  /* ---------- Login ---------- */
  app.post('/api/auth/login', authLimit((r) => 'log:' + r.ip), loginLimit((r) => 'logmail:' + String(r.body?.email ?? '').toLowerCase()), wrap(async (req, res) => {
    const email = String(req.body?.email ?? '').trim();
    const password = String(req.body?.password ?? '');
    const bad = fail(401, 'invalid_credentials', 'Correo o contraseña incorrectos.');
    if (!email || !password || password.length > 128) throw bad;
    const { rows } = await pool.query('SELECT id, email, password_hash, status FROM users WHERE email = $1', [email]);
    const u = rows[0];
    if (!u || !u.password_hash) { await burnPasswordCheck(password); throw bad; }
    if (!(await verifyPassword(password, u.password_hash))) throw bad;
    if (u.status !== 'active') throw fail(403, 'account_disabled', 'Esta cuenta está suspendida.');
    const client = await pool.connect();
    try {
      await client.query('UPDATE users SET last_login_at = now() WHERE id = $1', [u.id]);
      const session = await openSession(client, u.id, req);
      client.query('DELETE FROM sessions WHERE expires_at < now()').catch(() => {});
      res.json({ user: { id: u.id, email: u.email }, ...session });
    } finally { client.release(); }
  }));

  app.post('/api/auth/logout', requireAuth, wrap(async (req, res) => {
    await pool.query('DELETE FROM sessions WHERE id = $1', [req.user.session_id]);
    res.sendStatus(204);
  }));

  /* ---------- Cumpleaños (solo mes y día; sirve para las skins de cumpleaños del juego) ---------- */
  const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const BIRTHDAY_LOCK_MS = 365 * 86400000;   // después de guardarlo, solo se puede cambiar una vez al año
  const BIRTHDAY_GRACE_MS = 3600000;         // ...salvo la primera hora (para corregir un error al escribirlo)

  // Si la base de datos aún no tiene las columnas (falta correr la migración), devuelve null y todo sigue funcionando.
  const loadBirthday = async (db, userId) => {
    try {
      const r = (await db.query('SELECT birth_month, birth_day, birthday_changed_at FROM users WHERE id = $1', [userId])).rows[0];
      if (!r) return null;
      const changed = r.birthday_changed_at ? new Date(r.birthday_changed_at) : null;
      return {
        month: r.birth_month, day: r.birth_day, changedAt: changed,
        birthday: r.birth_month && r.birth_day ? { month: r.birth_month, day: r.birth_day } : null,
        editableFrom: changed ? new Date(changed.getTime() + BIRTHDAY_LOCK_MS).toISOString() : null,
      };
    } catch (e) {
      if (e.code === '42703') return null;
      throw e;
    }
  };

  app.get('/api/me', requireAuth, wrap(async (req, res) => {
    const b = await loadBirthday(pool, req.user.id);
    res.json({ user: { id: req.user.id, email: req.user.email, birthday: b?.birthday ?? null, birthdayEditableFrom: b?.birthday ? b.editableFrom : null } });
  }));

  app.put('/api/me/birthday', requireAuth, profileLimit((r) => 'bday:' + r.ip), wrap(async (req, res) => {
    const month = Number(req.body?.month), day = Number(req.body?.day);
    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[month - 1]) {
      throw fail(400, 'invalid_birthday', 'Elige un día y un mes válidos.');
    }
    const cur = await loadBirthday(pool, req.user.id);
    if (!cur) throw fail(503, 'birthday_unavailable', 'El cumpleaños aún no está disponible en el servidor.');
    if (cur.birthday && cur.birthday.month === month && cur.birthday.day === day) {
      return res.json({ birthday: cur.birthday, birthdayEditableFrom: cur.editableFrom });
    }
    if (cur.birthday && cur.changedAt) {
      const age = Date.now() - cur.changedAt.getTime();
      if (age > BIRTHDAY_GRACE_MS && age < BIRTHDAY_LOCK_MS) {
        throw fail(403, 'birthday_locked', 'Tu cumpleaños ya está guardado. Podrás cambiarlo a partir del ' + new Date(cur.editableFrom).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) + '.');
      }
    }
    const row = (await pool.query(
      `UPDATE users SET birth_month = $2, birth_day = $3, birthday_changed_at = CASE WHEN birthday_changed_at IS NULL OR $4 THEN now() ELSE birthday_changed_at END
       WHERE id = $1 RETURNING birthday_changed_at`,
      [req.user.id, month, day, !!(cur.birthday && cur.changedAt && Date.now() - cur.changedAt.getTime() >= BIRTHDAY_LOCK_MS)])).rows[0];
    res.json({ birthday: { month, day }, birthdayEditableFrom: new Date(new Date(row.birthday_changed_at).getTime() + BIRTHDAY_LOCK_MS).toISOString() });
  }));

  /* ---------- Perfil de Casino Fortuna ---------- */
  const loadProfile = async (db, userId, lock = false) => (await db.query(
    `SELECT p.id, p.player_name, p.coins, p.chips, p.avatar_custom, a.slug AS avatar_slug, s.revision, s.data, s.updated_at
     FROM player_profiles p JOIN avatars a ON a.id = p.avatar_id JOIN games g ON g.id = p.game_id
     LEFT JOIN game_saves s ON s.profile_id = p.id
     WHERE p.user_id = $1 AND g.slug = $2 ${lock ? 'FOR UPDATE OF p' : ''}`, [userId, GAME_SLUG])).rows[0];

  const describe = (p) => ({
    revision: Number(p.revision), updatedAt: p.updated_at,
    profile: { name: p.player_name, coins: Number(p.coins), chips: Number(p.chips), avatar: p.avatar_custom ? { type: 'custom', data: p.avatar_custom } : { type: 'preset', id: p.avatar_slug } },
    data: p.data,
  });

  // Busca el avatar por slug; si no existe usa "oveja" y, en último caso, el primero que haya.
  const resolveAvatarId = async (client, slug) =>
    (await client.query('SELECT id FROM avatars WHERE slug = $1 AND is_active', [slug ?? 'oveja'])).rows[0]?.id
    ?? (await client.query("SELECT id FROM avatars WHERE slug = 'oveja'")).rows[0]?.id
    ?? (await client.query('SELECT id FROM avatars ORDER BY id LIMIT 1')).rows[0].id;

  app.get('/api/games/casino-fortuna/save', requireAuth, wrap(async (req, res) => {
    const p = await loadProfile(pool, req.user.id);
    if (!p) return res.json({ exists: false });
    // Hay perfil (nombre y foto elegidos en la web) pero el juego aún no ha guardado progreso.
    if (p.revision == null) return res.json({ exists: false, profile: describe(p).profile });
    res.json({ exists: true, ...describe(p) });
  }));

  /* Editar nombre y foto desde la web (también se usa justo después de registrarse).
     Crea el perfil del juego si todavía no existe; no toca monedas ni progreso. */
  app.put('/api/me/profile', requireAuth, profileLimit((r) => 'prof:' + r.ip), wrap(async (req, res) => {
    const rawName = String(req.body?.name ?? '').trim();
    if (rawName.length < 3 || rawName.length > 16) throw fail(400, 'invalid_name', 'El nombre de jugador debe tener entre 3 y 16 caracteres.');
    const name = cleanName(rawName) || rawName;
    const av = cleanAvatar(req.body?.avatar);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const game = (await client.query('SELECT id FROM games WHERE slug = $1 AND is_active', [GAME_SLUG])).rows[0];
      if (!game) throw fail(503, 'game_unavailable', 'El juego no está disponible en el servidor.');
      const avatarId = await resolveAvatarId(client, av.slug);
      const p = await loadProfile(client, req.user.id, true);
      try {
        if (!p) {
          await client.query(
            `INSERT INTO player_profiles (user_id, game_id, player_name, avatar_id, coins, chips, avatar_custom)
             VALUES ($1,$2,$3,$4,0,0,$5)`, [req.user.id, game.id, name, avatarId, av.custom ?? null]);
        } else {
          await client.query(
            `UPDATE player_profiles SET player_name = $2, avatar_id = $3, avatar_custom = $4, updated_at = now() WHERE id = $1`,
            [p.id, name, avatarId, av.custom ?? null]);
        }
      } catch (e) {
        if (e.code === '23505') throw fail(409, 'name_taken', 'Ese nombre de jugador ya está en uso. Prueba con otro.');
        throw e;
      }
      await client.query('COMMIT');
      res.json({ profile: { name } });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally { client.release(); }
  }));

  /* ---------- Progreso de Casino Fortuna ---------- */
  app.put('/api/games/casino-fortuna/save', requireAuth, wrap(async (req, res) => {
    const { baseRevision = null, force = false } = req.body ?? {};
    let save;
    try { save = cleanSave(req.body?.data); } catch (e) { throw fail(e.status || 400, e.code || 'invalid_save', e.message); }
    const av = cleanAvatar(req.body?.profile?.avatar);
    const wantName = cleanName(req.body?.profile?.name);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const game = (await client.query('SELECT id FROM games WHERE slug = $1 AND is_active', [GAME_SLUG])).rows[0];
      if (!game) throw fail(503, 'game_unavailable', 'El juego no está disponible en el servidor.');

      let p = await loadProfile(client, req.user.id, true);
      if (p && p.revision != null && !force && Number(baseRevision) !== Number(p.revision)) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: { code: 'conflict', message: 'Tu cuenta tiene un progreso más reciente guardado desde otro dispositivo.' }, current: describe(p) });
      }

      // avatar
      const avatarId = await resolveAvatarId(client, av.slug);

      // perfil (nombre único por juego, sin distinguir mayúsculas)
      let name = wantName;
      const trySet = async (candidate) => {
        if (!p) {
          p = (await client.query(
            `INSERT INTO player_profiles (user_id, game_id, player_name, avatar_id, coins, chips, avatar_custom)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [req.user.id, game.id, candidate, avatarId, save.coins, save.chips, av.custom ?? null])).rows[0];
          p.revision = null;
        } else {
          await client.query(
            `UPDATE player_profiles SET player_name = $2, avatar_id = $3, coins = $4, chips = $5, avatar_custom = $6, updated_at = now() WHERE id = $1`,
            [p.id, candidate, avatarId, save.coins, save.chips, av.custom ?? null]);
        }
        return candidate;
      };
      for (let i = 0; ; i++) {
        const candidate = i === 0 ? wantName : (wantName.slice(0, 12) + randomInt(100, 1000)).slice(0, 16);
        await client.query('SAVEPOINT nm');
        try { name = await trySet(candidate); await client.query('RELEASE SAVEPOINT nm'); break; }
        catch (e) {
          await client.query('ROLLBACK TO SAVEPOINT nm');
          if (e.code !== '23505' || i >= 8) throw e;
        }
      }

      // guardado completo con revisión
      const sv = (await client.query(
        `INSERT INTO game_saves (profile_id, data, revision, updated_at) VALUES ($1,$2,1,now())
         ON CONFLICT (profile_id) DO UPDATE SET data = EXCLUDED.data, revision = game_saves.revision + 1, updated_at = now()
         RETURNING revision, updated_at`, [p.id, save.data])).rows[0];

      // inventario (espejo de lo desbloqueado) y equipado
      const slugs = [...save.data.characters.unlocked.map((s) => ['character', s]), ...save.data.skins.owned.map((s) => ['skin', s])];
      await client.query(
        `DELETE FROM inventory i USING items it WHERE i.item_id = it.id AND i.profile_id = $1 AND it.game_id = $2 AND it.item_type IN ('character','skin')`, [p.id, game.id]);
      if (slugs.length) {
        await client.query(
          `INSERT INTO inventory (profile_id, item_id)
           SELECT $1, it.id FROM items it, unnest($3::text[], $4::text[]) AS w(t, s)
           WHERE it.game_id = $2 AND it.item_type = w.t AND it.slug = w.s ON CONFLICT DO NOTHING`,
          [p.id, game.id, slugs.map((x) => x[0]), slugs.map((x) => x[1])]);
      }
      const sel = save.data.selection?.character;
      const eqSkin = sel && save.data.skins.equipped?.[sel];
      await client.query(`DELETE FROM equipped_items WHERE profile_id = $1 AND item_type IN ('character','skin')`, [p.id]);
      if (typeof sel === 'string') {
        await client.query(
          `INSERT INTO equipped_items (profile_id, item_type, item_id)
           SELECT $1, 'character', id FROM items WHERE game_id = $2 AND item_type = 'character' AND slug = $3`, [p.id, game.id, sel]);
        if (typeof eqSkin === 'string') {
          await client.query(
            `INSERT INTO equipped_items (profile_id, item_type, item_id)
             SELECT $1, 'skin', id FROM items WHERE game_id = $2 AND item_type = 'skin' AND slug = $3`, [p.id, game.id, `${sel}:${eqSkin}`]);
        }
      }

      // ranking "Mayor fortuna" = máximo de fichas que ha llegado a tener
      const best = (await client.query('SELECT score FROM best_scores WHERE profile_id = $1 AND game_id = $2', [p.id, game.id])).rows[0];
      if (!best || save.chips > Number(best.score)) {
        await client.query(
          `INSERT INTO best_scores (profile_id, game_id, score, achieved_at) VALUES ($1,$2,$3,now())
           ON CONFLICT (profile_id, game_id) DO UPDATE SET score = EXCLUDED.score, achieved_at = now()`, [p.id, game.id, save.chips]);
        await client.query('INSERT INTO scores (profile_id, game_id, score, extra) VALUES ($1,$2,$3,$4)',
          [p.id, game.id, save.chips, { trophies: save.trophies, played: save.played }]);
      }

      await client.query('COMMIT');
      res.json({ revision: Number(sv.revision), updatedAt: sv.updated_at, profile: { name } });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally { client.release(); }
  }));

  /* ---------- Ranking público ---------- */
  const optionalAuth = wrap(async (req, res, next) => {
    if (!/^Bearer (.+)$/.test(req.headers.authorization || '')) return next();
    return requireAuth(req, res, next);
  });
  const PERIODS = { siempre: null, semana: '7 days', hoy: '1 day' };

  app.get('/api/leaderboard/:game', optionalAuth, wrap(async (req, res) => {
    const slug = String(req.params.game);
    const period = Object.hasOwn(PERIODS, req.query.period) ? req.query.period : 'siempre';
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);
    const game = (await pool.query('SELECT id FROM games WHERE slug = $1 AND is_active', [slug])).rows[0];
    if (!game) throw fail(404, 'not_found', 'Juego no encontrado.');

    // Una fila por jugador: su mejor marca (de siempre) o su mejor marca del periodo.
    const base = PERIODS[period] === null
      ? `SELECT p.id AS pid, p.player_name, a.slug AS avatar, u.country_code, b.score, b.achieved_at AS at
         FROM best_scores b JOIN player_profiles p ON p.id = b.profile_id JOIN avatars a ON a.id = p.avatar_id
         JOIN users u ON u.id = p.user_id WHERE b.game_id = $1 AND u.status = 'active'`
      : `SELECT p.id AS pid, p.player_name, a.slug AS avatar, u.country_code, MAX(s.score) AS score, MIN(s.created_at) AS at
         FROM scores s JOIN player_profiles p ON p.id = s.profile_id JOIN avatars a ON a.id = p.avatar_id
         JOIN users u ON u.id = p.user_id
         WHERE s.game_id = $1 AND u.status = 'active' AND s.created_at >= now() - interval '${PERIODS[period]}'
         GROUP BY p.id, p.player_name, a.slug, u.country_code`;
    const ranked = `SELECT RANK() OVER (ORDER BY score DESC, at) AS position, pid, player_name, avatar, country_code, score FROM (${base}) t`;

    const top = (await pool.query(`SELECT * FROM (${ranked}) r ORDER BY position, player_name LIMIT ${limit}`, [game.id])).rows;
    let me = null;
    if (req.user) {
      const m = (await pool.query(
        `SELECT r.position, r.score FROM (${ranked}) r JOIN player_profiles p ON p.id = r.pid
         WHERE p.user_id = $2 AND p.game_id = $1`, [game.id, req.user.id])).rows[0];
      if (m) me = { position: Number(m.position), score: Number(m.score) };
    }
    res.json({
      game: slug, period, me,
      entries: top.map((r) => ({ rank: Number(r.position), name: r.player_name, avatar: r.avatar, country: r.country_code || null, score: Number(r.score) })),
    });
  }));

  /* ---------- Errores ---------- */
  app.use((req, res) => res.status(404).json({ error: { code: 'not_found', message: 'Ruta no encontrada.' } }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === 'entity.too.large') err = fail(413, 'too_large', 'El guardado es demasiado grande.');
    else if (err.type === 'entity.parse.failed') err = fail(400, 'bad_json', 'Petición inválida.');
    const status = err.status && err.code ? err.status : 500;
    if (status === 500) console.error(err);
    res.status(status).json({ error: { code: status === 500 ? 'server_error' : err.code, message: status === 500 ? 'Error del servidor. Inténtalo más tarde.' : err.message } });
  });

  return app;
}
