-- ============================================================
-- XandA Juegos · Migración para guardar el progreso de Casino Fortuna
-- (el juego de cartas "Mesa Dorada"). Se puede ejecutar varias veces.
-- Ejecutar DESPUÉS de schema.sql y seed.sql.
-- ============================================================

-- 1) Lo que faltaba en el perfil del juego -------------------
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS chips BIGINT NOT NULL DEFAULT 0 CHECK (chips >= 0);  -- segunda moneda (fichas)
ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS avatar_custom TEXT                                   -- foto subida por el jugador (data URL)
  CHECK (avatar_custom IS NULL OR length(avatar_custom) <= 120000);

-- 2) Términos aceptados al crear la cuenta -------------------
ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- 3) Guardado completo del juego -----------------------------
-- Trofeos, estadísticas, logros, recompensas, giros, regalo diario,
-- skins equipadas, mapas elegidos… Todo lo que no tiene tabla propia.
-- `revision` sube en cada guardado y sirve para detectar que otro
-- dispositivo guardó antes (conflicto).
CREATE TABLE IF NOT EXISTS game_saves (
  profile_id     UUID PRIMARY KEY REFERENCES player_profiles(id) ON DELETE CASCADE,
  schema_version INTEGER NOT NULL DEFAULT 1,
  revision       BIGINT  NOT NULL DEFAULT 1,
  data           JSONB   NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Fotos de perfil que ya existen en el juego --------------
INSERT INTO avatars (slug, name, bg_color) VALUES
  ('av_abuelo_azul',  'Abuelo azul',  '#9ad8ff'),
  ('av_abuelo_verde', 'Abuelo verde', '#bff0c4'),
  ('av_perro',        'Perro',        '#ffe0b8'),
  ('av_pica',         'Pica',         '#5b6cff'),
  ('av_corazon',      'Corazón',      '#ff5e7e'),
  ('av_diamante',     'Diamante',     '#ffb02e'),
  ('av_trebol',       'Trébol',       '#38d67a')
ON CONFLICT (slug) DO NOTHING;

-- 5) Catálogo real de Casino Fortuna -------------------------
-- Los objetos de ejemplo del seed (Lucky, Don Marlo, Neón…) se desactivan
-- (no se borran por si algún perfil ya los tuviera).
UPDATE items SET is_active = FALSE
WHERE game_id = (SELECT id FROM games WHERE slug = 'casino-fortuna')
  AND item_type IN ('skin','character')
  AND slug IN ('clasico','neon','oro','medianoche','vintage','hielo','lucky','crupier','jade','dado','robo');

-- Personajes (coin_cost = precio en la tienda; los de trofeos cuestan 0)
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'character', v.slug, v.name, v.descr, v.cost, v.dflt
FROM games g, (VALUES
  ('oveja',   'Oveja',   'Tranquila, esponjosa y con muy buena cara de póker.', 0,   TRUE),
  ('perro',   'Perro',   'Se desbloquea con 1,000 trofeos globales.',           0,   FALSE),
  ('gato',    'Gato',    'Se desbloquea con 2,000 trofeos globales.',           0,   FALSE),
  ('borrego', 'Borrego', 'Se desbloquea con 3,000 trofeos globales.',           0,   FALSE),
  ('vaca',    'Vaca',    'Solo se consigue en la tienda.',                      500, FALSE)
) AS v(slug, name, descr, cost, dflt)
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO NOTHING;

-- Skins: una por personaje. slug = 'personaje:skin'. Precio según rareza.
-- (la de cumpleaños no se vende: coin_cost 0 y se entrega el día del cumpleaños)
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'skin', c.slug || ':' || s.slug, c.name || ' ' || s.name, s.rarity, s.cost, FALSE
FROM games g
JOIN items c ON c.game_id = g.id AND c.item_type = 'character' AND c.slug IN ('oveja','perro','gato','borrego','vaca')
CROSS JOIN (VALUES
  ('crupier',    'crupier',         'Rara',       500),
  ('chef',       'chef',            'Rara',       500),
  ('pirata',     'pirata',          'Ultra rara', 1000),
  ('real',       'real',            'Épica',      1500),
  ('astronauta', 'astronauta',      'Épica',      1500),
  ('mago',       'mago',            'Mítica',     2000),
  ('fortuna',    'de la fortuna',   'Legendaria', 2500),
  ('cumple',     'de cumpleaños',   'Ultra rara', 0)
) AS s(slug, name, rarity, cost)
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO NOTHING;
