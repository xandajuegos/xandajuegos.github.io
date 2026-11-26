// Servidor mínimo SOLO del modo en línea (sin base de datos), para probar en local:
//   node scripts/online-dev.js   (puerto 3001)
import http from 'node:http';
import { attachOnline } from '../src/online.js';
const server = http.createServer((req, res) => { res.setHeader('Access-Control-Allow-Origin', '*'); res.end('{"ok":true}'); });
attachOnline(server, { waitMs: Number(process.env.ONLINE_WAIT_MS) || 4000, log: (...a) => console.log('[online]', ...a) });
server.listen(Number(process.env.PORT) || 3001, () => console.log('online-dev en :' + (process.env.PORT || 3001)));
