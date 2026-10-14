# XandA Juegos · Sitio web

Sitio estático (HTML + CSS + JS, sin dependencias ni compilación). Abre `index.html` en el navegador o súbelo tal cual a cualquier hosting.

## Páginas

| Archivo | Contenido |
|---|---|
| `index.html` | Inicio: hero 3D, los dos juegos, top mundial, tiendas, cuenta |
| `casi-perfecto.html` | Página del juego, cómo se juega, mapas |
| `casino-fortuna.html` | Página del juego, juegos del casino, skins y personajes |
| `ranking.html` | Top mundial por juego y periodo (hoy / semana / de siempre) |
| `tienda-casi-perfecto.html` | Tienda de monedas de Casi Perfecto |
| `tienda-casino-fortuna.html` | Tienda de monedas de Casino Fortuna |
| `login.html` | Iniciar sesión y crear cuenta (nombre de jugador + foto de perfil) |
| `perfil.html` | Perfil: datos, monedas, mapas / skins / personajes por juego |

## Cómo está hecho el 3D

Todo el estilo poligonal sale de `js/cubes.js`: cada modelo es una lista de cajas `{x,y,z,w,h,d,c}` que se convierten en cubos reales con CSS 3D (vista isométrica, sin imágenes). Los modelos están en `js/models.js` (torre, tragamonedas, zorro, mapas, mesas, personajes, avatares…). Para añadir uno nuevo, agrega una función a `XA.models` y úsala en el HTML así:

```html
<div class="stage stage-card" data-model="slot" data-s="30" data-tilt></div>
```

## Qué es maqueta (y qué falta conectar)

- **Sesión**: `XA.auth` en `js/data.js` guarda usuarios en `localStorage` solo para poder probar el flujo. Reemplázalo por llamadas a tu API / cuenta del sitio principal.
- **Ranking**: `XA.leaderboard()` genera datos de ejemplo. Sustitúyelo por las vistas `leaderboard_alltime` / `leaderboard_week`.
- **Tiendas**: el botón de pago abre un modal visual; no cobra nada. Conecta ahí tu pasarela de pago.
- **Precios, costos en monedas y lista de juegos del casino**: son ejemplos (`js/data.js`, `database/seed.sql`). Ajusta a los reales.
- El botón "Jugar ahora" (`data-play`) muestra un aviso; pon ahí el enlace al juego.

## Base de datos (`/database`)

`schema.sql` (PostgreSQL) y `seed.sql`. Puntos clave:

- **`users`**: una cuenta única, con `external_id` para vincularla al sitio web principal.
- **`player_profiles`**: un perfil por usuario **y por juego**, con `player_name`, `avatar_id` y `coins`.
- **`avatars`**: catálogo de fotos de perfil compartido.
- **`items`** + **`inventory`** + **`equipped_items`**: mapas (Casi Perfecto) y skins / personajes (Casino Fortuna), con lo que tiene y lo que usa cada perfil.
- **`coin_packs`** (una tienda por juego) → **`orders`** → **`coin_transactions`**: lo único que se compra con dinero real son monedas; el libro de movimientos permite auditar cada saldo.
- **`scores`** / **`best_scores`** y las vistas **`leaderboard_alltime`** y **`leaderboard_week`** para el top mundial.

Para agregar un tercer juego basta una fila en `games`, sus `items` y sus `coin_packs`; nada del esquema cambia.
