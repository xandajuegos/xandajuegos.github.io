/* ==========================================================
   XandA Juegos · Biblioteca de modelos de bloques
   ========================================================== */
(function (XA) {
  var K = {
    ink: '#1d1445', pink: '#ff5a8a', orange: '#ff8a4c', yellow: '#ffd54a', green: '#7ed957',
    sky: '#5ec8ee', purple: '#7c5cff', white: '#ffffff', cream: '#fff3e0', red: '#e8334f',
    wood: '#a9683b', stone: '#6b7794', glass: '#8fa8cc'
  };
  XA.palette = K;

  function B(x, y, z, w, h, d, c, o) { return Object.assign({ x: x, y: y, z: z, w: w, h: h, d: d, c: c }, o || {}); }
  function mv(arr, dx, dy, dz) {
    return arr.map(function (b) { return Object.assign({}, b, { x: b.x + dx, y: b.y + (dy || 0), z: b.z + dz }); });
  }
  function cat() { return Array.prototype.concat.apply([], arguments); }

  /* ---------- piezas sueltas ---------- */
  function dice(x, y, z, sz) {
    var o = [B(x, y, z, sz, sz, sz, '#ffffff')];
    var p = sz * 0.2, e = 0.05;
    function pip(a, b, c2, w, h, d) { o.push(B(a, b, c2, w, h, d, K.ink)); }
    [[-.25, -.25], [.25, -.25], [0, 0], [-.25, .25], [.25, .25]].forEach(function (q) { /* arriba: 5 */
      pip(x + sz * (.5 + q[0]) - p / 2, y + sz, z + sz * (.5 + q[1]) - p / 2, p, e, p);
    });
    [[-.25, .25], [0, 0], [.25, -.25]].forEach(function (q) { /* frente: 3 */
      pip(x + sz * (.5 + q[0]) - p / 2, y + sz * (.5 + q[1]) - p / 2, z + sz, p, p, e);
    });
    [[-.22, .22], [.22, -.22]].forEach(function (q) { /* derecha: 2 */
      pip(x + sz, y + sz * (.5 + q[1]) - p / 2, z + sz * (.5 + q[0]) - p / 2, e, p, p);
    });
    return o;
  }
  function coins(x, y, z, n, c) {
    var o = [];
    for (var i = 0; i < n; i++) {
      var j = (i % 2) * 0.06;
      o.push(B(x + j, y + i * 0.17, z + j, 0.9, 0.17, 0.9, i % 2 ? XA.dark(c, .08) : c));
    }
    return o;
  }
  function cloud(x, y, z, k) {
    k = k || 1;
    return [
      B(x, y, z, 2.4 * k, .7 * k, 1.4 * k, '#ffffff', { anim: 'bob', amp: 5, dur: 5 }),
      B(x + .5 * k, y + .7 * k, z + .2 * k, 1.3 * k, .6 * k, 1 * k, '#ffffff', { anim: 'bob', amp: 5, dur: 5 })
    ];
  }
  function spark(x, y, z, c, dl) {
    return B(x, y, z, .32, .32, .32, c, { anim: 'bob', amp: 9, delay: dl || 0, dur: 2.4 });
  }

  /* ---------- torre (Casi Perfecto) ---------- */
  function tower(o) {
    o = o || {};
    var n = o.floors || 9, out = [];
    var sx = [0, .22, -.18, .28, -.12, .2, -.26, .1, 0, .15];
    var sz = [0, -.1, .2, -.18, .12, -.2, .1, .2, -.1, 0];
    var y = 0;
    for (var i = 0; i < n; i++) {
      var w = 3.5 - i * 0.1;
      out.push(B(-w / 2 + sx[i % 10], y, -w / 2 + sz[i % 10], w, .7, w, i % 2 ? '#9db4d6' : K.glass, { grid: true }));
      y += .7;
    }
    var tw = 3.5 - n * 0.1;
    out.push(B(-tw / 2, y, -tw / 2, tw, .7, tw, K.pink, { anim: 'slide', amp: (o.amp || 40), dur: 2.6 }));
    return out;
  }
  function city(skip) {
    var b = [
      B(-7, 0, -6, 2.2, 5.2, 2.2, '#5f6c8c', { win: '#ffd98a' }),
      B(-4.2, 0, -7, 2, 3.4, 2, '#6b7794', { win: '#ffd98a' }),
      B(-6.4, 0, -2.5, 1.8, 2.4, 1.8, '#7a86a3', { win: '#ffe7b0' }),
      B(4.2, 0, -6, 2.4, 4.6, 2.4, '#5f6c8c', { win: '#ffd98a' }),
      B(6.4, 0, -2.2, 1.8, 2.8, 1.8, '#7a86a3', { win: '#ffe7b0' }),
      B(3, 0, -7.4, 1.6, 6.4, 1.6, '#4f5b7b', { win: '#ffd98a' }),
      B(-7.2, 0, 2.2, 1.6, 3.2, 1.6, '#6b7794', { win: '#ffd98a' }),
      B(5.6, 0, 3, 2, 2, 2, '#7a86a3', { win: '#ffe7b0' })
    ];
    return skip ? b.slice(0, 5) : b;
  }

  /* ---------- tragamonedas (Casino Fortuna) ---------- */
  function slot() {
    var o = [
      B(-1.5, 0, -1.1, 3, .4, 2.2, '#b8203a'),
      B(-1.3, .4, -1, 2.6, 2.8, 2, K.red),
      B(-1.45, 3.2, -1.15, 2.9, .6, 2.3, K.yellow),
      B(-1, 3.8, -.5, 2, .35, 1, K.orange),
      B(-1.05, 1.6, 1, 2.1, 1.2, .12, '#2a1f66'),
      B(-.9, .4, 1, 1.8, .35, .4, '#2a1f66')
    ];
    var cols = [K.pink, K.yellow, K.purple];
    for (var i = 0; i < 3; i++) {
      o.push(B(-.92 + i * .64, 1.7, 1.1, .54, 1, .1, '#ffffff'));
      o.push(B(-.83 + i * .64, 2.0, 1.2, .36, .36, .06, cols[i]));
    }
    o.push(B(1.3, 1.1, -.1, .2, 1.5, .2, '#c9ccd9'));
    o.push(B(1.2, 2.6, -.2, .42, .42, .42, K.pink, { anim: 'bob', amp: 6, dur: 2.2 }));
    return o;
  }

  /* ---------- zorro mascota ---------- */
  function fox(o) {
    o = o || {};
    var f = [
      B(.1, 0, .1, .4, .55, .4, '#7a3b14'), B(.7, 0, .1, .4, .55, .4, '#7a3b14'),
      B(.1, 0, 1.1, .4, .55, .4, '#7a3b14'), B(.7, 0, 1.1, .4, .55, .4, '#7a3b14'),
      B(0, .55, 0, 1.2, 1, 1.6, '#ff8a3c'),
      B(.3, .55, 1.6, .6, .7, .06, '#ffffff'),
      B(-.05, 1.3, 1.2, 1.3, 1.1, 1.1, '#ff8a3c'),
      B(.35, 1.4, 2.3, .6, .4, .4, '#ffffff'),
      B(.52, 1.68, 2.7, .26, .16, .1, K.ink),
      B(.18, 2.0, 2.3, .16, .22, .05, K.ink), B(.86, 2.0, 2.3, .16, .22, .05, K.ink),
      B(.05, 2.4, 1.45, .32, .55, .22, '#ff8a3c'), B(.83, 2.4, 1.45, .32, .55, .22, '#ff8a3c'),
      B(.12, 2.4, 1.67, .18, .35, .06, K.pink), B(.9, 2.4, 1.67, .18, .35, .06, K.pink),
      B(.4, .95, -.95, .42, .42, .95, '#ff8a3c', { anim: 'bob', amp: 3, dur: 1.6 }),
      B(.4, .95, -1.3, .42, .42, .35, '#ffffff', { anim: 'bob', amp: 3, dur: 1.6 })
    ];
    if (o.hat) {
      f.push(B(-.1, 2.38, 1.15, 1.4, .1, 1.2, K.ink));
      f.push(B(.15, 2.48, 1.3, .9, .75, .9, K.ink));
      f.push(B(.15, 2.52, 1.3, .9, .15, .91, K.red));
    }
    return f;
  }

  /* ---------- personas / personajes del casino ---------- */
  function person(o) {
    var skin = o.skin || '#ffd0a6', hair = o.hair || '#5a3418', shirt = o.shirt || '#ffffff', pants = o.pants || K.ink;
    var p = [
      B(-.45, 0, -.2, .4, .9, .4, pants), B(.05, 0, -.2, .4, .9, .4, pants),
      B(-.5, .9, -.3, 1, 1.1, .6, shirt),
      B(-.82, .95, -.2, .32, 1, .4, o.sleeve || shirt), B(.5, .95, -.2, .32, 1, .4, o.sleeve || shirt),
      B(-.82, .78, -.2, .32, .2, .4, skin), B(.5, .78, -.2, .32, .2, .4, skin)
    ];
    if (o.vest) p.push(B(-.5, .9, .3, 1, 1.1, .06, o.vest));
    if (o.tie) p.push(B(-.12, 1.6, .36, .24, .24, .05, o.tie));
    var headC = o.head === 'robot' ? '#c9ccd9' : (o.head === 'dice' ? '#ffffff' : skin);
    p.push(B(-.5, 2, -.45, 1, 1, 1, headC));
    if (o.head === 'robot') {
      p.push(B(-.4, 2.5, .55, .8, .25, .05, K.sky));
      p.push(B(-.05, 3, -.05, .1, .45, .1, '#c9ccd9'));
      p.push(B(-.15, 3.4, -.15, .3, .3, .3, K.red, { anim: 'bob', amp: 4, dur: 1.4 }));
      p.push(B(-.3, 2.15, .55, .6, .08, .05, K.ink));
    } else if (o.head === 'dice') {
      [[-.25, .25], [0, 0], [.25, -.25]].forEach(function (q) {
        p.push(B(q[0] * 1 - .1, 2.5 + q[1] * 1 - .1, .55, .2, .2, .05, K.ink));
      });
    } else {
      p.push(B(-.28, 2.45, .55, .15, .2, .05, K.ink), B(.13, 2.45, .55, .15, .2, .05, K.ink));
      p.push(B(-.12, 2.18, .55, .24, .06, .05, '#b0503a'));
      p.push(B(-.55, 2.85, -.5, 1.1, .3, 1.1, hair));
      if (o.longHair) p.push(B(-.55, 1.75, -.5, 1.1, 1.2, .3, hair));
    }
    if (o.hat === 'top') {
      p.push(B(-.7, 3.0, -.7, 1.4, .1, 1.4, K.ink));
      p.push(B(-.45, 3.1, -.45, .9, .85, .9, K.ink));
      p.push(B(-.45, 3.15, -.45, .9, .18, .91, K.red));
    }
    return p;
  }

  /* ---------- cabezas de avatar ---------- */
  function avatar(kind) {
    var I = K.ink, a = [];
    switch (kind) {
      case 'zorro':
        a = [B(-.5, 0, -.5, 1, 1, 1, '#ff8a3c'), B(-.45, 1, -.2, .28, .42, .25, '#ff8a3c'), B(.17, 1, -.2, .28, .42, .25, '#ff8a3c'),
          B(-.28, .1, .5, .56, .32, .2, '#fff'), B(-.1, .3, .7, .2, .12, .06, I),
          B(-.33, .6, .5, .14, .18, .05, I), B(.19, .6, .5, .14, .18, .05, I)];
        break;
      case 'oveja':
        a = [B(-.58, 0, -.58, 1.16, 1.16, 1.16, '#fff'), B(-.36, .08, .58, .72, .74, .1, '#4a4560'),
          B(-.74, .5, -.1, .2, .16, .3, '#4a4560'), B(.54, .5, -.1, .2, .16, .3, '#4a4560'),
          B(-.2, .5, .68, .12, .16, .05, '#fff'), B(.08, .5, .68, .12, .16, .05, '#fff')];
        break;
      case 'rana':
        a = [B(-.5, 0, -.5, 1, .9, 1, K.green), B(-.5, .9, .05, .38, .34, .38, K.green), B(.12, .9, .05, .38, .34, .38, K.green),
          B(-.44, .95, .43, .26, .24, .05, '#fff'), B(.18, .95, .43, .26, .24, .05, '#fff'),
          B(-.36, 1.0, .48, .1, .12, .05, I), B(.26, 1.0, .48, .1, .12, .05, I),
          B(-.32, .22, .5, .64, .07, .05, I)];
        break;
      case 'panda':
        a = [B(-.5, 0, -.5, 1, 1, 1, '#fff'), B(-.58, .85, -.2, .3, .3, .3, I), B(.28, .85, -.2, .3, .3, .3, I),
          B(-.4, .45, .5, .28, .32, .05, I), B(.12, .45, .5, .28, .32, .05, I),
          B(-.3, .52, .55, .1, .12, .05, '#fff'), B(.2, .52, .55, .1, .12, .05, '#fff'),
          B(-.09, .22, .5, .18, .12, .06, I)];
        break;
      case 'gato':
        a = [B(-.5, 0, -.5, 1, 1, 1, '#9aa3b8'), B(-.5, 1, -.1, .3, .38, .28, '#9aa3b8'), B(.2, 1, -.1, .3, .38, .28, '#9aa3b8'),
          B(-.42, 1, .1, .14, .22, .06, K.pink), B(.28, 1, .1, .14, .22, .06, K.pink),
          B(-.32, .55, .5, .18, .18, .05, K.yellow), B(.14, .55, .5, .18, .18, .05, K.yellow),
          B(-.08, .3, .5, .16, .1, .06, K.pink)];
        break;
      case 'robot':
        a = [B(-.5, 0, -.5, 1, 1, 1, '#c9ccd9'), B(-.05, 1, -.05, .1, .35, .1, '#c9ccd9'), B(-.14, 1.35, -.14, .28, .28, .28, K.red),
          B(-.4, .5, .5, .8, .22, .05, K.sky), B(-.3, .2, .5, .6, .08, .05, I)];
        break;
      case 'dado':
        a = [B(-.5, 0, -.5, 1, 1, 1, '#fff')];
        [[-.25, -.25], [.25, -.25], [0, 0], [-.25, .25], [.25, .25]].forEach(function (q) {
          a.push(B(q[0] - .1, .5 + q[1] - .1, .5, .2, .2, .05, I));
        });
        break;
      case 'hongo':
        a = [B(-.4, 0, -.4, .8, .75, .8, K.cream || '#fff3e0'), B(-.62, .75, -.62, 1.24, .6, 1.24, K.pink),
          B(-.3, 1.35, -.3, .3, .04, .3, '#fff'), B(.1, 1.35, .1, .3, .04, .3, '#fff'),
          B(-.25, .35, .4, .12, .18, .05, I), B(.13, .35, .4, .12, .18, .05, I)];
        break;
      default:
        a = [B(-.5, 0, -.5, 1, 1, 1, K.pink)];
    }
    return a;
  }

  /* ---------- dioramas de mapas (Casi Perfecto) ---------- */
  function miniTower(c1, c2, h) {
    var o = [];
    for (var i = 0; i < (h || 4); i++) {
      var w = 1.5 - i * .06;
      o.push(B(-w / 2 + (i % 2 ? .08 : -.06), i * .45, -w / 2, w, .45, w, i % 2 ? c1 : c2, { grid: true }));
    }
    var tw = 1.5 - (h || 4) * .06;
    o.push(B(-tw / 2, (h || 4) * .45, -tw / 2, tw, .45, tw, K.pink, { anim: 'slide', amp: 16, dur: 2.4 }));
    return o;
  }
  function mapModel(kind) {
    var g = { ciudad: '#59658a', desierto: '#f2c879', artico: '#e8f6ff', bosque: '#6cc24a', espacio: '#2a1f66', playa: '#f6dc9b' }[kind];
    var tops = {
      ciudad: XA.checker('#59658a', '#626f95', 1), desierto: XA.checker('#f2c879', '#f6d28f', 1),
      artico: XA.checker('#e8f6ff', '#d6eeff', 1), bosque: XA.checker('#6cc24a', '#78cc56', 1),
      espacio: XA.checker('#2a1f66', '#33287a', 1), playa: XA.checker('#f6dc9b', '#fae6b0', 1)
    };
    var o = [B(-3.2, -.5, -3.2, 6.4, .5, 6.4, g, { topBg: tops[kind] })];
    var t = miniTower('#8fa8cc', '#9db4d6', 4);
    if (kind === 'ciudad') {
      o = o.concat([
        B(-3, 0, -3, 1.2, 2.8, 1.2, '#6b7794', { win: '#ffd98a' }), B(1.8, 0, -3, 1.3, 1.8, 1.3, '#7a86a3', { win: '#ffe7b0' }),
        B(-3, 0, 1.8, 1.3, 2.2, 1.3, '#7a86a3', { win: '#ffe7b0' }), B(1.9, 0, 1.9, 1, 3.2, 1, '#5f6c8c', { win: '#ffd98a' })
      ]);
    } else if (kind === 'desierto') {
      o = o.concat([
        B(-3.2, 0, -3.2, 2.4, .6, 2.2, '#eab35f'), B(1.2, 0, 1.4, 2, .45, 1.7, '#eab35f'),
        B(2, 0, -2, .38, 1.4, .38, K.green), B(1.62, .6, -2, .38, .3, .38, K.green), B(1.62, .6, -2, .15, .8, .38, K.green),
        B(-2.4, 0, 2, .9, .7, .9, '#c98b4a')
      ]);
    } else if (kind === 'artico') {
      o = o.concat([
        B(-2.6, 0, -2.2, 1, .8, 1, '#bfe7ff'), B(2, 0, -2.4, .8, 1.3, .8, '#a5dcff'),
        B(-2.3, 0, 2, .3, .45, .3, K.wood), B(-2.65, .45, 1.65, 1, .55, 1, '#2e8b57'), B(-2.5, 1, 1.8, .7, .5, .7, '#34a065'), B(-2.3, 1.5, 2, .3, .3, .3, '#fff'),
        B(2, 0, 2, .3, .45, .3, K.wood), B(1.65, .45, 1.65, 1, .55, 1, '#2e8b57'), B(1.8, 1, 1.8, .7, .5, .7, '#34a065'), B(2, 1.5, 2, .3, .3, .3, '#fff')
      ]);
    } else if (kind === 'bosque') {
      o = o.concat([
        B(-2.4, 0, -2.4, .45, 1.1, .45, '#8b5a2b'), B(-2.9, 1.1, -2.9, 1.5, 1.1, 1.5, '#2f9e44'), B(-2.55, 2.2, -2.55, .8, .6, .8, '#3fbf5a'),
        B(2, 0, 1.8, .45, .9, .45, '#8b5a2b'), B(1.55, .9, 1.35, 1.35, 1, 1.35, '#2f9e44'), B(1.85, 1.9, 1.65, .75, .5, .75, '#3fbf5a'),
        B(1.8, 0, -2.4, .25, .25, .25, K.pink), B(-2.2, 0, 2.2, .25, .25, .25, K.yellow), B(-1.6, 0, 2.6, .25, .25, .25, K.pink)
      ]);
    } else if (kind === 'espacio') {
      o = o.concat([
        B(1.8, 1.4, -2.2, 1.3, 1.3, 1.3, K.orange, { anim: 'bob', amp: 7, dur: 4 }),
        B(1.5, 1.95, -2.5, 1.9, .12, 1.9, K.yellow, { anim: 'bob', amp: 7, dur: 4 }),
        B(-2.8, 0, -2.8, .9, .5, .9, '#c9ccd9'), B(-2.45, .5, -2.45, .2, 1.3, .2, '#c9ccd9'), B(-2.55, 1.8, -2.55, .4, .4, .4, K.red, { anim: 'bob', amp: 4, dur: 1.6 }),
        spark(-2, 2.6, 1, K.yellow, 0), spark(2.4, 2.9, 1.8, '#fff', .8), spark(-.6, 3.4, -2.4, K.pink, 1.4)
      ]);
    } else if (kind === 'playa') {
      o = o.concat([
        B(-3.2, 0, 1.1, 6.4, .06, 2.1, '#3ec6e0'),
        B(-2.4, 0, -2.4, .32, 2, .32, K.wood), B(-3.2, 2, -3.2, 1.9, .2, 1.9, K.green), B(-2.6, 2.2, -2.6, .7, .2, .7, '#3fbf5a'),
        B(1.7, 0, -2, .14, 1.7, .14, '#fff'), B(1, 1.7, -2.7, 1.6, .25, 1.6, K.pink)
      ]);
    }
    return o.concat(mv(t, 0, 0, 0));
  }

  /* ---------- mesas del casino (skins) ---------- */
  function tableModel(o) {
    var out = [
      B(-3.2, 0, -2.2, 6.4, .6, 4.4, o.rim),
      B(-2.9, .6, -1.9, 5.8, .12, 3.8, o.felt, { topBg: XA.checker(o.felt, XA.light(o.felt, .07), 1) })
    ];
    out = out.concat(coins(-2.2, .72, .6, 5, o.chip), coins(-1.2, .72, 1, 3, K.yellow), coins(1.6, .72, -.4, 6, o.chip));
    out = out.concat(dice(.2, .72, -.8, .8));
    out.push(B(-.4, .72, 1.1, .7, .06, 1, '#ffffff'));
    out.push(B(.5, .72, 1.3, .7, .06, 1, '#ffffff'));
    out.push(B(-.2, .78, 1.5, .24, .02, .24, K.red));
    return out;
  }

  /* ---------- montones de monedas (tiendas) ---------- */
  function coinPile(o) {
    var t = o.tier || 1, c = o.color || K.yellow, out = [];
    var spots = [[0, 0, 4], [1.05, .1, 3], [-.1, 1.05, 3], [1.05, 1.15, 2], [2.1, 0, 2], [2.1, 1.1, 3]];
    if (t >= 4) {
      out = [
        B(-1.4, 0, -.9, 2.8, 1.1, 1.8, K.wood), B(-1.5, 1.1, -1, 3, .45, 2, '#8b5a2b'),
        B(-.22, 0, .9, .44, 1.5, .1, K.yellow)
      ];
      var n = t === 4 ? 7 : 12;
      for (var i = 0; i < n; i++) {
        out.push(B(-1.2 + (i % 4) * .62, 1.55 + Math.floor(i / 4) * .2 + (i % 3) * .05, -.6 + Math.floor(i / 4) * .4, .55, .2, .55, i % 2 ? c : XA.dark(c, .1)));
      }
      return out;
    }
    for (var s = 0; s < Math.min(spots.length, t * 1 + 1); s++) {
      out = out.concat(coins(spots[s][0] - 1, 0, spots[s][1] - .5, spots[s][2] + (t > 2 ? 1 : 0), c));
    }
    return out;
  }

  /* ---------- pilar de podio con avatar ---------- */
  function pillar(o) {
    var c = o.color || K.yellow, h = o.h || 2;
    var out = [B(-1, 0, -1, 2, h, 2, c)];
    out = out.concat(mv(avatar(o.kind || 'zorro').map(function (b) { return Object.assign({}, b, { x: b.x * 1.6, y: b.y * 1.6, z: b.z * 1.6, w: b.w * 1.6, h: b.h * 1.6, d: b.d * 1.6 }); }), 0, h, 0));
    return out;
  }

  /* ---------- composiciones ---------- */
  var platform = function (w, d, a, b) { return B(-w / 2, -.5, -d / 2, w, .5, d, a, { topBg: XA.checker(a, b, 1) }); };

  XA.models = {
    logo: function () { return [B(-.5, 0, -.5, 1, 1, 1, K.pink), B(-.5, 1.05, -.5, .5, .5, .5, K.yellow)]; },

    tower: function (o) { return cat([platform(5, 5, '#7c8db0', '#8798ba')], tower(o)); },

    cityTower: function () {
      return cat([B(-8, -.5, -8, 16, .5, 16, '#4b5577', { topBg: XA.checker('#4b5577', '#525d82', 1) })], city(), tower({ floors: 9, amp: 40 }));
    },

    slot: function () {
      return cat([platform(7, 6, '#2a1f66', '#33287a')], slot(),
        coins(-3, 0, 1.4, 5, K.yellow), coins(-2.9, 0, 2.5, 3, K.pink),
        dice(1.9, 0, 1.6, 1.1),
        [spark(-2.6, 3.5, -1, K.yellow, 0), spark(2.8, 3.1, -.6, K.pink, .6), spark(0, 5.3, 0, '#ffffff', 1.2)]);
    },

    fox: function (o) { return fox(o); },

    hero: function () {
      return cat(
        [platform(11, 9, '#7ed957', '#8ae066')],
        mv(tower({ floors: 6, amp: 28 }), 3.2, 0, -2),
        mv(slot(), -4, 0, -2.4),
        mv(fox({ hat: false }), -.8, 0, 1.2),
        dice(3.6, 0, 2.2, 1),
        coins(4.5, 0, 1, 6, K.yellow), coins(1.8, 0, 3.4, 4, K.pink),
        cloud(-6, 7, -3, 1.1), cloud(5, 8.6, -4, 1), cloud(-1, 9.8, 2, .8),
        [spark(-2.6, 5.5, 3, K.yellow, 0), spark(6, 5, 1, K.pink, .5), spark(2, 7.5, 2, K.sky, 1)]
      );
    },

    trophy: function () {
      return [
        B(-1, 0, -1, 2, .35, 2, K.ink), B(-.3, .35, -.3, .6, .9, .6, K.yellow),
        B(-1.1, 1.25, -1.1, 2.2, 1.5, 2.2, K.yellow), B(-1.45, 1.7, -.35, .35, .8, .7, K.yellow), B(1.1, 1.7, -.35, .35, .8, .7, K.yellow),
        B(-.4, 1.7, 1.1, .8, .7, .06, K.pink), B(1.1, 1.25, -1.1, .02, 1.5, 2.2, K.yellow)
      ];
    },
    cloud: function () { return cloud(0, 0, 0, 1); },
    spark: function () { return [spark(0, 0, 0, K.yellow, 0)]; },
    dice: function () { return dice(0, 0, 0, 1.6); },
    heroDiorama: function () { return XA.models.hero(); },

    map: function (o) { return mapModel(o.kind || 'ciudad'); },
    table: function (o) { return tableModel(o); },
    pile: function (o) { return coinPile(o); },
    pillar: function (o) { return pillar(o); },
    avatar: function (o) { return avatar(o.kind); },
    person: function (o) { return person(o); },
    character: function (o) {
      var f = {
        lucky: function () { return cat(fox({ hat: true }).map(function (b) { return b; })); },
        jade: function () { return person({ skin: '#f3c6a0', hair: '#1fa36b', shirt: '#7c5cff', pants: '#5b3fd1', longHair: true, sleeve: '#7c5cff' }); },
        dado: function () { return person({ head: 'dice', shirt: '#ff5a8a', pants: K.ink, tie: '#ffd54a' }); },
        robo: function () { return person({ head: 'robot', shirt: '#2a1f66', pants: '#3b2f80', vest: K.yellow }); },
        crupier: function () { return person({ skin: '#e8b48a', hair: K.ink, shirt: '#ffffff', pants: K.ink, vest: K.red, tie: K.red, hat: 'top' }); }
      }[o.id];
      return f ? f() : person({});
    }
  };
})(window.XA);
