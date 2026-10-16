/* ==========================================================
   XandA Juegos · Lógica visual de cada página
   (cuentas, perfil y ranking reales vía API; tiendas aún de maqueta)

   pages.js corregido
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
      var p = list[place - 1] || { name: '—', avatar: 'zorro', score: null, empty: true }, k = KINDS[place];
      var d = mk('<div class="pod">' + model('pillar', { h: k.h, color: k.color, kind: p.avatar }, 30, '', 'data-nosway') +
        '<div class="pod-info"><div class="pod-medal m' + place + '">' + place + '</div><div class="pod-name">' + esc(p.name) + '</div>' +
        '<div class="pod-score">' + (p.empty ? 'Libre' : XA.scoreText(game, p.score)) + '</div></div></div>');
      box.appendChild(d);
    });
  };
  XA.renderBoard = function (box, list, game, from) {
    var g = XA.games[game];
    var html = '<div class="board-head"><span>#</span><span>JUGADOR</span><span class="cc-h">PAÍS</span><span class="sc">' + g.scoreLabel.toUpperCase() + '</span></div>';
    if (!list.slice(from || 0).length && !from) html += '<div class="row"><span class="who"><span>Aún no hay puntuaciones. ¡Sé el primero!</span></span></div>';
    list.slice(from || 0).forEach(function (p) {
      html += '<div class="row' + (p.rank <= 3 ? ' top r' + p.rank : '') + '"><span class="rk">' + p.rank + '</span>' +
        '<span class="who" data-av="' + p.avatar + '"><span>' + esc(p.name) + '</span></span><span class="cc">' + (p.country || '') + '</span>' +
        '<span class="sc">' + XA.scoreText(game, p.score) + '</span></div>';
    });
    box.innerHTML = html;
    $$('.who', box).forEach(function (w) { w.insertBefore(XA.avatar(w.getAttribute('data-av'), 40), w.firstChild); });
  };

  /* Selector de foto de perfil (registro y editar perfil) */
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

  /* Cumpleaños: selector de mes y día */
  var MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MDAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  function birthdayText(b) { return b ? b.day + ' de ' + MONTHS[b.month - 1] : ''; }

  function gameOf(page) { return page.replace('tienda-', ''); }

  XA.pages = {
    /* ================= INICIO ================= */
    home: function () {
      var box = $('#home-top');
      if (!box) return;
      var state = 'casi-perfecto', seq = 0;
      function draw() {
        var my = ++seq;
        $$('#home-tabs .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === state); });
        $('#home-board-link').textContent = 'Ver top completo de ' + XA.games[state].name;
        $('#home-board-link').href = 'ranking.html?juego=' + state;
        XA.leaderboard(state, 'siempre').then(function (r) {
          if (my !== seq) return;
          XA.renderPodium($('#home-podium'), r.entries, state);
          XA.mountAll($('#home-podium'));
        });
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
      var state = { game: XA.games[q.get('juego')] ? q.get('juego') : 'casi-perfecto', period: 'siempre' }, seq = 0;
      function draw() {
        var my = ++seq, g = XA.games[state.game];
        $$('#rk-games .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === state.game); });
        $$('#rk-periods .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-p') === state.period); });
        $('#rk-title').textContent = 'Top mundial · ' + g.name;
        $('#rk-board').innerHTML = '<p class="note center" style="padding:20px">Cargando ranking…</p>';
        XA.leaderboard(state.game, state.period).then(function (r) {
          if (my !== seq) return;
          XA.renderPodium($('#rk-podium'), r.entries, state.game);
          XA.renderBoard($('#rk-board'), r.entries, state.game, 3);
          XA.mountAll($('#rk-podium'));
          if (r.offline) $('#rk-board').insertAdjacentHTML('afterbegin', '<p class="note center" style="padding:10px">No se pudo conectar con el servidor.</p>');
          drawMe(r.me, g);
        });
      }
      function drawMe(mine, g) {
        var u = XA.auth.current(), me = $('#rk-me');
        if (u) {
          var txt = mine
            ? 'Vas en el lugar <b>#' + mine.position + '</b> con ' + XA.scoreText(state.game, mine.score) + '.'
            : 'Aún no tienes puntuación en ' + g.name + '. ¡Juega para entrar al top!';
          me.innerHTML = '<div class="who" id="rk-me-av"></div><div class="grow"><strong>TU POSICIÓN</strong><div>' + txt + '</div></div><a class="btn btn-pink btn-sm" href="' + g.page + '">Ir al juego</a>';
          $('#rk-me-av').appendChild(XA.avatar(u.avatar, 44));
        } else {
          me.innerHTML = '<div class="grow"><strong>¿Y TÚ?</strong><div>Crea tu cuenta y mira en qué lugar quedas.</div></div><a class="btn btn-pink btn-sm" href="login.html?tab=registro">Crear cuenta</a>';
        }
      }
      $$('#rk-games .tab').forEach(function (t) { t.addEventListener('click', function () { state.game = t.getAttribute('data-g'); history.replaceState(null, '', '?juego=' + state.game); draw(); }); });
      $$('#rk-periods .tab').forEach(function (t) { t.addEventListener('click', function () { state.period = t.getAttribute('data-p'); draw(); }); });
      // La posición propia necesita la sesión; el ranking no espera por ella.
      XA.auth.init().then(function () { XA.renderAuth && XA.renderAuth(); draw(); });
      draw();
    },

    /* ================= TIENDAS ================= */
    'tienda-casi-perfecto': function () { shop('casi-perfecto'); },
    'tienda-casino-fortuna': function () { shop('casino-fortuna'); },

    /* ================= LOGIN / REGISTRO ================= */
    login: function () {
      var tabs = $$('#auth-tabs .tab');
      var forms = { login: $('#form-login'), registro: $('#form-registro') };
      if (!forms.login || !forms.registro) return;
      if (XA.auth.current()) { location.replace('perfil.html'); return; }

      function show(k) {
        tabs.forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-t') === k); });
        Object.keys(forms).forEach(function (f) { forms[f].style.display = f === k ? '' : 'none'; });
        $('#auth-title').textContent = k === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta';
        $('#auth-sub').textContent = k === 'login'
          ? 'Entra con tu cuenta XandA para ver tu perfil y tus monedas.'
          : 'Una sola cuenta para todos los juegos de XandA.';
      }
      function fail(form, msg, input) {
        var e = $('.form-err', form); e.textContent = msg; e.style.display = 'block';
        $$('.input', form).forEach(function (i) { i.classList.remove('bad'); });
        if (input) { input.classList.add('bad'); input.focus(); }
      }
      function clear(form) {
        var e = $('.form-err', form); e.textContent = ''; e.style.display = 'none';
        $$('.input', form).forEach(function (i) { i.classList.remove('bad'); });
      }
      function busy(form, on) {
        var b = $('button[type="submit"]', form);
        if (on) { b.dataset.t = b.textContent; b.disabled = true; b.textContent = 'Conectando…'; }
        else { b.disabled = false; b.textContent = b.dataset.t || b.textContent; }
      }
      var next = new URLSearchParams(location.search).get('next');
      function done(warning) {
        XA.renderAuth && XA.renderAuth();
        XA.toast('¡Listo! Entrando…', 'ok');
        if (warning) XA.toast(warning);
        setTimeout(function () { location.href = next && /^[a-z\-]+\.html$/.test(next) ? next : 'perfil.html'; }, warning ? 2600 : 700);
      }

      tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.getAttribute('data-t')); }); });
      show(new URLSearchParams(location.search).get('tab') === 'registro' ? 'registro' : 'login');

      // Foto de perfil en el registro
      var regAv = $('#reg-avatar');
      if (regAv) regAv.appendChild(avatarPicker('avatar', 'zorro'));

      $$('[data-toggle-pass]').forEach(function (b) {
        b.addEventListener('click', function () {
          var i = b.previousElementSibling, vis = i.type === 'password';
          i.type = vis ? 'text' : 'password'; b.textContent = vis ? 'Ocultar' : 'Ver';
        });
      });

      forms.login.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = forms.login, em = f.email.value.trim(), pw = f.password.value;
        clear(f);
        if (!/^\S+@\S+\.\S+$/.test(em)) return fail(f, 'Escribe un correo válido.', f.email);
        if (!pw) return fail(f, 'Escribe tu contraseña.', f.password);
        busy(f, true);
        XA.auth.login(em, pw).then(function (r) {
          busy(f, false);
          if (r.error) return fail(f, r.error, f.password);
          done();
        });
      });

      forms.registro.addEventListener('submit', function (e) {
        e.preventDefault();
        var f = forms.registro, nm = f.playerName.value.trim(), em = f.email.value.trim(), pw = f.password.value;
        clear(f);
        if (nm.length < 3 || nm.length > 16) return fail(f, 'El nombre de jugador debe tener entre 3 y 16 caracteres.', f.playerName);
        if (!/^[\wÀ-ÿ.\- ]+$/.test(nm)) return fail(f, 'Usa solo letras, números, punto, guion o guion bajo.', f.playerName);
        if (!/^\S+@\S+\.\S+$/.test(em)) return fail(f, 'Escribe un correo válido.', f.email);
        if (pw.length < 8) return fail(f, 'La contraseña debe tener al menos 8 caracteres.', f.password);
        if (pw !== f.confirm.value) return fail(f, 'Las contraseñas no coinciden.', f.confirm);
        if (!f.terms.checked) return fail(f, 'Debes aceptar los términos para continuar.');
        var av = (f.querySelector('input[name=avatar]:checked') || {}).value || 'zorro';
        busy(f, true);
        XA.auth.register({ playerName: nm, email: em, password: pw, avatar: av }).then(function (r) {
          busy(f, false);
          if (r.error) return fail(f, r.error, f.email);
          done(r.warning);
        });
      });
    },


    /* ================= PERFIL ================= */
    perfil: function () {
      var u = XA.auth.current(), root = $('#profile');
      if (!u) {
        root.innerHTML = '<div class="card center" style="max-width:560px;margin:0 auto;padding:44px 30px"><h1 style="font-size:1.2rem;margin-bottom:14px">Aún no has entrado</h1><p>Inicia sesión para ver tu perfil, tus monedas y tus colecciones.</p><div class="cta-row" style="justify-content:center;margin-top:22px"><a class="btn btn-pink" href="login.html?next=perfil.html">Iniciar sesión</a><a class="btn btn-white" href="login.html?tab=registro">Crear cuenta</a></div></div>';
        return;
      }
      root.innerHTML =
        '<div class="card prof-head" id="p-head"><div id="p-av"></div><div style="flex:1;min-width:220px"><h1></h1><p class="note" id="p-mail"></p></div>' +
        '<div class="cta-row"><button class="btn btn-purple btn-sm" id="p-edit" type="button">Editar perfil</button><button class="btn btn-ghost btn-sm" style="color:var(--ink);background:var(--lilac)" id="p-out" type="button">Cerrar sesión</button></div></div>' +
        '<div class="tabs mt" id="p-tabs"><button class="tab" data-g="casi-perfecto" type="button">Casi Perfecto</button><button class="tab on" data-g="casino-fortuna" type="button">Casino Fortuna</button></div>' +
        '<div class="card" id="p-game"></div>';
      $('#p-head h1').textContent = u.playerName;
      $('#p-mail').textContent = u.email + (u.birthday ? ' · Cumpleaños: ' + birthdayText(u.birthday) : '');
      $('#p-av').appendChild(XA.avatar(u.avatar, 112));
      $('#p-out').addEventListener('click', function () { XA.auth.logout(); location.href = 'index.html'; });

      function list(title, ids, names, skinMode) {
        if (!ids.length) return '<h3 style="font-size:.9rem;margin:22px 0 10px">' + title + '</h3><p class="note">Aún no tienes ninguno.</p>';
        return '<h3 style="font-size:.9rem;margin:22px 0 10px">' + title + ' (' + ids.length + ')</h3><div class="inv">' + ids.map(function (id) {
          var label;
          if (skinMode) { var p = id.split(':'); label = (names.chars[p[0]] || p[0]) + ' · ' + (names.skins[p[1]] || p[1]); }
          else label = names[id] || id;
          return '<div class="inv-item"><strong>' + esc(label) + '</strong><div class="note">Desbloqueado</div></div>';
        }).join('') + '</div>';
      }

      /* Colección con modelos 3D (personajes y skins) */
      var cf3dLoad = null;
      function whenCf3d(fn, onFail) {
        if (XA.cf3d) return fn(XA.cf3d);
        // Se carga el módulo desde aquí (ruta relativa a js/pages.js), sin depender de otra etiqueta en el HTML.
        cf3dLoad = cf3dLoad || import('./cf3d.js').then(function () { return XA.cf3d; });
        cf3dLoad.then(fn).catch(function (err) { console.error('No se pudieron cargar los modelos 3D:', err); if (onFail) onFail(err); });
      }
      function collection(title, items, skinMode) {
        if (!items.length) return '<h3 style="font-size:.9rem;margin:22px 0 10px">' + title + '</h3><p class="note">Aún no tienes ninguno.</p>';
        return '<h3 style="font-size:.9rem;margin:22px 0 10px">' + title + ' (' + items.length + ')</h3><div class="cf3d-grid">' + items.map(function (it) {
          var cn = XA.cfChars[it.char] || it.char, sn = it.skin ? (XA.cfSkins[it.skin] || it.skin) : '';
          var label = skinMode ? '<strong>' + esc(cn) + '</strong><span>' + esc(sn) + '</span>' : '<strong>' + esc(cn) + '</strong><span>' + (sn ? 'Skin: ' + esc(sn) : 'Sin skin') + '</span>';
          return '<div class="cf3d-card' + (skinMode ? '' : ' pick') + '"' + (skinMode ? '' : ' data-pick="' + esc(it.char) + '" tabindex="0" role="button"') + '><div class="cf3d-stage" data-c="' + esc(it.char) + '"' + (it.skin ? ' data-s="' + esc(it.skin) + '"' : '') + (skinMode ? ' data-sm="1"' : '') + '></div>' + label + '</div>';
        }).join('') + '</div>';
      }

      function drawGame(g) {
        var box = $('#p-game'), head = '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px"><h2 class="h2" style="margin:0;font-size:1.05rem">' + XA.games[g].name + '</h2></div>';
        $$('#p-tabs .tab').forEach(function (t) { t.classList.toggle('on', t.getAttribute('data-g') === g); });
        if (g === 'casi-perfecto') {
          box.innerHTML = head + '<p class="note" style="margin-top:14px">Casi Perfecto aún no sincroniza su progreso con la cuenta. Muy pronto.</p>';
          return;
        }
        var p = u.game;
        if (!p) {
          box.innerHTML = head + '<p class="note" style="margin-top:14px">Todavía no hay progreso de Casino Fortuna en tu cuenta. Inicia sesión con este correo dentro del juego (Perfil) y se sincronizará aquí.</p><div class="cta-row" style="margin-top:14px"><a class="btn btn-pink btn-sm" href="' + XA.games[g].page + '">Ver el juego</a></div>';
          return;
        }
        box.innerHTML = head +
          '<div class="stat-grid"><div class="stat"><b><span class="coin"></span> ' + XA.num(p.coins) + '</b>Monedas</div>' +
          '<div class="stat"><b>' + XA.num(p.chips) + '</b>Fichas</div>' +
          '<div class="stat"><b id="p-rank">—</b>Posición mundial</div></div>' +
          collection('Mis personajes', p.characters.map(function (c) { return { char: c, skin: p.equipped && p.equipped[c] && p.skins.indexOf(c + ':' + p.equipped[c]) >= 0 ? p.equipped[c] : null }; }), false) +
          '<div id="cf-skins"></div>' +
          '<p class="note" style="margin-top:18px">Última sincronización: ' + (p.updatedAt ? new Date(p.updatedAt).toLocaleString('es-MX') : '—') + '</p>';
        var picked = null;
        function mountStages(root, small, bucket) {
          $$('.cf3d-stage', root).forEach(function (st) {
            var c = st.getAttribute('data-c'), sk = st.getAttribute('data-s') || null;
            whenCf3d(function (api) { if (st.isConnected) bucket.push(api.mount(st, c, sk, { zoom: small ? 1.15 : 1, platform: !small })); },
              function (err) { st.innerHTML = '<p class="note" style="padding:14px;font-size:.78rem">No se pudo cargar el modelo 3D (' + esc(err && err.message || err) + '). Revisa que exista js/cf3d.js y la carpeta js/game3d/.</p>'; });
          });
        }
        /* Skins del personaje elegido */
        var skinsBox = $('#cf-skins', box), skinBucket = [];
        function drawSkins() {
          skinBucket.forEach(function (d) { d(); }); skinBucket = [];
          if (!picked) { skinsBox.innerHTML = '<h3 style="font-size:.9rem;margin:22px 0 10px">Mis skins</h3><p class="note">Toca un personaje para ver sus skins.</p>'; return; }
          var mine = p.skins.filter(function (id) { return id.split(':')[0] === picked; }).map(function (id) { return { char: picked, skin: id.split(':')[1] }; });
          skinsBox.innerHTML = collection('Skins de ' + (XA.cfChars[picked] || picked), mine, true);
          mountStages(skinsBox, true, skinBucket);
        }
        $$('.cf3d-card[data-pick]', box).forEach(function (card) {
          card.addEventListener('click', function () {
            var c = card.getAttribute('data-pick');
            picked = picked === c ? null : c;
            $$('.cf3d-card[data-pick]', box).forEach(function (x) { x.classList.toggle('sel', x.getAttribute('data-pick') === picked); });
            drawSkins();
            if (picked && skinsBox.scrollIntoView) skinsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        });
        mountStages(box.querySelector('.cf3d-grid'), false, []);
        drawSkins();
        XA.leaderboard('casino-fortuna', 'siempre').then(function (r) {
          var el = $('#p-rank'); if (el && r.me) el.textContent = '#' + r.me.position;
        });
      }
      $$('#p-tabs .tab').forEach(function (t) { t.addEventListener('click', function () { drawGame(t.getAttribute('data-g')); }); });
      drawGame('casino-fortuna');

      /* ---------- Editar perfil (nombre y foto) ---------- */
      $('#p-edit').addEventListener('click', function () {
        var f = mk('<form novalidate><h3>Editar perfil</h3>' +
          '<div class="field"><label for="e-name">Nombre de jugador</label><input class="input" id="e-name" maxlength="16" value="' + esc(u.playerName) + '"><div class="err" id="e-err"></div></div>' +
          '<div class="field"><label>Foto de perfil</label><div id="e-av"></div></div>' +
          '<div class="field"><label for="e-bm">Cumpleaños</label><div style="display:flex;gap:10px"><select class="input" id="e-bd" aria-label="Día" style="flex:1"></select><select class="input" id="e-bm" aria-label="Mes" style="flex:2"></select></div>' +
          '<p class="note" id="e-bnote" style="margin-top:6px"></p><div class="err" id="e-berr"></div></div>' +
          '<button class="btn btn-pink btn-block" type="submit">Guardar cambios</button></form>');
        /* cumpleaños: el año no se pide; solo sirve para las skins de cumpleaños del juego */
        var bm = $('#e-bm', f), bd = $('#e-bd', f), bnote = $('#e-bnote', f);
        var locked = !!(u.birthday && u.birthdayEditableFrom && new Date(u.birthdayEditableFrom).getTime() > Date.now());
        bm.innerHTML = '<option value="">Mes</option>' + MONTHS.map(function (n, i) { return '<option value="' + (i + 1) + '">' + n.charAt(0).toUpperCase() + n.slice(1) + '</option>'; }).join('');
        function fillDays() {
          var m = +bm.value, keep = bd.value, max = m ? MDAYS[m - 1] : 31, h = '<option value="">Día</option>';
          for (var d = 1; d <= max; d++) h += '<option value="' + d + '">' + d + '</option>';
          bd.innerHTML = h;
          if (keep && +keep <= max) bd.value = keep;
        }
        bm.addEventListener('change', fillDays);
        fillDays();
        if (u.birthday) { bm.value = u.birthday.month; fillDays(); bd.value = u.birthday.day; }
        if (locked) {
          bm.disabled = bd.disabled = true;
          bnote.textContent = 'Tu cumpleaños ya está guardado. Podrás cambiarlo a partir del ' + new Date(u.birthdayEditableFrom).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) + '.';
        } else {
          bnote.textContent = 'En tu cumpleaños el juego te regala las skins de cumpleaños. Solo guardamos el día y el mes, y después de guardarlo solo podrás cambiarlo una vez al año.';
        }
        $('#e-av', f).appendChild(avatarPicker('eav', u.avatar));
        var m = XA.modal(f);
        f.addEventListener('submit', function (e) {
          e.preventDefault();
          var err = $('#e-err', f), btn = $('button[type="submit"]', f);
          var nm = $('#e-name', f).value.trim();
          err.textContent = '';
          if (nm.length < 3 || nm.length > 16) { err.textContent = 'Entre 3 y 16 caracteres.'; return; }
          if (!/^[\wÀ-ÿ.\- ]+$/.test(nm)) { err.textContent = 'Usa solo letras, números, punto, guion o guion bajo.'; return; }
          // Si la foto actual es del juego (no está en el selector), se conserva.
          var chosen = f.querySelector('input[name=eav]:checked');
          var av = chosen ? chosen.value : u.avatar;
          var berr = $('#e-berr', f); berr.textContent = '';
          var wantB = !locked && bm.value && bd.value ? { month: +bm.value, day: +bd.value } : null;
          if (!locked && (bm.value || bd.value) && !wantB) { berr.textContent = 'Elige el día y el mes.'; return; }
          var changedB = wantB && (!u.birthday || u.birthday.month !== wantB.month || u.birthday.day !== wantB.day);
          btn.disabled = true; btn.textContent = 'Guardando…';
          XA.auth.update({ playerName: nm, avatar: av }).then(function (r) {
            if (r.error) { err.textContent = r.error; btn.disabled = false; btn.textContent = 'Guardar cambios'; return; }
            if (!changedB) return r;
            return XA.auth.setBirthday(wantB.month, wantB.day).then(function (rb) {
              if (rb.error) { berr.textContent = 'Tu perfil se guardó, pero el cumpleaños no: ' + rb.error; btn.disabled = false; btn.textContent = 'Guardar cambios'; return null; }
              return rb;
            });
          }).then(function (r) {
            if (!r) return;
            XA.toast('Perfil actualizado', 'ok');
            m.close();
            setTimeout(function () { location.reload(); }, 500);
          });
        });
        $('#e-name', f).focus();
      });
    }
  };


  /* ---------- tienda ---------- */
  function shop(gid) {
    var g = XA.games[gid], u = XA.auth.current(), box = $('#packs');
    var bal = $('#balance');
    bal.innerHTML = !u ? 'Inicia sesión para ver tu saldo'
      : (gid === 'casino-fortuna' && u.game) ? 'Tus monedas: <b><span class="coin"></span> ' + XA.num(u.game.coins) + '</b>'
      : 'Aún no hay saldo sincronizado en tu cuenta';
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
