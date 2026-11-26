-- Casino Fortuna / Mesa Dorada · migración 3
-- Los personajes de la tienda (vaca, zorro, jirafa) ahora cuestan 2000 monedas.
-- Ejecutar una sola vez (es seguro repetirla).
UPDATE items
SET coin_cost = 2000
WHERE item_type = 'character'
  AND slug IN ('vaca', 'zorro', 'jirafa')
  AND game_id = (SELECT id FROM games WHERE slug = 'casino-fortuna');
