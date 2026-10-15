/* ==========================================================
   XandA Juegos · Datos de ejemplo (visuales, sin backend)
   Todo lo marcado como EJEMPLO se reemplazará por la API
   cuando se conecte la base de datos (ver /database).

   data.js corregido
   ========================================================== */
(function (XA) {
  XA.CURRENCY = 'MXN';
  XA.money = function (n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: XA.CURRENCY, maximumFractionDigits: 0 }).format(n);
  };
  XA.num = function (n) { return new Intl.NumberFormat('es-MX').format(n); };

  /* ---------- juegos ---------- */
  XA.games = {
    'casi-perfecto': {
      id: 'casi-perfecto', name: 'Casi Perfecto', page: 'casi-perfecto.html', shop: 'tienda-casi-perfecto.html',
      scoreLabel: 'Pisos', scoreUnit: 'pisos', color: '#ff5a8a', coinName: 'monedas'
    },
    'casino-fortuna': {
      id: 'casino-fortuna', name: 'Casino Fortuna', page: 'casino-fortuna.html', shop: 'tienda-casino-fortuna.html',
      scoreLabel: 'Mayor fortuna', scoreUnit: 'monedas', color: '#ffd54a', coinName: 'monedas'
    }
  };

  /* ---------- avatares (foto de perfil) ---------- */
  XA.avatars = [
    { id: 'zorro', name: 'Zorro', bg: '#ffd9b8' }, { id: 'oveja', name: 'Oveja', bg: '#cfe8ff' },
    { id: 'rana', name: 'Rana', bg: '#d6f5c6' }, { id: 'panda', name: 'Panda', bg: '#e6dcff' },
    { id: 'gato', name: 'Gato', bg: '#ffe0ec' }, { id: 'robot', name: 'Robot', bg: '#d4f3ff' },
    { id: 'dado', name: 'Dado', bg: '#ffe9a8' }, { id: 'hongo', name: 'Hongo', bg: '#ffd1dd' }
  ];
  XA.avatarById = function (id) { return XA.avatars.filter(function (a) { return a.id === id; })[0] || XA.avatars[0]; };

  /* avatar 3D en miniatura */
  XA.avatar = function (id, size) {
    var av = XA.avatarById(id);
    size = size || 48;
    var el = document.createElement('div');
    el.className = 'avatar';
    el.style.width = el.style.height = size + 'px';
    el.style.background = av.bg;
    var st = XA.stage(XA.models.avatar({ kind: av.id }), { s: size * 0.34, cy: 66, sway: false });
    el.appendChild(st);
    return el;
  };

  /* ---------- packs de monedas (EJEMPLO de precios) ---------- */
  XA.packs = {
    'casi-perfecto': [
      { id: 'cp-100', name: 'Puñado', coins: 100, bonus: 0, price: 19, tier: 1 },
      { id: 'cp-550', name: 'Bolsa', coins: 550, bonus: 50, price: 79, tier: 2 },
      { id: 'cp-1200', name: 'Alforja', coins: 1200, bonus: 200, price: 149, tier: 3, popular: true },
      { id: 'cp-2800', name: 'Cofre', coins: 2800, bonus: 600, price: 299, tier: 4 },
      { id: 'cp-6500', name: 'Tesoro', coins: 6500, bonus: 1800, price: 599, tier: 5 }
    ],
    'casino-fortuna': [
      { id: 'cf-1k', name: 'Fichas de bienvenida', coins: 1000, bonus: 0, price: 19, tier: 1 },
      { id: 'cf-6k', name: 'Mano ganadora', coins: 6000, bonus: 500, price: 99, tier: 2 },
      { id: 'cf-15k', name: 'Mesa llena', coins: 15000, bonus: 2500, price: 199, tier: 3, popular: true },
      { id: 'cf-40k', name: 'Cofre del crupier', coins: 40000, bonus: 9000, price: 449, tier: 4 },
      { id: 'cf-100k', name: 'Gran jackpot', coins: 100000, bonus: 30000, price: 999, tier: 5 }
    ]
  };

  /* ---------- Casi Perfecto: mapas (EJEMPLO) ---------- */
  XA.maps = [
    { id: 'ciudad', name: 'Ciudad', desc: 'Rascacielos de cristal al atardecer.', bg: 'linear-gradient(#e9c28f,#a68bb5)', cost: 0 },
    { id: 'desierto', name: 'Desierto', desc: 'Dunas, cactus y un sol que no perdona.', bg: 'linear-gradient(#ffe29a,#ffb36b)', cost: 150 },
    { id: 'artico', name: 'Ártico', desc: 'Hielo resbaloso y pinos nevados.', bg: 'linear-gradient(#d7f1ff,#9fd6f5)', cost: 200 },
    { id: 'bosque', name: 'Bosque', desc: 'Un claro tranquilo entre árboles gigantes.', bg: 'linear-gradient(#bff0a6,#6cc24a)', cost: 250 },
    { id: 'playa', name: 'Playa', desc: 'Palmeras, sombrillas y mar turquesa.', bg: 'linear-gradient(#bdf0ff,#f6dc9b)', cost: 300 },
    { id: 'espacio', name: 'Espacio', desc: 'Torres sin gravedad entre planetas.', bg: 'linear-gradient(#3b2f8a,#12082e)', cost: 500 }
  ];

  /* ---------- Casino Fortuna: skins y personajes (EJEMPLO) ---------- */
  XA.skins = [
    { id: 'clasico', name: 'Clásico', desc: 'Paño verde de casino de toda la vida.', felt: '#1f9d55', rim: '#7a4a2a', chip: '#ff5a8a', bg: 'linear-gradient(#3b2f8a,#241862)', cost: 0 },
    { id: 'neon', name: 'Neón', desc: 'Luces rosas para jugar de noche.', felt: '#3a1a8a', rim: '#ff5a8a', chip: '#5ec8ee', bg: 'linear-gradient(#5b2aa8,#1d1445)', cost: 800 },
    { id: 'oro', name: 'Oro real', desc: 'Para los que juegan en grande.', felt: '#b8860b', rim: '#ffd54a', chip: '#ffffff', bg: 'linear-gradient(#6b4a12,#2a1d05)', cost: 2500 },
    { id: 'medianoche', name: 'Medianoche', desc: 'Azul profundo, elegancia total.', felt: '#1d3a8a', rim: '#1d1445', chip: '#ffd54a', bg: 'linear-gradient(#25306e,#0d0a2a)', cost: 1200 },
    { id: 'vintage', name: 'Vintage', desc: 'Terciopelo rojo y madera clásica.', felt: '#a8243a', rim: '#5a3418', chip: '#fff3e0', bg: 'linear-gradient(#7a2036,#2a0d17)', cost: 1500 },
    { id: 'hielo', name: 'Hielo', desc: 'Frío, limpio y brillante.', felt: '#6fc6e8', rim: '#e8f6ff', chip: '#7c5cff', bg: 'linear-gradient(#bfe9ff,#5ec8ee)', cost: 1800 }
  ];
  XA.characters = [
    { id: 'lucky', name: 'Lucky', role: 'Zorro de la suerte', desc: 'Siempre con sombrero y siempre con una carta bajo la manga.', bg: 'linear-gradient(#ffcf9a,#ff8a4c)', cost: 0 },
    { id: 'crupier', name: 'Don Marlo', role: 'El crupier', desc: 'Reparte con elegancia y no se le escapa nada.', bg: 'linear-gradient(#ff9aa8,#e8334f)', cost: 3000 },
    { id: 'jade', name: 'Madame Jade', role: 'La jugadora', desc: 'Pelo verde, mirada fría y cero piedad en el póker.', bg: 'linear-gradient(#b9a4ff,#7c5cff)', cost: 4500 },
    { id: 'dado', name: 'Capitán Dado', role: 'El de la cabeza cúbica', desc: 'Nadie sabe si tiene suerte o si simplemente es el dado.', bg: 'linear-gradient(#ffd0e0,#ff5a8a)', cost: 6000 },
    { id: 'robo', name: 'Robo-777', role: 'Autómata de la fortuna', desc: 'Calcula probabilidades… y las ignora.', bg: 'linear-gradient(#c8f0ff,#5ec8ee)', cost: 8000 }
  ];
  XA.casinoGames = [
    { id: 'tragamonedas', name: 'Tragamonedas', desc: 'Gira, alinea y sueña con el premio mayor.' },
    { id: 'ruleta', name: 'Ruleta', desc: 'Rojo, negro o tu número de la suerte.' },
    { id: 'blackjack', name: 'Blackjack', desc: 'Llega a 21 sin pasarte.' },
    { id: 'poker', name: 'Póker', desc: 'Cara de piedra y manos legendarias.' },
    { id: 'dados', name: 'Dados', desc: 'Lanza y deja que ruede la fortuna.' }
  ]; /* EJEMPLO: ajusta a los juegos reales de Casino Fortuna */


  /* ---------- ranking real (API) ---------- */
  XA.GAME_SLUGS = { 'casi-perfecto': 'casi-perfecto', 'casino-fortuna': 'casino-fortuna' };
  XA.scoreText = function (game, v) {
    if (game === 'casi-perfecto') return XA.num(v);
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.0', '') + ' M';
    if (v >= 1e3) return Math.round(v / 1e3) + ' k';
    return String(v);
  };

  /* ==========================================================
     CUENTAS Y DATOS REALES · API de XandA Juegos
     - Sesión: token Bearer en localStorage.
     - Nombre, foto, monedas, fichas y colección de Casino Fortuna
       vienen del progreso que el juego sincroniza con la cuenta.
     - El nombre y la foto también se pueden elegir al crear la
       cuenta y cambiar desde "Editar perfil" (PUT /api/me/profile).
     - Si la API no responde, se muestra el último dato guardado.
     ========================================================== */
  var API_URL = 'https://xanda-juegos-api.onrender.com/api';
  var TOKEN_KEY = 'xanda_auth_token';
  var USER_KEY = 'xanda_auth_user';

  function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function drop() { try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch (e) {} }

  function request(path, options) {
    options = options || {};
    var headers = { 'Content-Type': 'application/json' };
    var token = load(TOKEN_KEY, null);
    if (token) headers.Authorization = 'Bearer ' + token;
    return fetch(API_URL + path, Object.assign({}, options, { headers: headers })).then(function (res) {
      if (res.status === 204) return null;
      return res.json().catch(function () { return {}; }).then(function (body) {
        if (!res.ok) {
          var e = body && body.error;
          var err = new Error((e && e.message) || (typeof e === 'string' ? e : '') || 'No se pudo completar la solicitud.');
          err.status = res.status;
          err.code = e && e.code;
          throw err;
        }
        return body;
      });
    });
  }

  function translateError(error) {
    if (!error) return 'Ocurrió un error inesperado.';
    if (error instanceof TypeError) return 'No se pudo conectar con el servidor. Si estaba dormido, espera unos segundos e inténtalo de nuevo.';
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo más tarde.';
    return error.message || 'No se pudo completar la solicitud.';
  }

  /* Catálogo de Casino Fortuna (nombres para mostrar lo que trae el guardado) */
  XA.cfChars = { oveja: 'Oveja', perro: 'Perro', gato: 'Gato', borrego: 'Borrego', vaca: 'Vaca' };
  XA.cfSkins = { crupier: 'Crupier', real: 'Real', chef: 'Chef', pirata: 'Pirata', mago: 'Mago', fortuna: 'De la fortuna', astronauta: 'Astronauta', cumple: 'De cumpleaños' };

  /* Fotos de perfil que existen en el juego */
  var GAME_AV = {
    av_abuelo_azul: { bg: '#9ad8ff', g: '👴' }, av_abuelo_verde: { bg: '#bff0c4', g: '👴' }, av_perro: { bg: '#ffe0b8', g: '🐶' },
    av_pica: { bg: '#5b6cff', g: '♠' }, av_corazon: { bg: '#ff5e7e', g: '♥' }, av_diamante: { bg: '#ffb02e', g: '♦' }, av_trebol: { bg: '#38d67a', g: '♣' }
  };
  var siteAvatar = XA.avatar;
  XA.avatar = function (id, size) {
    size = size || 48;
    id = id || '';
    if (/^data:image\//.test(id) || GAME_AV[id]) {
      var el = document.createElement('div');
      el.className = 'avatar';
      el.style.width = el.style.height = size + 'px';
      if (GAME_AV[id]) {
        el.style.background = GAME_AV[id].bg;
        el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
        el.style.color = '#fff'; el.style.fontSize = Math.round(size * 0.5) + 'px';
        el.textContent = GAME_AV[id].g;
      } else {
        el.style.background = '#e6dcff url("' + id + '") center/cover no-repeat';
      }
      return el;
    }
    return siteAvatar(id, size);
  };

  var currentUser = null;
  var initPromise = null;

  function nameFromEmail(email) { return String(email || 'Jugador').split('@')[0].slice(0, 16); }

  /* Convierte el id de avatar que usa el sitio al formato que entiende la API */
  function avatarPayload(id) {
    id = id || 'zorro';
    if (/^data:image\//.test(id)) return { type: 'custom', data: id };
    return { type: 'preset', id: id };
  }

  function buildUser(apiUser, saveRes) {
    var u = { id: apiUser.id, email: apiUser.email, playerName: nameFromEmail(apiUser.email), avatar: 'zorro', game: null };
    // El perfil (nombre y foto) puede existir aunque el juego aún no haya sincronizado su progreso.
    if (saveRes && (saveRes.exists || saveRes.profile)) {
      var p = saveRes.profile || {};
      u.playerName = p.name || u.playerName;
      u.avatar = p.avatar ? (p.avatar.type === 'custom' ? p.avatar.data : p.avatar.id) : 'oveja';
    }
    if (saveRes && saveRes.exists) {
      var d = saveRes.data || {}, pr = saveRes.profile || {};
      u.game = {
        coins: pr.coins || 0,
        chips: pr.chips || 0,
        characters: (d.characters && d.characters.unlocked) || [],
        skins: (d.skins && d.skins.owned) || [],
        updatedAt: saveRes.updatedAt
      };
    }
    return u;
  }

  function fetchUser() {
    return request('/me').then(function (me) {
      return request('/games/casino-fortuna/save').catch(function () { return null; }).then(function (s) {
        currentUser = buildUser(me.user, s);
        save(USER_KEY, currentUser);
        return currentUser;
      });
    });
  }

  XA.auth = {
    apiUrl: API_URL,
    init: function () {
      if (initPromise) return initPromise;
      initPromise = (function () {
        if (!load(TOKEN_KEY, null)) { currentUser = null; return Promise.resolve(null); }
        return fetchUser().catch(function (error) {
          if (error.status === 401 || error.status === 403) { drop(); currentUser = null; return null; }
          currentUser = load(USER_KEY, null); // API dormida o sin red: último dato guardado
          return currentUser;
        });
      })();
      return initPromise;
    },
    current: function () { return currentUser; },
    _preview: function (u) { if (!currentUser) currentUser = u; },

    /* d = { email, password, playerName?, avatar? }
       Devuelve { user, warning? } o { error } */
    register: function (d) {
      return request('/auth/register', { method: 'POST', body: JSON.stringify({ email: d.email.trim(), password: d.password, acceptTerms: true }) })
        .then(function (r) {
          save(TOKEN_KEY, r.token);
          currentUser = buildUser(r.user, null);
          var warning = null;
          var chain = Promise.resolve();
          if (d.playerName) {
            var av = d.avatar || 'zorro';
            chain = request('/me/profile', { method: 'PUT', body: JSON.stringify({ name: d.playerName, avatar: avatarPayload(av) }) })
              .then(function (pr) {
                currentUser.playerName = (pr && pr.profile && pr.profile.name) || d.playerName;
                currentUser.avatar = av;
              })
              .catch(function (e) {
                // La cuenta ya se creó: no se pierde, solo se avisa para que lo cambie en "Editar perfil".
                warning = 'Tu cuenta se creó, pero no se pudo guardar tu nombre y foto: ' + translateError(e) + ' Puedes cambiarlos en Editar perfil.';
              });
          }
          return chain.then(function () {
            save(USER_KEY, currentUser);
            initPromise = Promise.resolve(currentUser);
            return { user: currentUser, warning: warning };
          });
        }).catch(function (e) { return { error: translateError(e) }; });
    },

    login: function (email, password) {
      return request('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.trim(), password: password }) })
        .then(function (r) {
          save(TOKEN_KEY, r.token);
          return fetchUser();
        }).then(function (u) {
          initPromise = Promise.resolve(u);
          return { user: u };
        }).catch(function (e) { drop(); return { error: translateError(e) }; });
    },

    /* patch = { playerName, avatar }. Devuelve { user } o { error } */
    update: function (patch) {
      var name = (patch.playerName || '').trim();
      var av = patch.avatar || (currentUser && currentUser.avatar) || 'zorro';
      return request('/me/profile', { method: 'PUT', body: JSON.stringify({ name: name, avatar: avatarPayload(av) }) })
        .then(function (r) {
          if (currentUser) {
            currentUser.playerName = (r && r.profile && r.profile.name) || name;
            currentUser.avatar = av;
            save(USER_KEY, currentUser);
          }
          return { user: currentUser };
        }).catch(function (e) { return { error: translateError(e) }; });
    },

    logout: function () {
      var token = load(TOKEN_KEY, null);
      drop();
      currentUser = null;
      initPromise = Promise.resolve(null);
      if (!token) return Promise.resolve();
      return fetch(API_URL + '/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } }).catch(function () {});
    }
  };

  /* Ranking real. Devuelve { entries:[{rank,name,avatar,country,score}], me } */
  XA.leaderboard = function (game, period) {
    return request('/leaderboard/' + (XA.GAME_SLUGS[game] || game) + '?limit=25&period=' + (period || 'siempre'))
      .catch(function () { return { entries: [], me: null, offline: true }; });
  };
})(window.XA);
