// Modo en línea de Casino Fortuna: emparejamiento + sala con orden total de mensajes.
//
// El servidor NO conoce las reglas de los juegos. Hace tres cosas:
//   1) Empareja jugadores por juego (hasta 3 por sala; si no llegan suficientes, la sala se completa
//      con asientos de relleno que los clientes generan con una semilla común).
//   2) Retransmite en orden los mensajes de cada "flujo" (stream) a todos los clientes de la sala.
//        s<n>  = decisiones y habilidades del jugador sentado en el asiento n
//        b<n>  = decisiones del asiento n cuando no lo controla una persona (relleno / jugador que se fue)
//        tbl   = sucesos de la mesa (barajas, dados, giros de ruleta)
//   3) Arbitra: de cada flujo solo se acepta UN mensaje terminal por "slot" (el primero que llegue).
//      Así, si el jugador responde justo cuando vence su tiempo, todos ven lo mismo.
//
// Todos los clientes simulan la misma partida con los mismos mensajes, en el mismo orden.
import { WebSocketServer } from 'ws';
import { randomBytes } from 'node:crypto';

const GAMES = new Set(['ocho', 'poker', 'blackjack', 'ruleta', 'dados']);
const ROOM_SIZE = 3;

const clean = (s, n) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, n);
const num = (v, a, b, d = 0) => { const x = Math.floor(Number(v)); return Number.isFinite(x) ? Math.max(a, Math.min(b, x)) : d; };
const id = (n = 6) => randomBytes(n).toString('hex');

export function attachOnline(httpServer, { path = '/ws/online', waitMs = Number(process.env.ONLINE_WAIT_MS) || 10000, log = () => {} } = {}) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
  const queues = new Map();   // game -> [client]
  const rooms = new Map();    // id -> room

  httpServer.on('upgrade', (req, socket, head) => {
    let url;
    try { url = new URL(req.url, 'http://x'); } catch { return socket.destroy(); }
    if (url.pathname !== path) return;     // otros upgrades (si los hubiera) no son de este módulo
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  const send = (ws, obj) => { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); };

  function dequeue(c) {
    const q = queues.get(c.game);
    if (q) { const i = q.indexOf(c); if (i >= 0) q.splice(i, 1); }
    c.game = null;
  }

  function startRoom(game, members) {
    const room = {
      id: id(), game, seats: [], seq: 0, terms: {}, botSeed: Math.floor(Math.random() * 2 ** 31), created: Date.now(), over: false,
    };
    // Asientos: las personas se reparten al azar; el resto son rellenos
    const order = [0, 1, 2].sort(() => Math.random() - 0.5);
    const stakes = members.map((m) => m.stake).filter((s) => s > 0);
    room.tableStake = stakes.length ? Math.min(...stakes) : 0;
    members.forEach((m, i) => { m.room = room; m.seat = order[i]; room.seats[order[i]] = m; });
    for (let s = 0; s < ROOM_SIZE; s++) room.seats[s] ||= null;
    rooms.set(room.id, room);
    const info = room.seats.map((m) => (m ? { human: true, name: m.name, avatar: m.avatar, char: m.char, skin: m.skin, trophies: m.trophies } : { human: false }));
    const host = hostOf(room);
    for (const m of members) {
      send(m.ws, { t: 'start', room: room.id, seat: m.seat, seats: info, botSeed: room.botSeed, tableStake: room.tableStake, host });
    }
    log('sala', room.id, game, members.map((m) => m.name).join(','));
  }

  const hostOf = (room) => room.seats.findIndex((m) => m && m !== 'gone' && m.ws.readyState === 1);

  function leave(c, why = 'left') {
    dequeue(c);
    const room = c.room;
    if (!room) return;
    c.room = null;
    if (room.seats[c.seat] === c) room.seats[c.seat] = 'gone';
    const humans = room.seats.filter((m) => m && m !== 'gone');
    const host = hostOf(room);
    for (const m of humans) send(m.ws, { t: 'left', seat: c.seat, host, why });
    if (!humans.length) { room.over = true; rooms.delete(room.id); }
  }

  // Cola: cada medio segundo se forman salas
  const tick = setInterval(() => {
    const now = Date.now();
    for (const [game, q] of queues) {
      while (q.length >= ROOM_SIZE) startRoom(game, q.splice(0, ROOM_SIZE));
      if (q.length && now - q[0].since >= waitMs) startRoom(game, q.splice(0, q.length));
      for (const c of q) send(c.ws, { t: 'queued', n: q.length });
    }
    for (const [rid, room] of rooms) if (now - room.created > 6 * 3600e3) rooms.delete(rid);
  }, 700);
  tick.unref();
  // Latidos: se cierran las conexiones muertas
  const beat = setInterval(() => {
    for (const ws of wss.clients) { if (ws.alive === false) { ws.terminate(); continue; } ws.alive = false; try { ws.ping(); } catch { /* cerrado */ } }
  }, 15000);
  beat.unref();

  wss.on('connection', (ws) => {
    const c = { ws, game: null, room: null, seat: -1, since: 0, stake: 0, name: '', avatar: null, char: 'oveja', skin: null, trophies: 0, bucket: { n: 0, t: Date.now() } };
    ws.alive = true;
    ws.on('pong', () => { ws.alive = true; });
    ws.on('message', (raw) => {
      // Límite simple: 60 mensajes por segundo
      const now = Date.now();
      if (now - c.bucket.t > 1000) { c.bucket.t = now; c.bucket.n = 0; }
      if (++c.bucket.n > 60) return;
      let m;
      try { m = JSON.parse(String(raw)); } catch { return; }
      if (!m || typeof m.t !== 'string') return;

      if (m.t === 'queue') {
        if (c.room) return;
        if (!GAMES.has(m.game)) return send(ws, { t: 'err', code: 'bad_game' });
        dequeue(c);
        c.game = m.game;
        c.name = clean(m.name, 16) || 'Jugador';
        c.avatar = m.avatar && m.avatar.type === 'preset' ? { type: 'preset', id: clean(m.avatar.id, 40) } : { type: 'preset', id: 'a1' };
        c.char = clean(m.char, 20) || 'oveja';
        c.skin = m.skin ? clean(m.skin, 40) : null;
        c.trophies = num(m.trophies, 0, 1e7);
        c.stake = num(m.stake, 0, 1e9);
        c.since = Date.now();
        if (!queues.has(c.game)) queues.set(c.game, []);
        queues.get(c.game).push(c);
        send(ws, { t: 'queued', n: queues.get(c.game).length });
        return;
      }
      if (m.t === 'cancel') { dequeue(c); return; }
      if (m.t === 'leave') { leave(c); return; }
      if (m.t === 'ping') { send(ws, { t: 'pong' }); return; }

      if (m.t === 'put') {
        const room = c.room;
        if (!room || room.over) return;
        const st = String(m.st || '');
        const mt = /^(s|b)([0-2])$/.exec(st);
        const isTbl = st === 'tbl';
        if (!mt && !isTbl) return;
        const host = hostOf(room);
        // Quién puede escribir en cada flujo
        if (mt && mt[1] === 's') {
          const owner = Number(mt[2]);
          const isOwner = c.seat === owner;
          // El anfitrión solo puede cerrar el turno de otro (tiempo agotado / jugador ausente)
          if (!isOwner && !(c.seat === host && m.term && m.d && m.d.to === 1)) return;
        } else if (c.seat !== host) return;
        const slot = num(m.slot, 0, 1e6, -1);
        const cur = room.terms[st] || 0;
        if (slot !== cur) return;            // mensaje de un turno ya cerrado o aún no abierto
        const term = !!m.term || isTbl || st[0] === 'b';
        if (term) room.terms[st] = cur + 1;
        const out = { t: 'msg', st, slot, term, d: m.d, seq: ++room.seq };
        for (const p of room.seats) if (p && p !== 'gone') send(p.ws, out);
      }
    });
    ws.on('close', () => leave(c, 'closed'));
    ws.on('error', () => { /* se cierra solo */ });
    send(ws, { t: 'hello', waitMs });
  });

  return { wss, close() { clearInterval(tick); clearInterval(beat); wss.close(); }, stats: () => ({ rooms: rooms.size, queued: [...queues.values()].reduce((a, q) => a + q.length, 0) }) };
}
