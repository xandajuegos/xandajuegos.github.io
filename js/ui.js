/* ==========================================================
   XandA Juegos · UI compartida (nav, footer, modal, toasts…)
   ========================================================== */
(function (XA) {
  var page = document.body.getAttribute('data-page') || '';

  function el(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

  /* ---------- navegación ---------- */
  function navHTML() {
    function a(href, key, label) { return '<a href="' + href + '"' + (page === key ? ' class="on"' : '') + '>' + label + '</a>'; }
    var shopOn = page.indexOf('tienda') === 0;
    return '<header class="nav"><div class="nav-in">' +
      '<a class="brand" href="index.html" aria-label="XandA Juegos"><span class="brand-cube" data-model="logo" data-s="10" data-nosway></span>' +
      '<span class="brand-name">XandA<small>JUEGOS</small></span></a>' +
      '<nav class="links" id="navlinks">' +
      a('index.html', 'home', 'Inicio') + a('casi-perfecto.html', 'casi-perfecto', 'Casi Perfecto') + a('casino-fortuna.html', 'casino-fortuna', 'Casino Fortuna') +
      a('ranking.html', 'ranking', 'Top mundial') +
      '<div class="dd' + (shopOn ? ' on' : '') + '"><button class="dd-btn" type="button" aria-haspopup="true">Tienda <i>▾</i></button>' +
      '<div class="dd-menu">' +
      '<a href="tienda-casi-perfecto.html">Tienda · Casi Perfecto</a><a href="tienda-casino-fortuna.html">Tienda · Casino Fortuna</a></div></div>' +
      '<div class="nav-auth-m" id="navauthm"></div>' +
      '</nav>' +
      '<div class="nav-right" id="navauth"></div>' +
      '<button class="burger" id="burger" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button>' +
      '</div></header>';
  }

  function footHTML() {
    return '<footer class="foot"><div class="skyline" data-color="#1d1445" data-flip></div><div class="foot-in">' +
      '<div class="foot-brand"><div class="brand-cube big" data-model="logo" data-s="16" data-nosway></div>' +
      '<div><strong>XandA Juegos</strong><p>Juegos de bloques hechos con cariño, un cubo a la vez.</p></div></div>' +
      '<div class="foot-cols">' +
      '<div><h4>Juegos</h4><a href="casi-perfecto.html">Casi Perfecto</a><a href="casino-fortuna.html">Casino Fortuna</a></div>' +
      '<div><h4>Comunidad</h4><a href="ranking.html">Top mundial</a><a href="login.html">Crear cuenta</a></div>' +
      '<div><h4>Tiendas</h4><a href="tienda-casi-perfecto.html">Casi Perfecto</a><a href="tienda-casino-fortuna.html">Casino Fortuna</a></div>' +
      '</div></div><div class="foot-bottom">© ' + new Date().getFullYear() + ' XandA Juegos · Hecho con bloques</div></footer>';
  }

  function renderAuth() {
    var u = XA.auth.current();
    var box = document.getElementById('navauth'), m = document.getElementById('navauthm');
    if (!box) return;
    box.innerHTML = ''; m.innerHTML = '';
    if (!u) {
      box.innerHTML = '<a class="btn btn-white btn-sm" href="login.html">Iniciar sesión</a><a class="btn btn-pink btn-sm" href="login.html?tab=registro">Crear cuenta</a>';
      m.innerHTML = '<a class="btn btn-white" href="login.html">Iniciar sesión</a><a class="btn btn-pink" href="login.html?tab=registro">Crear cuenta</a>';
      return;
    }
    var chip = el('<div class="user-chip dd"><button class="dd-btn" type="button"><span class="uc-av"></span><span class="uc-name"></span><i>▾</i></button>' +
      '<div class="dd-menu right"><a href="perfil.html">Mi perfil</a><a href="#" data-logout>Cerrar sesión</a></div></div>');
    chip.querySelector('.uc-av').appendChild(XA.avatar(u.avatar, 34));
    chip.querySelector('.uc-name').textContent = u.playerName;
    box.appendChild(chip);
    m.innerHTML = '<a class="btn btn-white" href="perfil.html">Mi perfil · ' + u.playerName.replace(/</g, '') + '</a><a class="btn btn-ghost" href="#" data-logout>Cerrar sesión</a>';
    document.querySelectorAll('[data-logout]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); XA.auth.logout(); XA.toast('Sesión cerrada. ¡Vuelve pronto!'); setTimeout(function () { location.href = 'index.html'; }, 600); });
    });
  }
  XA.renderAuth = renderAuth;

  /* ---------- toasts ---------- */
  XA.toast = function (msg, kind) {
    var wrap = document.getElementById('toasts');
    if (!wrap) { wrap = el('<div id="toasts" class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(wrap); }
    var t = el('<div class="toast ' + (kind || '') + '"></div>');
    t.textContent = msg;
    wrap.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, 3200);
  };

  /* ---------- modal ---------- */
  XA.modal = function (contentNode, opts) {
    opts = opts || {};
    var ov = el('<div class="modal-ov"><div class="modal" role="dialog" aria-modal="true"><button class="modal-x" type="button" aria-label="Cerrar">×</button><div class="modal-body"></div></div></div>');
    ov.querySelector('.modal-body').appendChild(contentNode);
    function close() { ov.classList.remove('in'); setTimeout(function () { ov.remove(); document.body.classList.remove('noscroll'); }, 250); }
    ov.querySelector('.modal-x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.appendChild(ov);
    document.body.classList.add('noscroll');
    requestAnimationFrame(function () { ov.classList.add('in'); });
    return { close: close, root: ov };
  };

  /* ---------- horizonte de pixeles ---------- */
  XA.skylines = function (root) {
    (root || document).querySelectorAll('.skyline:not([data-done])').forEach(function (sk) {
      var color = sk.getAttribute('data-color') || '#fff';
      var n = 28, seed = (sk.getAttribute('data-seed') | 0) || 7, html = '';
      for (var i = 0; i < n; i++) {
        seed = (seed * 9301 + 49297) % 233280;
        var h = 1 + Math.floor((seed / 233280) * 3.2);
        html += '<i style="height:' + (h * 14) + 'px"></i>';
      }
      sk.innerHTML = html;
      sk.style.setProperty('--c', color);
      sk.setAttribute('data-done', '1');
    });
  };

  /* ---------- cubos flotantes de fondo ---------- */
  function bgCubes() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var wrap = el('<div class="bg-cubes" aria-hidden="true"></div>');
    var cols = ['#ffffff', '#ffd54a', '#ff5a8a', '#ffffff', '#7c5cff', '#ffffff'];
    var seed = 5;
    function r() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
    for (var i = 0; i < 12; i++) {
      var s = 5 + r() * 7;
      var st = XA.stage([{ x: 0, y: 0, z: 0, w: 1, h: 1, d: 1, c: cols[i % cols.length] }], { s: s * 3, cy: 50, sway: false, all: false });
      st.className = 'xs bgc';
      st.style.left = (r() * 96) + '%';
      st.style.top = (r() * 100) + '%';
      st.style.animationDuration = (9 + r() * 10) + 's';
      st.style.animationDelay = (-r() * 10) + 's';
      st.style.opacity = (0.35 + r() * 0.4).toFixed(2);
      wrap.appendChild(st);
    }
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  /* ---------- inclinación con el ratón ---------- */
  function tilt() {
    var targets = document.querySelectorAll('[data-tilt]');
    if (!targets.length || matchMedia('(pointer: coarse)').matches) return;
    window.addEventListener('mousemove', function (e) {
      var mx = e.clientX / innerWidth - 0.5, my = e.clientY / innerHeight - 0.5;
      targets.forEach(function (t) {
        var r = t.querySelector('.xr');
        if (!r) return;
        r.style.setProperty('--ry', (-45 + mx * 22) + 'deg');
        r.style.setProperty('--rx', (-30 + my * -8) + 'deg');
      });
    });
  }

  /* ---------- aparición al hacer scroll ---------- */
  function reveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) { items.forEach(function (i) { i.classList.add('shown'); }); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    items.forEach(function (i) { io.observe(i); });
  }
  XA.reveal = reveal;

  /* ---------- arranque ---------- */
  var started = false;
  var NEEDS_AUTH = { login: 1, perfil: 1, 'tienda-casi-perfecto': 1, 'tienda-casino-fortuna': 1 };

  function init() {
    if (started) return;
    started = true;
    var navMount = document.getElementById('app-nav'), footMount = document.getElementById('app-footer');
    if (navMount) navMount.replaceWith(el(navHTML()));
    if (footMount) footMount.replaceWith(el(footHTML()));

    var burger = document.getElementById('burger'), links = document.getElementById('navlinks');
    if (burger) burger.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      burger.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', open);
    });
    // Los desplegables se crean al pintar la sesión: se delega el clic.
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.dd-btn');
      document.querySelectorAll('.dd.open').forEach(function (d) { if (!b || d !== b.parentNode) d.classList.remove('open'); });
      if (b) { e.stopPropagation(); b.parentNode.classList.toggle('open'); }
    });
    document.querySelectorAll('[data-play]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); XA.toast('Aquí irá el enlace directo al juego.'); });
    });

    var page = document.body.dataset.page || '';
    function runPage() {
      if (XA.pages && XA.pages[page]) XA.pages[page]();
      XA.mountAll(); XA.skylines(); reveal();
    }

    // Pinta la sesión guardada al instante (la API gratuita puede tardar en despertar).
    var cached = null;
    try { cached = JSON.parse(localStorage.getItem('xanda_auth_user') || 'null'); } catch (e) {}
    if (cached && localStorage.getItem('xanda_auth_token')) { XA.auth._preview(cached); renderAuth(); }

    bgCubes(); XA.mountAll(); XA.skylines(); tilt();

    var ready = XA.auth.init().then(function () { renderAuth(); }).catch(function () { renderAuth(); });
    if (NEEDS_AUTH[page]) {
      var root = document.getElementById('profile');
      if (root && page === 'perfil') root.innerHTML = '<p class="note center">Conectando con tu cuenta… (si el servidor estaba dormido puede tardar unos segundos)</p>';
      ready.then(runPage);
    } else runPage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.XA);
