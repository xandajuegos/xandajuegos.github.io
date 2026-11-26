-- Casino Fortuna / Mesa Dorada · migración 4
-- Personaje nuevo: Cerdo (2000 monedas en la tienda) y todas sus skins.
-- Ejecutar una sola vez (es seguro repetirla).
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'character', 'cerdo', 'Cerdo', 'Gordito, goloso y con un hocico que huele la fortuna a kilómetros.', 2000, FALSE
FROM games g
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO UPDATE SET coin_cost = 2000;

INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'skin', c.slug || ':' || s.slug, c.name || ' ' || s.name, s.rarity, s.cost, FALSE
FROM games g
JOIN items c ON c.game_id = g.id AND c.item_type = 'character' AND c.slug = 'cerdo'
CROSS JOIN (VALUES
  ('crupier', 'crupier', 'Rara', 500),
  ('real', 'real', 'Épica', 1500),
  ('chef', 'chef', 'Rara', 500),
  ('pirata', 'pirata', 'Ultra rara', 1000),
  ('mago', 'mago', 'Mítica', 2000),
  ('fortuna', 'de la fortuna', 'Legendaria', 2500),
  ('fuego', 'dios del fuego', 'Legendaria', 2500),
  ('trueno', 'rey del trueno', 'Legendaria', 2500),
  ('astronauta', 'astronauta', 'Épica', 1500),
  ('cumple', 'de cumpleaños', 'Ultra rara', 0),
  ('disco', 'disco', 'Mítica', 2000),
  ('vaquero', 'vaquero', 'Rara', 500),
  ('navidad', 'de navidad', 'Rara', 0),
  ('cempasuchil', 'de cempasúchil', 'Rara', 0),
  ('catrin', 'catrín', 'Ultra rara', 0),
  ('catrina', 'catrina', 'Épica', 0),
  ('alebrije', 'alebrije', 'Mítica', 0),
  ('mictlan', 'de Mictlán', 'Legendaria', 0)
) AS s(slug, name, rarity, cost)
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO NOTHING;
