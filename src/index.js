import 'dotenv/config';
import pg from 'pg';
import { createApp } from './app.js';

const url = process.env.DATABASE_URL;
if (!url) { console.error('Falta DATABASE_URL (ver .env.example)'); process.exit(1); }
const pool = new pg.Pool({ connectionString: url, max: 10, ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined });
pool.on('error', (e) => console.error('pg', e.message));

const app = createApp(pool, {
  allowedOrigins: process.env.ALLOWED_ORIGINS || '*',
  sessionDays: Number(process.env.SESSION_DAYS) || 90,
  trustProxy: process.env.TRUST_PROXY === '1',
});
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`XandA API escuchando en :${port}`));
