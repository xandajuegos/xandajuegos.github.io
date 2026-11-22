-- ============================================================
-- XandA Juegos · Migración 2 de Casino Fortuna (se puede ejecutar varias veces)
-- Agrega: fotos de perfil de logros y del Pase de Batalla, personajes y skins
-- que faltaban, y las animaciones de resultado como tipo de objeto.
-- Ejecutar DESPUÉS de migration-casino-fortuna.sql.
-- ============================================================

-- 1) Fotos de perfil (si falta el slug, el servidor las cambiaba por 'oveja')
INSERT INTO avatars (slug, name, bg_color) VALUES
  ('av_abuelo_azul', 'Abuelo azul', '#ffd9b8'),
  ('av_abuelo_verde', 'Abuelo verde', '#ffd9b8'),
  ('av_perro', 'Perro', '#ffd9b8'),
  ('av_pica', 'Pica', '#ffd9b8'),
  ('av_corazon', 'Corazón', '#ffd9b8'),
  ('av_diamante', 'Diamante', '#ffd9b8'),
  ('av_trebol', 'Trébol', '#ffd9b8'),
  ('ach_primeros_pasos', 'Primeros Pasos', '#ffd9b8'),
  ('ach_maestro_cartas', 'maestro_cartas', '#ffd9b8'),
  ('ach_leyenda_cartas', 'leyenda_cartas', '#ffd9b8'),
  ('ach_racha', 'Racha', '#ffd9b8'),
  ('ach_espacio', '¿El espacio?', '#ffd9b8'),
  ('ach_artista', 'artista', '#ffd9b8'),
  ('ach_zoologico', 'Zoológico', '#ffd9b8'),
  ('ach_jackpot', 'Jackpot', '#ffd9b8'),
  ('ach_legendario', 'Legendario', '#ffd9b8'),
  ('ach_perfecto', 'Perfecto', '#ffd9b8'),
  ('pase_nov26_f1', 'Pase: Cempasúchil', '#ffd9b8'),
  ('pase_nov26_f2', 'Pase: Calaverita', '#ffd9b8'),
  ('pase_nov26_f3', 'Pase: Vela', '#ffd9b8'),
  ('pase_nov26_p1', 'Pase: Catrín', '#ffd9b8'),
  ('pase_nov26_p2', 'Pase: Catrina', '#ffd9b8'),
  ('pase_nov26_p3', 'Pase: Alebrije', '#ffd9b8'),
  ('pase_nov26_p4', 'Pase: Mictlán', '#ffd9b8')
ON CONFLICT (slug) DO NOTHING;

-- 2) Las animaciones son un tipo de objeto más
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT conrelid::regclass AS t, conname FROM pg_constraint
           WHERE contype = 'c' AND conrelid IN ('items'::regclass, 'equipped_items'::regclass)
             AND pg_get_constraintdef(oid) LIKE '%item_type%'
  LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.t, r.conname); END LOOP;
  ALTER TABLE items ADD CONSTRAINT items_item_type_check CHECK (item_type IN ('map','skin','character','animation'));
  ALTER TABLE equipped_items ADD CONSTRAINT equipped_items_item_type_check CHECK (item_type IN ('map','skin','character','animation'));
END $$;

-- 3) Personajes que faltaban
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'character', v.slug, v.name, v.descr, 0, FALSE
FROM games g, (VALUES
  ('zorro', 'Zorro', 'Astuto, veloz y siempre con un truco bajo la manga.'),
  ('jirafa', 'Jirafa', 'Alta, tranquila y con una vista que alcanza más lejos que nadie.')
) AS v(slug, name, descr)
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO NOTHING;

-- 4) Skins: una fila por personaje. coin_cost 0 = no se vende (cumpleaños, navidad, pase)
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'skin', c.slug || ':' || s.slug, c.name || ' ' || s.name, s.rarity, s.cost, FALSE
FROM games g
JOIN items c ON c.game_id = g.id AND c.item_type = 'character' AND c.slug IN ('oveja','perro','gato','borrego','vaca','zorro','jirafa')
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

-- 5) Animaciones de resultado
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'animation', v.slug, v.name, v.descr, v.cost, FALSE
FROM games g, (VALUES
  ('noche_fichas', 'Noche de Fichas', 'Rara · Mesa de blackjack, tragamonedas y lluvia de fichas.', 500),
  ('dados_locos', 'Dados Locos', 'Rara · Una mesa de dados, doble seis y lluvia de fichas.', 0),
  ('torre_fichas', 'Torre de Fichas', 'Ultra rara · Torres de fichas que llegan al cielo o se derrumban.', 1000),
  ('alfombra_roja', 'Alfombra Roja', 'Épica · La entrada del casino con flashes, reflectores y fuegos artificiales.', 1500),
  ('dragon_dorado', 'Dragón Dorado', 'Mítica · Un dragón gigante cubre el salón de oro y linternas.', 2000),
  ('gran_ruleta', 'Gran Ruleta', 'Ultra rara · Una ruleta gigante, fuegos artificiales y mucho mareo.', 1000),
  ('boveda_oro', 'Bóveda de Oro', 'Épica · Una bóveda llena de oro, alarmas y mucha tensión.', 1500),
  ('mega_jackpot', 'Mega Jackpot', 'Mítica · Una tragamonedas gigante, géiser de monedas y fuegos artificiales.', 2000),
  ('trono_dorado', 'Trono Dorado', 'Legendaria · Un trono de rey, todos los personajes festejando y monedas por todas partes.', 2500),
  ('baraja_voladora', 'Baraja Voladora', 'Rara · Una mesa de cartas, una escalera real y naipes volando por todo el salón.', 500),
  ('torre_champana', 'Torre de Champaña', 'Ultra rara · Una torre de copas en el bar del casino, corchos y burbujeo de victoria.', 1000),
  ('cohete_jackpot', 'Cohete Jackpot', 'Épica · Un cohete sale por la cúpula del casino rumbo a las estrellas.', 1500),
  ('acuario_real', 'Acuario Real', 'Mítica · Un acuario gigante del casino donde tú también estás dentro: ruinas hundidas, peces, tesoros y criaturas que te rodean.', 0),
  ('balanza_destino', 'Balanza del Destino', 'Mítica · Una balanza gigante de oro bajo la cúpula del casino: de un lado la apuesta, del otro tú. El destino decide quién pesa más.', 2000),
  ('piscina_nocturna', 'Piscina Nocturna', 'Legendaria · Una piscina gigante dentro del casino, de noche, una tabla para uno y un amigo flotando a tu lado.', 2500),
  ('tiempo_bala', 'Tiempo Bala', 'Legendaria · La azotea del casino bajo la lluvia: una ráfaga de fichas viene directo hacia ti y el tiempo se detiene.', 2500),
  ('portal_celestial', 'Portal Celestial', 'Legendaria · Un portal dorado se abre sobre el casino. Solo sale de la ruleta de la suerte.', 0)
) AS v(slug, name, descr, cost)
WHERE g.slug = 'casino-fortuna'
ON CONFLICT (game_id, item_type, slug) DO NOTHING;
