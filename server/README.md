# XandA Juegos · API de cuentas y progreso

API (Node + Express + PostgreSQL) para crear cuentas, iniciar sesión y guardar el progreso de **Casino Fortuna** (el juego de cartas). Usa el esquema de `../database`.

## Puesta en marcha

1. Crea una base PostgreSQL (Neon, Supabase, Render, Railway…) y copia su cadena de conexión.
2. Define las variables de `.env.example` en tu hosting (o en un `.env` si lo cargas tú).
3. `npm install`
4. `npm run db:setup` → aplica `schema.sql` + `seed.sql` (solo si la base está vacía) y `migration-casino-fortuna.sql` (se puede repetir sin problema).
5. `npm start`
6. En el juego, en `src/assets/json/games.json`, rellena el bloque `account`:
   `apiBase` = URL pública de esta API (sin `/` final, con **https**), y `termsUrl` / `privacyUrl` = páginas de tus términos y aviso de privacidad.

## Rutas

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/register` | `{ email, password, acceptTerms: true }` → `{ user, token, expiresAt }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ user, token, expiresAt }` |
| POST | `/api/auth/logout` | Cierra la sesión (token Bearer) |
| GET | `/api/me` | Usuario de la sesión |
| GET | `/api/games/casino-fortuna/save` | `{ exists, revision, profile, data }` |
| PUT | `/api/games/casino-fortuna/save` | `{ baseRevision, data, profile, force? }` → `{ revision, profile }`; `409 conflict` si otro dispositivo guardó antes |
| GET | `/api/health` | Comprobación |

Las rutas protegidas usan `Authorization: Bearer <token>`. Los errores llegan como `{ error: { code, message } }` con mensaje en español.

## Qué guarda y dónde

- `player_profiles`: nombre (único por juego, 3–16), foto, monedas y fichas.
- `inventory` / `equipped_items`: personajes y skins desbloqueados y los equipados.
- `best_scores` / `scores`: ranking de "Mayor fortuna" = máximo de fichas que ha llegado a tener.
- `game_saves.data` (JSON): todo lo demás (trofeos, estadísticas, logros, recompensas, giros, regalo diario, mapas…).

## Seguridad y límites (importante)

- Contraseñas con **scrypt**; sesiones con token aleatorio guardado como hash SHA-256 en `sessions` (90 días por defecto).
- Límite de intentos en memoria: sirve con **una sola instancia**. Si escalas, muévelo a Redis o a la base.
- **El progreso lo calcula el juego en el dispositivo**: un jugador con conocimientos podría editar sus monedas o fichas. Para un ranking serio, el siguiente paso es validar en servidor (por ejemplo, registrar cada premio en `coin_transactions`).
- Falta (pendiente a propósito): verificación de correo y "olvidé mi contraseña".
- El sitio web actual (`login.html`, `perfil.html`) sigue siendo maqueta con `localStorage`. Para que la misma cuenta funcione ahí, sustituye `XA.auth` por llamadas a estas rutas.

## Pruebas

`npm test` levanta un PostgreSQL real embebido (no hay que instalar nada) y prueba registro, login, guardado, conflictos, nombres repetidos, foto, límites y CORS.
