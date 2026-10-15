// Prepara la base de datos: schema + seed (solo si está vacía) y la migración (siempre, es idempotente).
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const dir = fileURLToPath(new URL('../../database/', import.meta.url));
const url = process.env.DATABASE_URL;
if (!url) { console.error('Falta DATABASE_URL'); process.exit(1); }
const client = new pg.Client({ connectionString: url, ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined });
await client.connect();
const run = async (f) => { await client.query(await readFile(dir + f, 'utf8')); console.log('✓', f); };
const hasUsers = (await client.query("SELECT to_regclass('public.users') AS t")).rows[0].t;
if (!hasUsers) { await run('schema.sql'); await run('seed.sql'); } else console.log('· schema.sql y seed.sql ya estaban aplicados');
await run('migration-casino-fortuna.sql');
await client.end();
