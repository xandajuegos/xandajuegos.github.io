/* ==========================================================
   XandA Juegos · Lógica visual de cada página
   (sin backend: ver /database para el esquema real)
   ========================================================== */
(function (XA) {
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function mk(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function model(name, opts, s, cls, extra) {
    return '<div class="stage ' + (cls || '') + '" data-model="' + name + '" data-s="' + s + '" data-opts=\'' + JSON.stringify(opts || {}) + '\' ' + (extra || '') + '></div>';
  }

  /* ---------- podio y tabla (compartidos) ---------- */
  var KINDS = { 1: { color: '#ffd54a', h: 3 }, 2: { color: '#d8deee', h: 2.2 }, 3: { color: '#ffab7a', h: 1.6 } };
  XA.renderPodium = function (box, list, game) {
    box.innerHTML = '';
    [2, 1, 3].forEach(function (place) {
      var p = list[place - 1], k = KINDS[place];
      var d = mk('<div class="pod">' + model('pillar', { h: k.h, color: k.color, kind: p.avatar }, 30, '', 'data-nosway') +
        '<div class="pod-info"><div class="pod-medal m' + place + '">' + place + '</div><div class="pod-name">' + esc(p.name) + '</div>' +
        '<div class="pod-score">' + XA.scoreText(game, p.score) + '</div></div></div>');
      box.appendChild(d);
    });
  };
  XA.renderBoard = function (box, list, game, from) {
    var g = XA.games[game];
    var html = '<div class="board-head"><span>#</span><span>JUGADOR</span><span class="cc-h">PAÍS</span><span class="sc">' + g.scoreLabel.toUpperCase() + '</span></div>';
    list.slice(from || 0).forEach(function (p) {
      html += '<div class="row' + (p.rank <= 3 ? ' top r' + p.rank : '') + '"><span class="rk">' + p.rank + '</span>' +
        '<span class="who" data-av="' + p.avatar + '"><span>' + esc(p.name) + '</span></span><span class="cc">' + p.country + '</span>' +
        '<span class="sc">' + XA.scoreText(game, p.score) + '</span></div>';
    });
    box.innerHTML = html;
    $$('.who', box).forEach(function (w) { w.insertBefore(XA.avatar(w.getAttribute('data-av'), 40), w.firstChild); });
  };

  function avatarPicker(name, selected) {
    var wrap = mk('<div class="av-pick" role="radiogroup" aria-label="Foto de perfil"></div>');
    XA.avatars.forEach(function (a) {
      var l = mk('<label><input type="radio" name="' + name + '" value="' + a.id + '"' + (a.id === selected ? ' checked' : '') + '></label>');
      l.appendChild(XA.avatar(a.id, 80));
      l.appendChild(mk('<span>' + a.name + '</span>'));
      wrap.appendChild(l);
    });
    return wrap;
  }

  function gameOf(page) { return page.replace('tienda-', ''); }

  XA.pages = {
    /* ================= INICIO ================= */
    home: function () {
      var box = $('#home-top');
      if (!box) return;
      var state = 'casi-perfecto';
      function draw() {
        var list = XA.leaderboard(state, 'siempre');
        XA.renderPodium($('#home-podium'), list, state);
        XA.mountAll($('#home-podium'));
        $$('#home-tabs .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === state); });
        $('#home-board-link').textContent = 'Ver top completo de ' + XA.games[state].name;
        $('#home-board-link').href = 'ranking.html?juego=' + state;
      }
      $$('#home-tabs .tab').forEach(function (t) { t.addEventListener('click', function () { state = t.getAttribute('data-g'); draw(); }); });
      draw();
      var av = $('#cta-avatars');
      if (av) XA.avatars.forEach(function (a) { av.appendChild(XA.avatar(a.id, 72)); });
    },

    /* ================= CASI PERFECTO ================= */
    'casi-perfecto': function () {
      var m = $('#maps-grid');
      XA.maps.forEach(function (mp) {
        m.appendChild(mk('<article class="card hover reveal"><div class="tile-bg" style="background:' + mp.bg + '">' + model('map', { kind: mp.id }, 24, 'stage-md') + '</div>' +
          '<h3>' + mp.name + '</h3><p>' + mp.desc + '</p><div style="margin-top:14px">' +
          (mp.cost ? '<span class="chip"><span class="coin"></span> ' + XA.num(mp.cost) + '</span>' : '<span class="chip free">Incluido</span>') + '</div></article>'));
      });
    },

    /* ================= CASINO FORTUNA ================= */
    'casino-fortuna': function () {
      var s = $('#skins-grid'), c = $('#chars-grid'), g = $('#casino-games');
      XA.skins.forEach(function (k) {
        s.appendChild(mk('<article class="card hover reveal"><div class="tile-bg" style="background:' + k.bg + '">' + model('table', { felt: k.felt, rim: k.rim, chip: k.chip }, 25, 'stage-md') + '</div>' +
          '<h3>' + k.name + '</h3><p>' + k.desc + '</p><div style="margin-top:14px">' +
          (k.cost ? '<span class="chip"><span class="coin"></span> ' + XA.num(k.cost) + '</span>' : '<span class="chip free">Incluida</span>') + '</div></article>'));
      });
      XA.characters.forEach(function (k) {
        c.appendChild(mk('<article class="card hover reveal"><div class="tile-bg" style="background:' + k.bg + '">' + model('character', { id: k.id }, 32, 'stage-md', 'data-nosway') + '</div>' +
          '<h3>' + k.name + '</h3><p><strong>' + k.role + '.</strong> ' + k.desc + '</p><div style="margin-top:14px">' +
          (k.cost ? '<span class="chip"><span class="coin"></span> ' + XA.num(k.cost) + '</span>' : '<span class="chip free">Incluido</span>') + '</div></article>'));
      });
      XA.casinoGames.forEach(function (k, i) {
        g.appendChild(mk('<article class="card reveal"><div class="num">' + (i + 1) + '</div><h3>' + k.name + '</h3><p>' + k.desc + '</p></article>'));
      });
    },

    /* ================= RANKING ================= */
    ranking: function () {
      var q = new URLSearchParams(location.search);
      var state = { game: XA.games[q.get('juego')] ? q.get('juego') : 'casi-perfecto', period: 'siempre' };
      function draw() {
        var list = XA.leaderboard(state.game, state.period), g = XA.games[state.game];
        $$('#rk-games .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === state.game); });
        $$('#rk-periods .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-p') === state.period); });
        XA.renderPodium($('#rk-podium'), list, state.game);
        XA.renderBoard($('#rk-board'), list, state.game, 3);
        XA.mountAll($('#rk-podium'));
        $('#rk-title').textContent = 'Top mundial · ' + g.name;
        var u = XA.auth.current(), me = $('#rk-me');
        if (u) {
          me.innerHTML = '<div class="who" id="rk-me-av"></div><div class="grow"><strong>TU POSICIÓN</strong><div>Aún no tienes puntuación en ' + g.name + '. ¡Juega para entrar al top!</div></div><a class="btn btn-pink btn-sm" href="' + g.page + '">Ir al juego</a>';
          $('#rk-me-av').appendChild(XA.avatar(u.avatar, 44));
        } else {
          me.innerHTML = '<div class="grow"><strong>¿Y TÚ?</strong><div>Crea tu cuenta y mira en qué lugar quedas.</div></div><a class="btn btn-pink btn-sm" href="login.html?tab=registro">Crear cuenta</a>';
        }
      }
      $$('#rk-games .tab').forEach(function (t) { t.addEventListener('click', function () { state.game = t.getAttribute('data-g'); history.replaceState(null, '', '?juego=' + state.game); draw(); }); });
      $$('#rk-periods .tab').forEach(function (t) { t.addEventListener('click', function () { state.period = t.getAttribute('data-p'); draw(); }); });
      draw();
    },

    /* ================= TIENDAS ================= */
    'tienda-casi-perfecto': function () { shop('casi-perfecto'); },
    'tienda-casino-fortuna': function () { shop('casino-fortuna'); },

    /* ================= LOGIN / REGISTRO ================= */
    login: function () {
      if (XA.auth.current()) { location.replace('perfil.html'); return; }
      var tabs = $$('#auth-tabs .tab'), forms = { login: $('#form-login'), registro: $('#form-registro') };
      function show(k) {
        tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-t') === k); });
        Object.keys(forms).forEach(function (f) { forms[f].style.display = f === k ? '' : 'none'; });
        $('#auth-title').textContent = k === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta';
        $('#auth-sub').textContent = k === 'login' ? 'Entra con tu cuenta XandA para ver tu perfil y tus monedas.' : 'Una sola cuenta para todos los juegos de XandA.';
      }
      tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-t')); }); });
      show(new URLSearchParams(location.search).get('tab') === 'registro' ? 'registro' : 'login');
      $('#reg-avatar').appendChild(avatarPicker('avatar', 'zorro'));
      $$('[data-toggle-pass]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = b.previousElementSibling; var show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.textContent = show ? 'Ocultar' : 'Ver';
        });
      });
      function fail(form, msg, input) {
        var e = $('.form-err', form); e.textContent = msg; e.style.display = 'block';
        $$('.input', form).forEach(function (i) { i.classList.remove('bad'); });
        if (input) { input.classList.add('bad'); input.focus(); }
      }
      var next = new URLSearchParams(location.search).get('next');
      function done() { XA.toast('¡Listo! Entrando…', 'ok'); setTimeout(function () { location.href = next && /^[a-z\-]+\.html$/.test(next) ? next : 'perfil.html'; }, 700); }

      forms.login.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = forms.login, em = f.email.value.trim(), pw = f.password.value;
        if (!/^\S+@\S+\.\S+$/.test(em)) return fail(f, 'Escribe un correo válido.', f.email);
        if (!pw) return fail(f, 'Escribe tu contraseña.', f.password);
        var r = XA.auth.login(em, pw);
        if (r.error) return fail(f, r.error);
        done();
      });
      forms.registro.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = forms.registro, nm = f.playerName.value.trim(), em = f.email.value.trim(), pw = f.password.value;
        if (nm.length < 3 || nm.length > 16) return fail(f, 'El nombre de jugador debe tener entre 3 y 16 caracteres.', f.playerName);
        if (!/^[\wÀ-ÿ.\- ]+$/.test(nm)) return fail(f, 'Usa solo letras, números, punto, guion o guion bajo.', f.playerName);
        if (!/^\S+@\S+\.\S+$/.test(em)) return fail(f, 'Escribe un correo válido.', f.email);
        if (pw.length < 8) return fail(f, 'La contraseña debe tener al menos 8 caracteres.', f.password);
        if (pw !== f.confirm.value) return fail(f, 'Las contraseñas no coinciden.', f.confirm);
        if (!f.terms.checked) return fail(f, 'Debes aceptar los términos para continuar.');
        var av = (f.querySelector('input[name=avatar]:checked') || {}).value || 'zorro';
        var r = XA.auth.register({ playerName: nm, email: em, password: pw, avatar: av });
        if (r.error) return fail(f, r.error, f.email);
        done();
      });
    },

    /* ================= PERFIL ================= */
    perfil: function () {
      var u = XA.auth.current(), root = $('#profile');
      if (!u) {
        root.innerHTML = '<div class="card center" style="max-width:560px;margin:0 auto;padding:44px 30px"><h1 style="font-size:1.2rem;margin-bottom:14px">Aún no has entrado</h1><p>Inicia sesión para ver tu perfil, tus monedas y tus colecciones.</p><div class="cta-row" style="justify-content:center;margin-top:22px"><a class="btn btn-pink" href="login.html?next=perfil.html">Iniciar sesión</a><a class="btn btn-white" href="login.html?tab=registro">Crear cuenta</a></div></div>';
        return;
      }
      var cp = u.profiles['casi-perfecto'], cf = u.profiles['casino-fortuna'];
      root.innerHTML =
        '<div class="card prof-head" id="p-head"><div id="p-av"></div><div style="flex:1;min-width:220px"><h1></h1><p class="note" id="p-mail"></p><p class="note">Miembro desde ' + new Date(u.createdAt).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) + '</p></div>' +
        '<div class="cta-row"><button class="btn btn-purple btn-sm" id="p-edit" type="button">Editar perfil</button><button class="btn btn-ghost btn-sm" style="color:var(--ink);background:var(--lilac)" id="p-out" type="button">Cerrar sesión</button></div></div>' +
        '<div class="tabs mt" id="p-tabs"><button class="tab on" data-g="casi-perfecto" type="button">Casi Perfecto</button><button class="tab" data-g="casino-fortuna" type="button">Casino Fortuna</button></div>' +
        '<div class="card" id="p-game"></div>';
      $('#p-head h1').textContent = u.playerName;
      $('#p-mail').textContent = u.email;
      $('#p-av').appendChild(XA.avatar(u.avatar, 112));
      $('#p-out').addEventListener('click', function () { XA.auth.logout(); location.href = 'index.html'; });

      function inv(items, owned, modelName, optsFn, s) {
        return '<div class="inv">' + items.map(function (i) {
          var has = owned.indexOf(i.id) > -1;
          return '<div class="inv-item' + (has ? '' : ' locked') + '">' + model(modelName, optsFn(i), s, '', 'data-nosway') + esc(i.name) + '<div class="note">' + (has ? 'Desbloqueado' : 'Bloqueado') + '</div></div>';
        }).join('') + '</div>';
      }
      function drawGame(g) {
        var p = u.profiles[g], box = $('#p-game');
        var stats = '<div class="stat-grid"><div class="stat"><b><span class="coin"></span> ' + XA.num(p.coins) + '</b>Monedas</div>' +
          '<div class="stat"><b>' + (g === 'casi-perfecto' ? XA.num(p.best) + ' pisos' : XA.num(p.best)) + '</b>' + (g === 'casi-perfecto' ? 'Mejor torre' : 'Mayor fortuna') + '</div>' +
          '<div class="stat"><b>' + (p.rank ? '#' + p.rank : '—') + '</b>Posición mundial</div></div>';
        var body = g === 'casi-perfecto'
          ? '<h3 style="font-size:.9rem;margin-bottom:14px">Mis mapas</h3>' + inv(XA.maps, p.maps, 'map', function (i) { return { kind: i.id }; }, 11)
          : '<h3 style="font-size:.9rem;margin-bottom:14px">Mis skins</h3>' + inv(XA.skins, p.skins, 'table', function (i) { return { felt: i.felt, rim: i.rim, chip: i.chip }; }, 12) +
            '<h3 style="font-size:.9rem;margin:26px 0 14px">Mis personajes</h3>' + inv(XA.characters, p.characters, 'character', function (i) { return { id: i.id }; }, 16);
        box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><h2 class="h2" style="margin:0;font-size:1.05rem">' + XA.games[g].name + '</h2>' +
          '<a class="btn btn-pink btn-sm" href="' + XA.games[g].shop + '">Comprar monedas</a></div>' + stats + body;
        XA.mountAll(box);
        $$('#p-tabs .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === g); });
      }
      $$('#p-tabs .tab').forEach(function (t) { t.addEventListener('click', function () { drawGame(t.getAttribute('data-g')); }); });
      drawGame('casi-perfecto');

      $('#p-edit').addEventListener('click', function () {
        var f = mk('<form novalidate><h3>Editar perfil</h3><div class="field"><label for="e-name">Nombre de jugador</label><input class="input" id="e-name" maxlength="16" value="' + esc(u.playerName) + '"><div class="err" id="e-err"></div></div>' +
          '<div class="field"><label>Foto de perfil</label><div id="e-av"></div></div><button class="btn btn-pink btn-block" type="submit">Guardar cambios</button></form>');
        $('#e-av', f).appendChild(avatarPicker('eav', u.avatar));
        var m = XA.modal(f);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var nm = $('#e-name', f).value.trim();
          if (nm.length < 3 || nm.length > 16) { $('#e-err', f).textContent = 'Entre 3 y 16 caracteres.'; return; }
          var av = $('input[name=eav]:checked', f).value;
          XA.auth.update({ playerName: nm, avatar: av });
          XA.toast('Perfil actualizado', 'ok');
          setTimeout(function () { location.reload(); }, 500);
        });
        $('#e-name', f).focus();
      });
    }
  };

  /* ---------- tienda ---------- */
  function shop(gid) {
    var g = XA.games[gid], u = XA.auth.current(), box = $('#packs');
    var bal = $('#balance');
    bal.innerHTML = u ? 'Tus monedas: <b><span class="coin"></span> ' + XA.num(u.profiles[gid].coins) + '</b>' : 'Inicia sesión para ver tu saldo';
    XA.packs[gid].forEach(function (p, i) {
      var total = p.coins + p.bonus;
      var card = mk('<article class="card pack hover reveal' + (p.popular ? ' popular' : '') + '" style="transition-delay:' + (i * 0.07) + 's">' +
        (p.popular ? '<div class="ribbon">MÁS POPULAR</div>' : '') +
        model('pile', { tier: p.tier, color: gid === 'casi-perfecto' ? '#ffd54a' : '#ffd54a' }, 20 + p.tier * 2.5, 'stage-xs', 'data-nosway') +
        '<h3>' + p.name + '</h3><div class="amount"><span class="coin"></span> ' + XA.num(p.coins) + '</div>' +
        '<div class="bonus' + (p.bonus ? '' : ' none') + '">+' + XA.num(p.bonus) + ' de regalo</div>' +
        '<button class="btn btn-pink btn-block" type="button">' + XA.money(p.price) + '</button></article>');
      $('button', card).addEventListener('click', function () { checkout(g, p, total); });
      box.appendChild(card);
    });
  }
  function checkout(g, p, total) {
    var u = XA.auth.current();
    var f = mk('<div><h3>Confirmar compra</h3>' +
      '<div class="sum"><div><strong>' + p.name + '</strong><div class="note">' + g.name + '</div></div><div style="text-align:right"><div><span class="coin"></span> <strong>' + XA.num(total) + '</strong></div><div class="note">' + XA.money(p.price) + ' ' + XA.CURRENCY + '</div></div></div>' +
      (u ? '<p class="note">Las monedas se abonarán al perfil de <strong>' + esc(u.playerName) + '</strong> en ' + g.name + '.</p>'
        : '<p class="form-err" style="display:block">Necesitas iniciar sesión para comprar. Así sabemos a qué perfil abonar las monedas.</p>') +
      '<label class="pay-opt"><input type="radio" name="pay" value="card" checked> Tarjeta de crédito o débito</label>' +
      '<label class="pay-opt"><input type="radio" name="pay" value="paypal"> PayPal</label>' +
      '<label class="pay-opt"><input type="radio" name="pay" value="store"> Pago en tiendas de conveniencia</label>' +
      (u ? '<button class="btn btn-pink btn-block btn-lg" type="button" id="pay-go" style="margin-top:14px">Pagar ' + XA.money(p.price) + '</button>'
        : '<a class="btn btn-pink btn-block btn-lg" style="margin-top:14px" href="login.html?next=' + g.shop + '">Iniciar sesión</a>') +
      '<p class="note center" style="margin:14px 0 0">Maqueta visual: no se realiza ningún cargo real.</p></div>');
    var m = XA.modal(f);
    var go = $('#pay-go', f);
    if (go) go.addEventListener('click', function () {
      go.disabled = true; go.textContent = 'Procesando…';
      setTimeout(function () { m.close(); XA.toast('Esto es una maqueta: aquí se conectará el pago real.', 'ok'); }, 900);
    });
  }
})(window.XA);
