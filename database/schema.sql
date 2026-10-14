-- ============================================================
-- XandA Juegos · Esquema de base de datos (PostgreSQL)
-- Una cuenta de xandajuegos sirve para TODOS los juegos.
-- Cada juego tiene su propio perfil (nombre de jugador + foto),
-- monedas, inventario y puntuaciones.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- correos sin distinguir mayúsculas

-- ---------- 1. CUENTAS (vinculadas al sitio web principal) ----------
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT NOT NULL UNIQUE,
  password_hash   TEXT,                          -- NULL si entra solo con proveedor externo
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  external_id     TEXT UNIQUE,                   -- id de la cuenta en el sitio web principal
  country_code    CHAR(2),
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','deleted')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at   TIMESTAMPTZ
);

CREATE TABLE sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL UNIQUE,
  user_agent  TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions(user_id);

-- ---------- 2. JUEGOS ----------
CREATE TABLE games (
  id           SMALLSERIAL PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,             -- 'casi-perfecto', 'casino-fortuna'
  name         TEXT NOT NULL,
  score_label  TEXT NOT NULL,                    -- 'Pisos', 'Mayor fortuna'
  is_active    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- 3. FOTOS DE PERFIL (avatares) ----------
-- Catálogo compartido por todos los juegos.
CREATE TABLE avatars (
  id          SMALLSERIAL PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,              -- 'zorro', 'oveja', ...
  name        TEXT NOT NULL,
  bg_color    TEXT NOT NULL DEFAULT '#ffd9b8',
  image_url   TEXT,                              -- si algún día hay imágenes subidas
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- 4. PERFIL POR JUEGO ----------
-- Nombre de jugador y foto de perfil de cada usuario EN cada juego.
CREATE TABLE player_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id       SMALLINT NOT NULL REFERENCES games(id),
  player_name   VARCHAR(16) NOT NULL CHECK (char_length(player_name) BETWEEN 3 AND 16),
  avatar_id     SMALLINT NOT NULL REFERENCES avatars(id),
  coins         BIGINT NOT NULL DEFAULT 0 CHECK (coins >= 0),   -- monedas internas del juego
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)                      -- un perfil por juego y usuario
);
CREATE UNIQUE INDEX player_name_unique_per_game ON player_profiles (game_id, lower(player_name));

-- ---------- 5. CATÁLOGO DE OBJETOS DEL JUEGO ----------
-- Casi Perfecto  -> item_type = 'map'
-- Casino Fortuna -> item_type = 'skin' y 'character'
CREATE TABLE items (
  id          SERIAL PRIMARY KEY,
  game_id     SMALLINT NOT NULL REFERENCES games(id),
  item_type   TEXT NOT NULL CHECK (item_type IN ('map','skin','character')),
  slug        TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  coin_cost   INTEGER NOT NULL DEFAULT 0 CHECK (coin_cost >= 0),  -- 0 = incluido
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,                     -- se entrega al crear el perfil
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (game_id, item_type, slug)
);

-- Qué tiene desbloqueado cada perfil
CREATE TABLE inventory (
  profile_id   UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  item_id      INTEGER NOT NULL REFERENCES items(id),
  acquired_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, item_id)
);

-- Qué tiene equipado/seleccionado (un registro por tipo)
CREATE TABLE equipped_items (
  profile_id  UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  item_type   TEXT NOT NULL CHECK (item_type IN ('map','skin','character')),
  item_id     INTEGER NOT NULL REFERENCES items(id),
  PRIMARY KEY (profile_id, item_type)
);

-- ---------- 6. TIENDA (solo monedas, pagadas con dinero real) ----------
CREATE TABLE coin_packs (
  id           SERIAL PRIMARY KEY,
  game_id      SMALLINT NOT NULL REFERENCES games(id),   -- una tienda por juego
  slug         TEXT NOT NULL,
  name         TEXT NOT NULL,
  coins        INTEGER NOT NULL CHECK (coins > 0),
  bonus_coins  INTEGER NOT NULL DEFAULT 0 CHECK (bonus_coins >= 0),
  price_cents  INTEGER NOT NULL CHECK (price_cents >= 0),
  currency     CHAR(3) NOT NULL DEFAULT 'MXN',
  is_popular   BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order   SMALLINT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE (game_id, slug)
);

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id),
  profile_id       UUID NOT NULL REFERENCES player_profiles(id),  -- perfil que recibe las monedas
  coin_pack_id     INTEGER NOT NULL REFERENCES coin_packs(id),
  coins_granted    INTEGER NOT NULL,                              -- copia del valor al comprar
  amount_cents     INTEGER NOT NULL,
  currency         CHAR(3) NOT NULL,
  payment_provider TEXT,                                          -- 'stripe', 'paypal', 'oxxo'...
  provider_ref     TEXT,                                          -- id del cobro en el proveedor
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at          TIMESTAMPTZ
);
CREATE INDEX orders_user_idx ON orders(user_id);
CREATE UNIQUE INDEX orders_provider_ref_unique ON orders(payment_provider, provider_ref) WHERE provider_ref IS NOT NULL;

-- Libro de movimientos de monedas (compras, gastos en el juego, premios...).
-- Así el saldo siempre se puede auditar.
CREATE TABLE coin_transactions (
  id          BIGSERIAL PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  delta       BIGINT NOT NULL,                    -- + entra, - sale
  reason      TEXT NOT NULL CHECK (reason IN ('purchase','item_unlock','gameplay_reward','bonus','refund','admin')),
  order_id    UUID REFERENCES orders(id),
  item_id     INTEGER REFERENCES items(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX coin_tx_profile_idx ON coin_transactions(profile_id, created_at DESC);

-- ---------- 7. PUNTUACIONES Y TOP MUNDIAL ----------
-- Casi Perfecto: score = pisos de la torre
-- Casino Fortuna: score = mayor fortuna alcanzada
CREATE TABLE scores (
  id          BIGSERIAL PRIMARY KEY,
  profile_id  UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  game_id     SMALLINT NOT NULL REFERENCES games(id),
  score       BIGINT NOT NULL CHECK (score >= 0),
  extra       JSONB NOT NULL DEFAULT '{}',        -- mapa usado, minijuego, etc.
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scores_rank_idx ON scores (game_id, score DESC, created_at);
CREATE INDEX scores_period_idx ON scores (game_id, created_at DESC);

-- Mejor marca por perfil (para el ranking "de siempre")
CREATE TABLE best_scores (
  profile_id  UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
  game_id     SMALLINT NOT NULL REFERENCES games(id),
  score       BIGINT NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, game_id)
);
CREATE INDEX best_scores_rank_idx ON best_scores (game_id, score DESC, achieved_at);

-- Ranking mundial "de siempre" listo para la web
CREATE VIEW leaderboard_alltime AS
SELECT b.game_id,
       RANK() OVER (PARTITION BY b.game_id ORDER BY b.score DESC, b.achieved_at) AS position,
       p.player_name, a.slug AS avatar, u.country_code, b.score
FROM best_scores b
JOIN player_profiles p ON p.id = b.profile_id
JOIN avatars a         ON a.id = p.avatar_id
JOIN users u           ON u.id = p.user_id
WHERE u.status = 'active';

-- Ranking de la semana (cambia el intervalo para "hoy")
CREATE VIEW leaderboard_week AS
SELECT s.game_id,
       RANK() OVER (PARTITION BY s.game_id ORDER BY MAX(s.score) DESC) AS position,
       p.player_name, a.slug AS avatar, u.country_code, MAX(s.score) AS score
FROM scores s
JOIN player_profiles p ON p.id = s.profile_id
JOIN avatars a         ON a.id = p.avatar_id
JOIN users u           ON u.id = p.user_id
WHERE s.created_at >= now() - interval '7 days' AND u.status = 'active'
GROUP BY s.game_id, p.id, p.player_name, a.slug, u.country_code;
