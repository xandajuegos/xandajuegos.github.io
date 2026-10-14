/* ==========================================================
   XandA Juegos · Motor de cubos poligonales 3D (CSS 3D puro)
   Cada modelo es una lista de cajas {x,y,z,w,h,d,c,...}
   en "unidades"; y positivo = hacia arriba.
   ========================================================== */
window.XA = window.XA || {};
(function (XA) {
  function hex2rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb2hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) {
      return Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    }).join('');
  }
  XA.mix = function (c, t, a) {
    var A = hex2rgb(c), B = hex2rgb(t);
    return rgb2hex(A[0] + (B[0] - A[0]) * a, A[1] + (B[1] - A[1]) * a, A[2] + (B[2] - A[2]) * a);
  };
  XA.light = function (c, a) { return XA.mix(c, '#ffffff', a); };
  XA.dark = function (c, a) { return XA.mix(c, '#1d1445', a); };

  var GRID_BG = 'linear-gradient(rgba(255,255,255,.38) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.38) 1px,transparent 1px)';

  /* ---------- una caja ---------- */
  XA.box = function (o, s) {
    var w = o.w * s, h = o.h * s, d = o.d * s;
    var el = document.createElement('div');
    el.className = 'xb';
    el.style.transform = 'translate3d(' + ((o.x + o.w / 2) * s) + 'px,' + (-(o.y + o.h / 2) * s) + 'px,' + ((o.z + o.d / 2) * s) + 'px)';
    var inner = document.createElement('div');
    inner.className = 'xbi';
    if (o.anim) {
      inner.classList.add('a-' + o.anim);
      inner.style.setProperty('--amp', (o.amp || 6) + 'px');
      inner.style.setProperty('--dl', (o.delay || 0) + 's');
      inner.style.setProperty('--dur', (o.dur || 3) + 's');
    }
    el.appendChild(inner);
    var c = o.c;
    var faces = [
      ['t', w, d, 'rotateX(90deg) translateZ(' + (h / 2) + 'px)', XA.light(c, 0.22)],
      ['f', w, h, 'translateZ(' + (d / 2) + 'px)', c],
      ['r', d, h, 'rotateY(90deg) translateZ(' + (w / 2) + 'px)', XA.dark(c, 0.2)]
    ];
    if (o.all) {
      faces.push(['l', d, h, 'rotateY(-90deg) translateZ(' + (w / 2) + 'px)', XA.dark(c, 0.3)]);
      faces.push(['k', w, h, 'rotateY(180deg) translateZ(' + (d / 2) + 'px)', XA.dark(c, 0.36)]);
    }
    faces.forEach(function (f) {
      var fe = document.createElement('div');
      fe.className = 'xf';
      fe.style.width = f[1] + 'px';
      fe.style.height = f[2] + 'px';
      fe.style.marginLeft = (-f[1] / 2) + 'px';
      fe.style.marginTop = (-f[2] / 2) + 'px';
      fe.style.transform = f[3];
      fe.style.background = f[4];
      fe.style.outline = '1px solid ' + f[4];
      var side = f[0] !== 't';
      if (!side && o.topBg) fe.style.background = o.topBg(s);
      if (side && o.grid) {
        fe.style.backgroundImage = GRID_BG;
        fe.style.backgroundSize = (s * 0.5) + 'px ' + (s * 0.5) + 'px';
      }
      if (side && o.win) {
        var wn = document.createElement('div');
        wn.className = 'xwin';
        wn.style.background = o.win;
        var cell = Math.max(5, s * 0.36);
        wn.style.webkitMaskSize = wn.style.maskSize = cell + 'px ' + cell + 'px';
        fe.appendChild(wn);
      }
      inner.appendChild(fe);
    });
    return el;
  };

  /* fondo ajedrezado para la cara superior */
  XA.checker = function (a, b, cells) {
    return function (s) {
      var n = (cells || 1) * s;
      return 'conic-gradient(' + a + ' 25%,' + b + ' 0 50%,' + a + ' 0 75%,' + b + ' 0) 0 0/' + n * 2 + 'px ' + n * 2 + 'px';
    };
  };

  /* ---------- un modelo (lista de cajas) ---------- */
  XA.model = function (boxes, opts) {
    opts = opts || {};
    var s = opts.s || 24;
    var minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9, minY = 1e9;
    boxes.forEach(function (b) {
      minX = Math.min(minX, b.x); maxX = Math.max(maxX, b.x + b.w);
      minZ = Math.min(minZ, b.z); maxZ = Math.max(maxZ, b.z + b.d);
      minY = Math.min(minY, b.y);
    });
    var dx = opts.raw ? 0 : -(minX + maxX) / 2;
    var dz = opts.raw ? 0 : -(minZ + maxZ) / 2;
    var dy = opts.raw ? 0 : -Math.max(minY, 0) * 0; /* la base queda en y=0 del modelo */
    var root = document.createElement('div');
    root.className = 'xm';
    boxes.forEach(function (b) {
      var nb = Object.assign({}, b, { x: b.x + dx, y: b.y + dy, z: b.z + dz, all: b.all || opts.all });
      root.appendChild(XA.box(nb, s));
    });
    return root;
  };

  /* ---------- escena: aplica la vista isométrica ---------- */
  XA.stage = function (boxes, opts) {
    opts = opts || {};
    var wrap = document.createElement('div');
    wrap.className = 'xs' + (opts.float ? ' float' : '');
    var rot = document.createElement('div');
    rot.className = 'xr';
    rot.style.setProperty('--rx', (opts.rx != null ? opts.rx : -30) + 'deg');
    rot.style.setProperty('--ry', (opts.ry != null ? opts.ry : -45) + 'deg');
    rot.style.setProperty('--cy', (opts.cy != null ? opts.cy : 72) + '%');
    var sway = document.createElement('div');
    sway.className = 'xsway' + (opts.sway === false ? '' : ' on');
    sway.appendChild(XA.model(boxes, opts));
    rot.appendChild(sway);
    wrap.appendChild(rot);
    return wrap;
  };

  /* monta [data-model] automáticamente */
  XA.mountAll = function (root) {
    (root || document).querySelectorAll('[data-model]:not([data-mounted])').forEach(function (el) {
      var name = el.getAttribute('data-model');
      var fn = XA.models && XA.models[name];
      if (!fn) return;
      var opts = {};
      try { opts = JSON.parse(el.getAttribute('data-opts') || '{}'); } catch (e) {}
      var s = parseFloat(el.getAttribute('data-s')) || opts.s || 24;
      var boxes = fn(opts);
      var st = XA.stage(boxes, {
        s: s,
        cy: opts.cy,
        float: el.hasAttribute('data-float'),
        sway: el.hasAttribute('data-nosway') ? false : true,
        rx: opts.rx, ry: opts.ry
      });
      if (el.hasAttribute('data-tilt')) st.setAttribute('data-tilt', '');
      el.appendChild(st);
      el.setAttribute('data-mounted', '1');
    });
  };
})(window.XA);
