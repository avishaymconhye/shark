/* SHARK sprites: pixel art built from code, drawn as crisp SVG on screen and on canvas for the export image. */
(function () {
  'use strict';
  var SP = window.SHARK_SPRITES = {};
  var P = window.SHARK_PATHS;

  /* Riso inks */
  SP.INK = { black: '#141414', paper: '#F2EDE4', pink: '#FF48B0', blue: '#0078BF', yellow: '#FFE800', green: '#00A95C' };

  var FIXED = {
    k: '#141414', w: '#FFFFFF', s: '#5BC0FF',
    p: '#FF48B0', P: '#C42A80', q: '#0078BF', Q: '#00507F',
    y: '#FFE800', Y: '#CFAE00', c: '#FF8FCB'
  };
  SP.BODIES = {
    pink: ['#FF48B0', '#C42A80'],
    blue: ['#2E8FE0', '#0A5A9C'],
    yellow: ['#FFE800', '#CFAE00'],
    paper: ['#F7F3EA', '#C4BBA9'],
    green: ['#19C37D', '#0C8A55']
  };
  SP.BODY_KEYS = ['pink', 'blue', 'yellow', 'paper', 'green'];

  function blank(w, h) {
    var g = [];
    for (var y = 0; y < h; y++) { var r = []; for (var x = 0; x < w; x++) r.push('.'); g.push(r); }
    return g;
  }
  function set(g, x, y, ch) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = ch; }
  function get(g, x, y) { return (y >= 0 && y < g.length && x >= 0 && x < g[0].length) ? g[y][x] : '.'; }
  // Ink outline drawn outside the shape, like a printed key line
  function outline(g) {
    var h = g.length, w = g[0].length, out = g.map(function (r) { return r.slice(); });
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (g[y][x] !== '.') continue;
      var n = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4; i++) {
        var v = get(g, x + n[i][0], y + n[i][1]);
        if (v !== '.' && v !== 's' && v !== 'k') { out[y][x] = 'k'; break; }
      }
    }
    return out;
  }

  /* ---------- fish (faces left) ---------- */
  // mood: calm, uneasy, nervous, panic, happy, sleep
  SP.fishGrid = function (mood) {
    var W = 22, H = 13, g = blank(W, H);
    var cx = 9.5, cy = 6.5, rx = 7.6, ry = 4.6;
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) g[y][x] = 'b';
    }
    // tail, forked
    for (var tx = 16; tx <= 19; tx++) {
      var half = (tx - 15) * 1.05 + 0.4;
      for (var ty = 0; ty < H; ty++) {
        var d = Math.abs(ty + 0.5 - cy);
        if (d <= half && !(tx >= 19 && d < 1.2)) g[ty][tx] = (tx >= 18 ? 'd' : 'b');
      }
    }
    // dorsal fin
    [8, 9, 10, 11].forEach(function (x) { set(g, x, 1, 'd'); });
    [9, 10].forEach(function (x) { set(g, x, 0, 'd'); });
    // gill
    for (var gy = 4; gy <= 8; gy++) if (get(g, 10, gy) === 'b') g[gy][10] = 'd';
    // belly shine
    set(g, 6, 9, 'c'); set(g, 7, 9, 'c');
    var o = outline(g);
    // face
    if (mood === 'sleep') {
      set(o, 4, 5, 'k'); set(o, 5, 5, 'k');
    } else if (mood === 'happy') {
      set(o, 4, 4, 'k'); set(o, 5, 4, 'k'); set(o, 3, 5, 'k'); set(o, 6, 5, 'k');
    } else {
      set(o, 4, 4, 'w'); set(o, 5, 4, 'w'); set(o, 4, 5, 'k'); set(o, 5, 5, 'w');
      if (mood === 'panic') { set(o, 4, 3, 'w'); set(o, 5, 3, 'w'); set(o, 4, 5, 'w'); set(o, 4, 4, 'k'); }
    }
    // mouth
    if (mood === 'happy') { set(o, 3, 8, 'k'); set(o, 4, 9, 'k'); }
    else if (mood === 'nervous' || mood === 'panic') { set(o, 2, 8, 'k'); set(o, 3, 7, 'k'); set(o, 4, 8, 'k'); }
    else set(o, 2, 8, 'k');
    // sweat
    if (mood === 'uneasy' || mood === 'nervous' || mood === 'panic') { set(o, 2, 1, 's'); set(o, 1, 2, 's'); set(o, 2, 2, 's'); }
    if (mood === 'nervous' || mood === 'panic') { set(o, 13, 0, 's'); set(o, 13, 1, 's'); }
    if (mood === 'panic') { set(o, 0, 5, 's'); set(o, 0, 6, 's'); }
    return o;
  };

  /* ---------- the Clam (the boss) ---------- */
  SP.clamGrid = function () {
    var W = 25, H = 20, g = blank(W, H);
    var cx = 12.5;
    // top shell
    for (var y = 5; y <= 13; y++) for (var x = 1; x < W - 1; x++) {
      var dx = (x + 0.5 - cx) / 10.6, dy = (y + 0.5 - 13.6) / 8.2;
      if (y <= 13 && dx * dx + dy * dy <= 1) g[y][x] = 'p';
    }
    // bottom shell
    for (var by = 14; by <= 18; by++) for (var bx = 1; bx < W - 1; bx++) {
      var ex = (bx + 0.5 - cx) / 10.6, ey = (by + 0.5 - 13.6) / 5.2;
      if (ex * ex + ey * ey <= 1) g[by][bx] = 'q';
    }
    // ridges
    [[5, 9], [6, 9], [19, 9], [18, 9]].forEach(function () {});
    for (var ry = 8; ry <= 13; ry++) { if (get(g, 4, ry) === 'p') g[ry][4] = 'P'; if (get(g, 20, ry) === 'p') g[ry][20] = 'P'; }
    for (var ry2 = 6; ry2 <= 13; ry2++) if (get(g, 12, ry2) === 'p') g[ry2][12] = 'P';
    for (var qx = 3; qx < W - 3; qx += 4) for (var qy = 15; qy <= 17; qy++) if (get(g, qx, qy) === 'q') g[qy][qx] = 'Q';
    // crown
    for (var cxx = 8; cxx <= 16; cxx++) { g[4][cxx] = 'Y'; g[3][cxx] = 'y'; }
    [8, 12, 16].forEach(function (x) { g[2][x] = 'y'; g[1][x] = 'y'; });
    [9, 11, 13, 15].forEach(function (x) { g[2][x] = 'y'; });
    var o = outline(g);
    // seam: the clam is shut tight
    for (var sx = 1; sx < W - 1; sx++) if (get(g, sx, 13) !== '.' || get(g, sx, 14) !== '.') o[14][sx] = 'k';
    // gritted teeth
    [10, 11, 13, 14].forEach(function (x) { o[14][x] = 'w'; });
    o[14][12] = 'k';
    // eyes, looking sideways, suspicious
    [[7, 9], [8, 9], [7, 10], [8, 10], [16, 9], [17, 9], [16, 10], [17, 10]].forEach(function (p) { o[p[1]][p[0]] = 'w'; });
    o[10][8] = 'k'; o[10][17] = 'k';
    // angry brows
    [[6, 7], [7, 7], [8, 8], [9, 8], [18, 7], [17, 7], [16, 8], [15, 8]].forEach(function (p) { o[p[1]][p[0]] = 'k'; });
    // jewel
    o[3][12] = 'q';
    // sweat
    set(o, 22, 4, 's'); set(o, 22, 5, 's'); set(o, 23, 5, 's');
    return o;
  };

  /* ---------- small things ---------- */
  function fromRows(rows) { return rows.map(function (r) { return r.split(''); }); }
  SP.coinGrid = function () {
    return fromRows([
      '..kkkk..',
      '.kyyyyk.',
      'kyywyyYk',
      'kywyyyYk',
      'kyyyyyYk',
      'kyyyyYYk',
      '.kYYYYk.',
      '..kkkk..'
    ]);
  };
  var ICONS = {
    plus: ['...kk...', '...kk...', '...kk...', 'kkkkkkkk', 'kkkkkkkk', '...kk...', '...kk...', '...kk...'],
    close: ['kk....kk', 'kkk..kkk', '.kkkkkk.', '..kkkk..', '..kkkk..', '.kkkkkk.', 'kkk..kkk', 'kk....kk'],
    back: ['...k....', '..kk....', '.kkkkkkk', 'kkkkkkkk', '.kkkkkkk', '..kk....', '...k....'],
    gear: ['...kkk...', '.k.kkk.k.', '..kkkkk..', 'kkkk.kkkk', 'kkk...kkk', 'kkkk.kkkk', '..kkkkk..', '.k.kkk.k.', '...kkk...'],
    pencil: ['......kk', '.....kkk', '....kkk.', '...kkk..', '..kkk...', '.kkk....', 'kkk.....', 'kk......'],
    share: ['...kk...', '..kkkk..', '.kkkkkk.', '...kk...', '...kk...', 'k..kk..k', 'k......k', 'kkkkkkkk'],
    chat: ['.kkkkkk.', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', '.kkkkkk.', '.kk.....', 'k.......'],
    check: ['.......k', '......kk', '.....kk.', 'k...kk..', 'kk.kk...', '.kkk....', '..k.....'],
    trash: ['..kkkk..', 'kkkkkkkk', '.k.kk.k.', '.k.kk.k.', '.k.kk.k.', '.k.kk.k.', '.kkkkkk.'],
    up: ['...kk...', '..kkkk..', '.kkkkkk.', 'kkkkkkkk', '...kk...', '...kk...', '...kk...']
  };

  /* ---------- render to SVG ---------- */
  function colorOf(ch, body) {
    if (ch === 'b') return body[0];
    if (ch === 'd') return body[1];
    return FIXED[ch];
  }
  // One rect per horizontal run of the same colour
  function runs(grid, fn) {
    for (var y = 0; y < grid.length; y++) {
      var row = grid[y], x = 0;
      while (x < row.length) {
        var ch = row[x];
        if (ch === '.') { x++; continue; }
        var s = x;
        while (x < row.length && row[x] === ch) x++;
        fn(ch, s, y, x - s);
      }
    }
  }
  SP.svg = function (grid, scale, opts) {
    opts = opts || {};
    var body = SP.BODIES[opts.body || 'paper'];
    var w = grid[0].length, h = grid.length, out = [];
    runs(grid, function (ch, x, y, len) {
      var fill = opts.mono ? 'currentColor' : colorOf(ch, body);
      out.push('<rect x="' + x + '" y="' + y + '" width="' + len + '" height="1" fill="' + fill + '"/>');
    });
    return '<svg class="px-svg" width="' + (w * scale) + '" height="' + (h * scale) + '" viewBox="0 0 ' + w + ' ' + h +
      '" shape-rendering="crispEdges" aria-hidden="true">' + out.join('') + '</svg>';
  };
  SP.fishSVG = function (body, mood, scale) { return SP.svg(SP.fishGrid(mood), scale, { body: body }); };
  SP.clamSVG = function (scale) { return SP.svg(SP.clamGrid(), scale); };
  SP.coinSVG = function (scale) { return SP.svg(SP.coinGrid(), scale); };
  SP.icon = function (name, scale) {
    return SP.svg(fromRows(ICONS[name]), scale || 2.5, { mono: true }).replace('class="px-svg"', 'class="px-svg ico"');
  };

  /* ---------- render to canvas ---------- */
  SP.draw = function (ctx, grid, x0, y0, scale, opts) {
    opts = opts || {};
    var body = SP.BODIES[opts.body || 'paper'];
    runs(grid, function (ch, x, y, len) {
      ctx.fillStyle = opts.flat || colorOf(ch, body);
      ctx.fillRect(x0 + x * scale, y0 + y * scale, len * scale + 0.5, scale + 0.5);
    });
  };

  /* ---------- logo ---------- */
  SP.wordmarkSVG = function (cls) {
    var v = P.wordmark.viewBox;
    return '<svg class="' + (cls || 'wordmark') + '" viewBox="' + v.join(' ') + '" role="img" aria-label="SHARK">' +
      P.wordmark.paths.map(function (d) { return '<path fill="currentColor" d="' + d + '"/>'; }).join('') + '</svg>';
  };
  SP.finSVG = function (cls) {
    var v = P.fin.viewBox;
    return '<svg class="' + (cls || 'fin') + '" viewBox="' + v.join(' ') + '" aria-hidden="true">' +
      P.fin.paths.map(function (d) { return '<path fill="currentColor" d="' + d + '"/>'; }).join('') + '</svg>';
  };
  SP.drawWordmark = function (ctx, cx, top, height, color) {
    var v = P.wordmark.viewBox, s = height / v[3];
    ctx.save();
    ctx.translate(cx - (v[2] * s) / 2 - v[0] * s, top - v[1] * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    P.wordmark.paths.forEach(function (d) { ctx.fill(new Path2D(d)); });
    ctx.restore();
  };
  SP.drawFin = function (ctx, x, top, height, color) {
    var v = P.fin.viewBox, s = height / v[3];
    ctx.save();
    ctx.translate(x - v[0] * s, top - v[1] * s);
    ctx.scale(s, s);
    ctx.fillStyle = color;
    P.fin.paths.forEach(function (d) { ctx.fill(new Path2D(d)); });
    ctx.restore();
  };
})();
