-- Datos iniciales (los mismos de la maqueta). Precios y costos son EJEMPLO.

INSERT INTO games (slug, name, score_label) VALUES
  ('casi-perfecto', 'Casi Perfecto', 'Pisos'),
  ('casino-fortuna', 'Casino Fortuna', 'Mayor fortuna');

INSERT INTO avatars (slug, name, bg_color) VALUES
  ('zorro','Zorro','#ffd9b8'), ('oveja','Oveja','#cfe8ff'), ('rana','Rana','#d6f5c6'), ('panda','Panda','#e6dcff'),
  ('gato','Gato','#ffe0ec'), ('robot','Robot','#d4f3ff'), ('dado','Dado','#ffe9a8'), ('hongo','Hongo','#ffd1dd');

-- Casi Perfecto: mapas
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'map', v.slug, v.name, v.descr, v.cost, v.cost = 0
FROM games g, (VALUES
  ('ciudad','Ciudad','Rascacielos de cristal al atardecer.',0),
  ('desierto','Desierto','Dunas, cactus y un sol que no perdona.',150),
  ('artico','Ártico','Hielo resbaloso y pinos nevados.',200),
  ('bosque','Bosque','Un claro tranquilo entre árboles gigantes.',250),
  ('playa','Playa','Palmeras, sombrillas y mar turquesa.',300),
  ('espacio','Espacio','Torres sin gravedad entre planetas.',500)
) AS v(slug,name,descr,cost) WHERE g.slug = 'casi-perfecto';

-- Casino Fortuna: skins y personajes
INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'skin', v.slug, v.name, v.descr, v.cost, v.cost = 0
FROM games g, (VALUES
  ('clasico','Clásico','Paño verde de casino de toda la vida.',0),
  ('neon','Neón','Luces rosas para jugar de noche.',800),
  ('oro','Oro real','Para los que juegan en grande.',2500),
  ('medianoche','Medianoche','Azul profundo, elegancia total.',1200),
  ('vintage','Vintage','Terciopelo rojo y madera clásica.',1500),
  ('hielo','Hielo','Frío, limpio y brillante.',1800)
) AS v(slug,name,descr,cost) WHERE g.slug = 'casino-fortuna';

INSERT INTO items (game_id, item_type, slug, name, description, coin_cost, is_default)
SELECT g.id, 'character', v.slug, v.name, v.descr, v.cost, v.cost = 0
FROM games g, (VALUES
  ('lucky','Lucky','Zorro de la suerte.',0),
  ('crupier','Don Marlo','El crupier.',3000),
  ('jade','Madame Jade','La jugadora.',4500),
  ('dado','Capitán Dado','El de la cabeza cúbica.',6000),
  ('robo','Robo-777','Autómata de la fortuna.',8000)
) AS v(slug,name,descr,cost) WHERE g.slug = 'casino-fortuna';

-- Tiendas (solo monedas). price_cents en centavos de MXN.
INSERT INTO coin_packs (game_id, slug, name, coins, bonus_coins, price_cents, is_popular, sort_order)
SELECT g.id, v.slug, v.name, v.coins, v.bonus, v.price * 100, v.pop, v.ord
FROM games g, (VALUES
  ('casi-perfecto','cp-100','Puñado',100,0,19,FALSE,1),
  ('casi-perfecto','cp-550','Bolsa',550,50,79,FALSE,2),
  ('casi-perfecto','cp-1200','Alforja',1200,200,149,TRUE,3),
  ('casi-perfecto','cp-2800','Cofre',2800,600,299,FALSE,4),
  ('casi-perfecto','cp-6500','Tesoro',6500,1800,599,FALSE,5),
  ('casino-fortuna','cf-1k','Fichas de bienvenida',1000,0,19,FALSE,1),
  ('casino-fortuna','cf-6k','Mano ganadora',6000,500,99,FALSE,2),
  ('casino-fortuna','cf-15k','Mesa llena',15000,2500,199,TRUE,3),
  ('casino-fortuna','cf-40k','Cofre del crupier',40000,9000,449,FALSE,4),
  ('casino-fortuna','cf-100k','Gran jackpot',100000,30000,999,FALSE,5)
) AS v(game,slug,name,coins,bonus,price,pop,ord) WHERE g.slug = v.game;
