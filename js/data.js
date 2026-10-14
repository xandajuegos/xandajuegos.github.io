/* ==========================================================
   XandA Juegos · Datos de ejemplo (visuales, sin backend)
   Todo lo marcado como EJEMPLO se reemplazará por la API
   cuando se conecte la base de datos (ver /database).
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

  /* ---------- ranking de ejemplo (determinista) ---------- */
  var NAMES = ['PixelZorro', 'LaTorreDeMau', 'Xime_Plays', 'CubitoFeliz', 'DonAtino', 'Fer.Block', 'SuperMeli', 'TorreroPro', 'Chispas', 'LuckyLeo',
    'CapiBlock', 'ValeVegas', 'RuletaRick', 'DadoLoco', 'MiaMonedas', 'BlockyBoy', 'TetoTorre', 'Lola88', 'El_Profe', 'Nacho_Rey',
    'Sofi.Games', 'Rayito', 'Chuy_77', 'KikeKubo', 'Dani_X', 'Pau.Pau', 'ElMasterDeBloques', 'Marti_Fortuna', 'Tona', 'GatoGamer'];
  var COUNTRIES = ['MX', 'MX', 'AR', 'CO', 'ES', 'CL', 'PE', 'MX', 'US', 'BR', 'UY', 'EC', 'MX', 'VE', 'CR'];
  function rng(seed) { var s = seed; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  XA.leaderboard = function (game, period) {
    var seed = (game === 'casi-perfecto' ? 11 : 97) + (period === 'hoy' ? 1 : period === 'semana' ? 2 : 3) * 31;
    var r = rng(seed), list = [], used = {};
    var base = game === 'casi-perfecto' ? { hoy: 61, semana: 148, siempre: 412 }[period] : { hoy: 2.4e6, semana: 18e6, siempre: 96e6 }[period];
    for (var i = 0; i < 25; i++) {
      var n;
      do { n = Math.floor(r() * NAMES.length); } while (used[n]);
      used[n] = 1;
      var v = game === 'casi-perfecto' ? Math.round(base * Math.pow(0.955, i) - r() * 2) : Math.round(base * Math.pow(0.93, i) * (0.97 + r() * .05));
      list.push({ rank: i + 1, name: NAMES[n], avatar: XA.avatars[Math.floor(r() * XA.avatars.length)].id, country: COUNTRIES[Math.floor(r() * COUNTRIES.length)], score: v });
    }
    return list;
  };
  XA.scoreText = function (game, v) {
    if (game === 'casi-perfecto') return XA.num(v);
    if (v >= 1e6) return (v / 1e6).toFixed(1).replace('.0', '') + ' M';
    if (v >= 1e3) return Math.round(v / 1e3) + ' k';
    return String(v);
  };

  /* ==========================================================
     SESIÓN DE DEMOSTRACIÓN (localStorage)
     SOLO PARA MAQUETA: se sustituirá por el inicio de sesión
     real de la cuenta de xandajuegos (tabla `users`).
     ========================================================== */
  var UK = 'xanda_users_demo', SK = 'xanda_session_demo';
  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); }

  XA.auth = {
    current: function () {
      var id = load(SK, null);
      if (!id) return null;
      return load(UK, []).filter(function (u) { return u.id === id; })[0] || null;
    },
    register: function (d) {
      var users = load(UK, []);
      if (users.some(function (u) { return u.email.toLowerCase() === d.email.toLowerCase(); })) return { error: 'Ese correo ya tiene una cuenta.' };
      var u = {
        id: 'u_' + Date.now().toString(36), email: d.email, pass: hash(d.password), playerName: d.playerName, avatar: d.avatar,
        createdAt: new Date().toISOString(),
        profiles: {
          'casi-perfecto': { coins: 60, best: 0, rank: null, maps: ['ciudad'] },
          'casino-fortuna': { coins: 1000, best: 0, rank: null, skins: ['clasico'], characters: ['lucky'] }
        }
      };
      users.push(u); save(UK, users); save(SK, u.id);
      return { user: u };
    },
    login: function (email, password) {
      var u = load(UK, []).filter(function (x) { return x.email.toLowerCase() === email.toLowerCase() && x.pass === hash(password); })[0];
      if (!u) return { error: 'Correo o contraseña incorrectos.' };
      save(SK, u.id);
      return { user: u };
    },
    logout: function () { try { localStorage.removeItem(SK); } catch (e) {} },
    update: function (patch) {
      var users = load(UK, []), id = load(SK, null);
      users = users.map(function (u) { return u.id === id ? Object.assign(u, patch) : u; });
      save(UK, users);
    }
  };
})(window.XA);
